import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiPrimitive from '../utils/get-joi-primitive.js';
import getJoiProperties from '../utils/get-joi-properties.js';

const ARGS_META_IDENTIFIER = 'ARGS';
const CHAIN_META_IDENTIFIER = 'CHAIN';

async function joiCheckToEnum(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays.compactMap(
    getJoiProperties(root, { primitive: '*', validationName: 'valid($ARGS)' }),
    property => {
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

      const isSpread = argsText.trimStart().startsWith('...');
      const wrappedArgs = isSpread
        ? `[${argsText} as [${primitive}, ...Array<${primitive}>]]`
        : `[${argsText}] as [${primitive}, ...Array<${primitive}>]`;

      return validCallNode.replace(`${chainNode.text()}.enum(${wrappedArgs})`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiCheckToEnum;
