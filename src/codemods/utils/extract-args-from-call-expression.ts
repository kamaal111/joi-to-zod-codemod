import type { types } from '@kamaalio/kamaal';

function extractArgsFromCallExpression(callExpression: types.Optional<string>): types.Optional<string> {
  if (callExpression == null) return null;

  const trimmed = callExpression.trim();
  const isCallExpression = trimmed.includes('(');
  if (!isCallExpression) return null;
  if (trimmed.length === 2) return null;

  return trimmed.split('(').slice(1).join('(').slice(undefined, -1);
}

export default extractArgsFromCallExpression;
