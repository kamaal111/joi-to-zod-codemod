import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import parseCallChain from '../../utils/parse-call-chain.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';
import getJoiProperties from '../utils/get-joi-properties.js';

const DATE_BOUNDS = new Set(['min', 'max', 'greater', 'less']);
const ZOD_BOUNDS: Record<string, string> = { min: 'min', max: 'max', greater: 'min', less: 'max' };

/**
 * Wraps a Joi date bound so it reaches Zod as a `Date`.
 *
 * Joi accepts ISO strings and the literal `'now'`; `z.date().min()` requires a `Date`.
 */
function coerceBoundArgument(args: string): string {
  const trimmed = args.trim();
  if (trimmed.length === 0) return trimmed;
  if (trimmed === "'now'" || trimmed === '"now"') return 'new Date()';

  const isStringLiteral = /^(['"]).*\1$/s.test(trimmed);
  const isNumberLiteral = /^-?\d+(\.\d+)?$/.test(trimmed);
  if (isStringLiteral || isNumberLiteral) return `new Date(${trimmed})`;

  // Already a Date, a reference, or an expression: leave it for the author to judge.
  return trimmed;
}

/**
 * Rewrites `Joi.date()` chains to `Joi.coerce.date()`, converting bound arguments.
 *
 * Returns `chainText` unchanged when the chain is not rooted at a date.
 */
function rewriteDateChain(chainText: string, joiIdentifierName: string): string {
  for (let index = 0; index < chainText.length; index += 1) {
    if (!chainText.startsWith(joiIdentifierName, index)) continue;
    if (index > 0 && /[$\w.]/.test(chainText[index - 1] ?? '')) continue;

    const segments = parseCallChain(chainText, index + joiIdentifierName.length);
    const baseSegment = segments[0];
    if (baseSegment == null || baseSegment.name !== 'date' || baseSegment.args.trim().length > 0) continue;

    // Rewrite right to left so earlier segment indices stay valid.
    const rewritten = segments
      .slice(1)
      .filter(segment => DATE_BOUNDS.has(segment.name))
      .reverse()
      .reduce((accumulator, segment) => {
        const zodName = ZOD_BOUNDS[segment.name] ?? segment.name;
        const replacement = `.${zodName}(${coerceBoundArgument(segment.args)})`;

        return accumulator.slice(0, segment.startIndex) + replacement + accumulator.slice(segment.endIndex);
      }, chainText);

    return rewritten.slice(0, baseSegment.startIndex) + '.coerce.date()' + rewritten.slice(baseSegment.endIndex);
  }

  return chainText;
}

async function joiDateToCoerceDate(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiIdentifierName = getJoiIdentifierName(root);
  if (joiIdentifierName == null) return modifications;

  const properties = getJoiProperties(root, { primitive: 'date' });
  const edits = arrays.compactMap(properties, property => {
    const propertyText = property.text();
    const replacement = rewriteDateChain(propertyText, joiIdentifierName);
    if (replacement === propertyText) return null;

    return property.replace(replacement);
  });
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  return joiDateToCoerceDate(committed);
}

export default joiDateToCoerceDate;
