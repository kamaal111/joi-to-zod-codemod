import type { Optional } from './type-utils.js';

export function isUndefinedOrNull<T>(maybeValue: Optional<T>): maybeValue is undefined | null {
  return !isNotUndefinedOrNull(maybeValue);
}

export function isNotUndefinedOrNull<T>(maybeValue: Optional<T>): maybeValue is T {
  return maybeValue != null;
}
