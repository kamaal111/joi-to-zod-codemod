import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiObjectPatternToRecord(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays.compactMap(
    root.findAll({ rule: { pattern: `${joiImportIdentifierName}.object().pattern($$$${ARGS_META_IDENTIFIER})` } }),
    node => {
      const text = node.text();

      const patternCallIndex = text.indexOf('.pattern(');
      if (patternCallIndex === -1) return null;

      // Find the opening paren of .pattern(...) and the matching closing paren
      const argsStartIndex = text.indexOf('(', patternCallIndex) + 1;
      const closeParenIndex = text.lastIndexOf(')');
      if (argsStartIndex === 0 || closeParenIndex === -1 || closeParenIndex < argsStartIndex) return null;

      const argsText = text.slice(argsStartIndex, closeParenIndex);

      // Skip regex-literal keys: Zod's record key must be a Zod schema, not a RegExp.
      // Any regex literal starts with '/', which no valid Joi schema expression does.
      const firstArg = argsText.split(',')[0]?.trim();
      if (firstArg != null && firstArg.startsWith('/')) return null;

      return node.replace(`${joiImportIdentifierName}.record(${argsText})`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiObjectPatternToRecord;
