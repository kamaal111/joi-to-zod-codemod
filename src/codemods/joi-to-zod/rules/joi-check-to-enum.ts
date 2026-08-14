import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiPrimitive from '../utils/get-joi-primitive.js';
import getJoiProperties from '../utils/get-joi-properties.js';

const ARGS_META_IDENTIFIER = 'ARGS';
const CHAIN_META_IDENTIFIER = 'CHAIN';

async function joiCheckToEnum(modifications: Modifications): Promise<Modifications> {
  const joiImportIdentifierName = getJoiIdentifierName(modifications.ast.root());
  if (joiImportIdentifierName == null) return modifications;

  return convertChecksToEnums(modifications, joiImportIdentifierName);
}

async function convertChecksToEnums(
  modifications: Modifications,
  joiImportIdentifierName: string,
): Promise<Modifications> {
  const properties = getJoiProperties(modifications.ast.root(), { primitive: '*', validationName: 'valid($ARGS)' });
  const edits = arrays.compactMap(properties, property => {
    const primitive = getJoiPrimitive(property, joiImportIdentifierName);
    if (primitive == null) return null;

    const validCallNode = property.find({
      rule: { pattern: `$${CHAIN_META_IDENTIFIER}.valid($$$${ARGS_META_IDENTIFIER})` },
    });
    if (validCallNode == null) return null;

    const chainNode = validCallNode.getMatch(CHAIN_META_IDENTIFIER);
    if (chainNode == null) return null;

    const argNodes = validCallNode.getMultipleMatches(ARGS_META_IDENTIFIER).filter(n => n.isNamed());
    const argsText = argNodes.map(n => n.text()).join(', ');
    if (primitive !== 'string') {
      const literals = argNodes.map(node => `${joiImportIdentifierName}.literal(${node.text()})`);
      if (literals.length === 0) return null;

      const replacement =
        literals.length === 1 ? literals[0] : `${joiImportIdentifierName}.union([${literals.join(', ')}])`;

      return validCallNode.replace(replacement);
    }

    const trimmedArgsText = argsText.trimStart();
    const isSpread = trimmedArgsText.startsWith('...');
    const wrappedArgs = isSpread
      ? `${trimmedArgsText.slice(3)} as [${primitive}, ...Array<${primitive}>]`
      : `[${argsText}] as [${primitive}, ...Array<${primitive}>]`;

    return validCallNode.replace(`${chainNode.text()}.enum(${wrappedArgs})`);
  });
  const updated = await commitEditModifications(edits, modifications);
  const isUnchanged = updated.ast.root().text() === modifications.ast.root().text();
  if (isUnchanged) return modifications;

  return convertChecksToEnums(updated, joiImportIdentifierName);
}

export default joiCheckToEnum;
