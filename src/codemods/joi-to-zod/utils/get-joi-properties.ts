import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';

import type { JoiPrimitives } from '../types.js';
import traverseUp from '../../utils/traverse-up.js';
import extractNameFromCallExpression from '../../utils/extract-name-from-call-expression.js';
import getJoiIdentifierName from './get-joi-identifier-name.js';
import extractArgsFromCallExpression from '../../utils/extract-args-from-call-expression.js';

function getJoiProperties(
  root: SgNode<TypesMap, Kinds<TypesMap>>,
  params: { primitive?: JoiPrimitives; validationName?: string },
): Array<SgNode<TypesMap, Kinds<TypesMap>>> {
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return [];

  let propertyIdentifiers = root.findAll({ rule: { kind: 'property_identifier' } });
  if (propertyIdentifiers.length === 0) return [];

  const validationName = extractNameFromCallExpression(params.validationName);
  const validationArgs = extractArgsFromCallExpression(params.validationName);
  const validationArgsIsMeta = validationArgs?.includes('$') ?? false;
  if (validationName != null) {
    propertyIdentifiers = propertyIdentifiers.filter(propertyIdentifier => {
      const sameSignature =
        traverseUp(propertyIdentifier, node => node.kind() === 'call_expression')
          ?.text()
          .split('.')
          .reverse()
          .find(transformation => {
            if (extractNameFromCallExpression(transformation) !== validationName) return false;

            const transformationArgs = extractArgsFromCallExpression(transformation);
            if (transformationArgs == null && validationArgs == null) return true;

            const transformationArgsIsMeta = transformationArgs?.includes('$') ?? false;
            if (transformationArgsIsMeta || validationArgsIsMeta) return true;

            return true;
          }) != null;

      return propertyIdentifier.text() === validationName && sameSignature;
    });
  }

  return propertyIdentifiers.reduce<{ results: Array<SgNode<TypesMap, Kinds<TypesMap>>>; checkedIn: Set<string> }>(
    (acc, propertyIdentifier) => {
      const pairOrVariableDeclaratorNode = traverseUp(
        propertyIdentifier,
        node => node.kind() === 'pair' || node.kind() === 'variable_declarator',
      );
      if (pairOrVariableDeclaratorNode == null) return acc;

      const memberExpression = pairOrVariableDeclaratorNode.find({ rule: { kind: 'member_expression' } });
      if (memberExpression == null) return acc;

      const memberExpressionText = memberExpression.text().trim();
      if (
        !memberExpressionText.startsWith(joiImportIdentifierName) &&
        (params.primitive != null ||
          params.primitive !== '*' ||
          !memberExpressionText.includes(`.${params.primitive}()`))
      ) {
        return acc;
      }

      const callExpression = memberExpression.parent();
      if (callExpression == null) return acc;
      if (callExpression.kind() !== 'call_expression') throw new Error('Unexpected kind found');

      const callExpressionText = callExpression.text();
      if (acc.checkedIn.has(callExpressionText)) return acc;

      acc.results.push(callExpression);
      acc.checkedIn.add(callExpressionText);

      return acc;
    },
    { results: [], checkedIn: new Set([]) },
  ).results;
}

export default getJoiProperties;
