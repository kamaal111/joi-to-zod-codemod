import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiAlternativesToUnion(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const tryPrefix = `${joiImportIdentifierName}.alternatives().try(`;

  const edits = arrays.compactMap(
    root.findAll({
      rule: { pattern: `${joiImportIdentifierName}.alternatives().try($$$${ARGS_META_IDENTIFIER})` },
    }),
    node => {
      const text = node.text();
      if (!text.startsWith(tryPrefix) || !text.endsWith(')')) return null;

      const argsText = text.slice(tryPrefix.length, -1);

      return node.replace(`${joiImportIdentifierName}.union([${argsText}])`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiAlternativesToUnion;
