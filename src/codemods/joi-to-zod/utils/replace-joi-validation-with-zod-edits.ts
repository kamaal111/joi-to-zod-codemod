import type { Edit, SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';

import type { JoiPrimitives } from '../types.js';
import getJoiProperties from './get-joi-properties.js';
import extractNameFromCallExpression from '../../utils/extract-name-from-call-expression.js';
import getJoiIdentifierName from './get-joi-identifier-name.js';
import extractArgsFromCallExpression from '../../utils/extract-args-from-call-expression.js';
import type { Optional } from '../../../utils/type-utils.js';

function replaceJoiValidationWithZodEdits(
  root: SgNode<TypesMap, Kinds<TypesMap>>,
  params: { primitive: JoiPrimitives; validationTargetKey: string; zodValidation: Optional<string> },
): Array<Edit> {
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return [];

  const validationTargetKeyName = extractNameFromCallExpression(params.validationTargetKey);
  if (validationTargetKeyName == null) return [];

  const validationTargetKeyArgs = extractArgsFromCallExpression(params.validationTargetKey);
  if (validationTargetKeyArgs == null) return [];

  const validationTargetKeyArgsIsMeta = validationTargetKeyArgs.includes('$');
  const shouldRemoveValidation = params.zodValidation == null;
  const zodReplacement = shouldRemoveValidation ? '' : `.${params.zodValidation}`;
  const zodReplacementComponents = zodReplacement.split('(');
  const zodReplacementName = zodReplacementComponents[0];
  const zodReplacementArgs = zodReplacementComponents.slice(1).join('').slice(undefined, -1);

  return getJoiProperties(root, { primitive: params.primitive, validationName: params.validationTargetKey }).map(
    callExpression => {
      const callExpressionText = callExpression.text();

      let finalValidationTargetKeyArgs = validationTargetKeyArgs;
      let finalZodReplacementArgs = zodReplacementArgs;
      if (validationTargetKeyArgsIsMeta) {
        const argumentsComponents = callExpressionText
          .split('.')
          .find(value => value.trim().startsWith(validationTargetKeyName))
          ?.split('(');
        if (argumentsComponents != null) {
          const foundArguments = argumentsComponents[1]?.split(')')[0];
          if (foundArguments != null) {
            if (validationTargetKeyArgs === zodReplacementArgs) {
              finalZodReplacementArgs = foundArguments;
            } else {
              const foundArgumentsComponents = foundArguments.split(',').map(arg => arg.trim());
              const metaMapping = validationTargetKeyArgs
                ?.split(',')
                .map(arg => arg.trim())
                .reduce<Record<string, string>>((acc, meta, index) => {
                  if (!meta.startsWith('$')) return acc;

                  const foundArgument = foundArgumentsComponents[index];
                  if (foundArgument == null) return acc;

                  return { ...acc, [meta]: foundArgument };
                }, {});
              finalZodReplacementArgs = zodReplacementArgs
                .split(',')
                .map(arg => {
                  const trimmed = arg.trim();
                  if (!trimmed.startsWith('$')) return arg;

                  return metaMapping[trimmed] ?? arg;
                })
                .join(',');
            }

            finalValidationTargetKeyArgs = foundArguments;
          }
        }
      }
      const finalValidationTargetKey = new RegExp(
        `.${validationTargetKeyName}\\(${finalValidationTargetKeyArgs}\\)`,
        'g',
      );
      const finalZodReplacement = shouldRemoveValidation ? '' : `${zodReplacementName}(${finalZodReplacementArgs})`;
      const replacement = callExpressionText
        .replace(finalValidationTargetKey, finalZodReplacement)
        .split('\n')
        .filter(value => value.trim().length > 0)
        .join('\n')
        .trim();

      return callExpression.replace(replacement);
    },
  );
}

export default replaceJoiValidationWithZodEdits;
