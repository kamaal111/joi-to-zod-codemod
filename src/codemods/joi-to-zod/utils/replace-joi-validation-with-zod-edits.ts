import type { Edit, SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import { arrays, type types } from '@kamaalio/kamaal';

import type { JoiPrimitives } from '../types.js';
import getJoiIdentifierName from './get-joi-identifier-name.js';
import getJoiProperties from './get-joi-properties.js';
import extractArgsFromCallExpression from '../../utils/extract-args-from-call-expression.js';
import extractNameFromCallExpression from '../../utils/extract-name-from-call-expression.js';
import scanCallArguments from '../../utils/scan-call-arguments.js';
import splitArguments from '../../utils/split-arguments.js';

/**
 * Substitutes `$META` tokens in a Zod replacement with the arguments found in the source.
 *
 * A lone meta token (`pattern($ARGS)` -> `regex($ARGS)`) maps to the whole argument
 * string, so replacements are free to contain their own parentheses and commas
 * (`transform(value => Number(value.toFixed($ARGS)))`). Multiple tokens map positionally.
 */
function substituteMetaArguments(zodValidation: string, metaSpecification: string, foundArguments: string): string {
  const metaTokens = splitArguments(metaSpecification)
    .map(token => token.trim())
    .filter(token => token.startsWith('$'));
  if (metaTokens.length === 0) return zodValidation;

  const isSingleWholeToken = metaTokens.length === 1 && metaSpecification.trim() === metaTokens[0];
  if (isSingleWholeToken) return zodValidation.replaceAll(metaTokens[0] as string, foundArguments);

  const foundArgumentsComponents = splitArguments(foundArguments).map(argument => argument.trim());

  return metaTokens.reduce((accumulator, token, index) => {
    const foundArgument = foundArgumentsComponents[index];
    if (foundArgument == null) return accumulator;

    return accumulator.replaceAll(token, foundArgument);
  }, zodValidation);
}

function normalizeArguments(args: string): string {
  return splitArguments(args)
    .map(argument => argument.trim())
    .join(',');
}

/**
 * Rewrites every `.<validationName>(...)` call in `chainText` that matches the target signature.
 *
 * Returns `chainText` unchanged when nothing matches.
 */
function rewriteChain(
  chainText: string,
  params: {
    validationName: string;
    validationArgs: string;
    validationArgsIsMeta: boolean;
    zodValidation: types.Optional<string>;
    joiIdentifierName: string;
  },
): string {
  const expectedArgs = normalizeArguments(params.validationArgs);

  let result = chainText;
  let searchIndex = 0;
  while (searchIndex < result.length) {
    const match = scanCallArguments(result, params.validationName, searchIndex);
    if (match == null) break;

    if (!params.validationArgsIsMeta && normalizeArguments(match.args) !== expectedArgs) {
      searchIndex = match.startIndex + 1;
      continue;
    }

    // `Joi.required()` inside a `when` clause is a schema in its own right, not a modifier
    // on one. Deleting it would leave a bare `Joi` behind once the import is dropped.
    // Renames are still fine on a base call, so this only guards removals.
    const isBaseCall = result.slice(0, match.startIndex).endsWith(params.joiIdentifierName);
    if (isBaseCall && params.zodValidation == null) {
      searchIndex = match.endIndex;
      continue;
    }

    const replacement =
      params.zodValidation == null
        ? ''
        : `.${
            params.validationArgsIsMeta
              ? substituteMetaArguments(params.zodValidation, params.validationArgs, match.args)
              : params.zodValidation
          }`;

    result = result.slice(0, match.startIndex) + replacement + result.slice(match.endIndex);
    searchIndex = match.startIndex + replacement.length;
  }

  if (result === chainText) return chainText;

  return result
    .split('\n')
    .filter(value => value.trim().length > 0)
    .join('\n')
    .trim();
}

function replaceJoiValidationWithZodEdits(
  root: SgNode<TypesMap, Kinds<TypesMap>>,
  params: { primitive: JoiPrimitives; validationTargetKey: string; zodValidation: types.Optional<string> },
): Array<Edit> {
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return [];

  const validationTargetKeyName = extractNameFromCallExpression(params.validationTargetKey);
  if (validationTargetKeyName == null) return [];

  const validationTargetKeyArgs = extractArgsFromCallExpression(params.validationTargetKey);
  if (validationTargetKeyArgs == null) return [];

  const joiProperties = getJoiProperties(root, {
    primitive: params.primitive,
    validationName: params.validationTargetKey,
  });

  return arrays.compactMap(joiProperties, callExpression => {
    const callExpressionText = callExpression.text();
    const replacement = rewriteChain(callExpressionText, {
      validationName: validationTargetKeyName,
      validationArgs: validationTargetKeyArgs,
      validationArgsIsMeta: validationTargetKeyArgs.includes('$'),
      zodValidation: params.zodValidation,
      joiIdentifierName: joiImportIdentifierName,
    });
    if (replacement === callExpressionText) return null;

    return callExpression.replace(replacement);
  });
}

export default replaceJoiValidationWithZodEdits;
