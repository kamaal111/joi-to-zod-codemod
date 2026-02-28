import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiObjectPatternToRecord(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const patternPrefix = `${joiImportIdentifierName}.object().pattern(`;

  const edits = arrays.compactMap(
    root.findAll({ rule: { pattern: `${joiImportIdentifierName}.object().pattern($$$${ARGS_META_IDENTIFIER})` } }),
    node => {
      const text = node.text();
      if (!text.startsWith(patternPrefix) || !text.endsWith(')')) return null;

      const argsText = text.slice(patternPrefix.length, -1);

      return node.replace(`${joiImportIdentifierName}.record(${argsText})`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiObjectPatternToRecord;
