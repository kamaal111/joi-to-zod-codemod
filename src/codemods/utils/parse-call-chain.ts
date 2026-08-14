import type { types } from '@kamaalio/kamaal';

import { skipLiteralAt } from './scan-call-arguments.js';

export type ChainSegment = {
  name: string;
  /** Argument source between the balanced parentheses, verbatim. */
  args: string;
  /** Index of the leading `.` of this segment. */
  startIndex: number;
  /** Index just past the closing `)` of this segment. */
  endIndex: number;
};

const IDENTIFIER_PATTERN = /[$\w]/;

function findClosingParenthesis(text: string, openingIndex: number): types.Optional<number> {
  let depth = 0;

  for (let index = openingIndex; index < text.length; index += 1) {
    const skipped = skipLiteralAt(text, index);
    if (skipped !== index) {
      index = skipped - 1;
      continue;
    }

    const character = text[index];
    if (character === '(' || character === '[' || character === '{') depth += 1;
    if (character === ')' || character === ']' || character === '}') {
      depth -= 1;
      if (depth === 0) return character === ')' ? index : null;
    }
  }

  return null;
}

/**
 * Reads the `.name(...)` segments belonging to the chain rooted at `rootEndIndex`.
 *
 * Only the chain's own segments are returned; nested chains living inside a segment's
 * arguments stay untouched inside `args`, so callers can rewrite one chain without
 * disturbing the schemas nested within it.
 */
function parseCallChain(text: string, rootEndIndex: number): Array<ChainSegment> {
  const segments: Array<ChainSegment> = [];
  let cursor = rootEndIndex;

  while (cursor < text.length) {
    let dotIndex = cursor;
    while (dotIndex < text.length && /\s/.test(text[dotIndex] ?? '')) dotIndex += 1;
    if (text[dotIndex] !== '.') break;

    let nameEnd = dotIndex + 1;
    while (nameEnd < text.length && IDENTIFIER_PATTERN.test(text[nameEnd] ?? '')) nameEnd += 1;
    if (nameEnd === dotIndex + 1) break;

    let parenthesisIndex = nameEnd;
    while (parenthesisIndex < text.length && /\s/.test(text[parenthesisIndex] ?? '')) parenthesisIndex += 1;
    if (text[parenthesisIndex] !== '(') break;

    const closingIndex = findClosingParenthesis(text, parenthesisIndex);
    if (closingIndex == null) break;

    segments.push({
      name: text.slice(dotIndex + 1, nameEnd),
      args: text.slice(parenthesisIndex + 1, closingIndex),
      startIndex: dotIndex,
      endIndex: closingIndex + 1,
    });
    cursor = closingIndex + 1;
  }

  return segments;
}

export default parseCallChain;
