import type { types } from '@kamaalio/kamaal';

export type CallArgumentsMatch = {
  /** Index of the leading `.` of the matched call. */
  startIndex: number;
  /** Index just past the closing `)` of the matched call. */
  endIndex: number;
  /** Argument source between the balanced parentheses, verbatim. */
  args: string;
};

const IDENTIFIER_PATTERN = /[$\w]/;
const REGEX_ALLOWED_PRECEDING_PATTERN = /[(,=:[!&|?{};+\-*/%<>~^]/;

function isIdentifierCharacter(character: types.Optional<string>): boolean {
  return character != null && IDENTIFIER_PATTERN.test(character);
}

/**
 * Decides whether a `/` at `index` opens a regex literal rather than acting as division.
 *
 * A regex may only follow an operator or an opening bracket, never a value, so the
 * preceding non-whitespace character is enough to disambiguate the forms that appear
 * in schema chains.
 */
function startsRegexLiteral(text: string, index: number): boolean {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const character = text[cursor];
    if (character == null || /\s/.test(character)) continue;

    return REGEX_ALLOWED_PRECEDING_PATTERN.test(character);
  }

  return true;
}

/**
 * Advances past the literal starting at `index`, returning the index just past its end.
 *
 * Returns `index` unchanged when no literal starts there.
 */
export function skipLiteralAt(text: string, index: number): number {
  const character = text[index];
  if (character == null) return index;

  const isQuote = character === "'" || character === '"' || character === '`';
  const isRegex = character === '/' && startsRegexLiteral(text, index);
  if (!isQuote && !isRegex) return index;

  const terminator = isRegex ? '/' : character;
  for (let cursor = index + 1; cursor < text.length; cursor += 1) {
    const current = text[cursor];
    if (current === '\\') {
      cursor += 1;
      continue;
    }
    if (isRegex && current === '[') {
      // A `/` inside a character class does not close the regex.
      cursor = skipRegexCharacterClass(text, cursor);
      continue;
    }
    if (current === terminator) return cursor + 1;
  }

  return text.length;
}

function skipRegexCharacterClass(text: string, index: number): number {
  for (let cursor = index + 1; cursor < text.length; cursor += 1) {
    const current = text[cursor];
    if (current === '\\') {
      cursor += 1;
      continue;
    }
    if (current === ']') return cursor;
  }

  return text.length;
}

/**
 * Finds the `.<name>(...)` call in `text` and returns its balanced argument span.
 *
 * Literals are skipped, so arguments containing parentheses, dots, or quotes
 * (`Object.values(Job)`, `value => value.slice(0, 3)`, `/^a\/b$/`) resolve correctly.
 */
function scanCallArguments(text: string, name: string, fromIndex = 0): types.Optional<CallArgumentsMatch> {
  const target = `.${name}`;

  for (let index = fromIndex; index < text.length; index += 1) {
    const skipped = skipLiteralAt(text, index);
    if (skipped !== index) {
      index = skipped - 1;
      continue;
    }

    if (!text.startsWith(target, index)) continue;
    // Guard against matching `.max` inside `.maxLength`, and `x.min` inside `ax.min`.
    if (isIdentifierCharacter(text[index + target.length])) continue;

    let parenthesisIndex = index + target.length;
    while (parenthesisIndex < text.length && /\s/.test(text[parenthesisIndex] ?? '')) parenthesisIndex += 1;
    if (text[parenthesisIndex] !== '(') continue;

    const closingIndex = findClosingParenthesis(text, parenthesisIndex);
    if (closingIndex == null) continue;

    return {
      startIndex: index,
      endIndex: closingIndex + 1,
      args: text.slice(parenthesisIndex + 1, closingIndex),
    };
  }

  return null;
}

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

export default scanCallArguments;
