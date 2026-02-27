import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiAlternativesToUnion(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays.compactMap(
    root.findAll({
      rule: { pattern: `${joiImportIdentifierName}.alternatives().try($$$${ARGS_META_IDENTIFIER})` },
    }),
    node => {
      const args = node.getMultipleMatches(ARGS_META_IDENTIFIER);
      if (args.length === 0) return null;

      const argsText = args.map(a => a.text()).join(', ');

      return node.replace(`${joiImportIdentifierName}.union([${argsText}])`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiAlternativesToUnion;
