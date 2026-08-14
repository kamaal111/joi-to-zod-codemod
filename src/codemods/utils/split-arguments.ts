import { skipLiteralAt } from './scan-call-arguments.js';

/**
 * Splits an argument list on top-level commas.
 *
 * Commas nested inside parentheses, brackets, braces, or literals belong to an inner
 * expression and never split, so `z.string(), { name: 'a', invert: true }` yields two
 * arguments rather than three.
 */
function splitArguments(args: string): Array<string> {
  if (args.trim().length === 0) return [];

  const results: Array<string> = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < args.length; index += 1) {
    const skipped = skipLiteralAt(args, index);
    if (skipped !== index) {
      index = skipped - 1;
      continue;
    }

    const character = args[index];
    if (character === '(' || character === '[' || character === '{') depth += 1;
    if (character === ')' || character === ']' || character === '}') depth -= 1;
    if (character === ',' && depth === 0) {
      results.push(args.slice(start, index));
      start = index + 1;
    }
  }
  results.push(args.slice(start));

  return results;
}

export default splitArguments;
