import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

// Returns the index past the end of a regex literal (including any flags) that
// starts at position 0 of `text`, or -1 if no valid regex literal is found.
function findRegexLiteralEnd(text: string): number {
  let i = 1; // skip opening '/'
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    } // skip escaped chars
    if (text[i] === '/') {
      i++; // move past closing '/'
      while (i < text.length && /[a-z]/i.test(text[i]!)) i++; // skip flags
      return i;
    }
    i++;
  }
  return -1;
}

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

      // When the key is a regex literal, rewrite it to Joi.string().regex(regex)
      // so the downstream joiReferenceToZod step produces z.record(z.string().regex(...), ...)
      let finalArgsText = argsText;
      const trimmedArgs = argsText.trimStart();
      if (trimmedArgs.startsWith('/')) {
        const regexEnd = findRegexLiteralEnd(trimmedArgs);
        if (regexEnd === -1) return null;
        const regexLiteral = trimmedArgs.slice(0, regexEnd);
        const restArgs = trimmedArgs.slice(regexEnd).replace(/^\s*,\s*/, '');
        finalArgsText = `${joiImportIdentifierName}.string().regex(${regexLiteral}), ${restArgs}`;
      }

      return node.replace(`${joiImportIdentifierName}.record(${finalArgsText})`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiObjectPatternToRecord;
