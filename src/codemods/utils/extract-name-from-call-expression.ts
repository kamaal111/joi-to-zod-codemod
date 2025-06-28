import type { types } from '@kamaalio/kamaal';

function extractNameFromCallExpression(callExpression: types.Optional<string>): types.Optional<string> {
  if (callExpression == null) return null;

  const isCallExpression = callExpression.includes('(');
  if (!isCallExpression) return callExpression;

  return callExpression.split('(')[0];
}

export default extractNameFromCallExpression;
