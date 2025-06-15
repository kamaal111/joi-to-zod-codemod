import type { Optional } from './type-utils.js';

export function compactMap<TargetElement, TransformedElement>(
  array: Array<TargetElement>,
  transformer: (value: TargetElement) => Optional<TransformedElement>,
): Array<TransformedElement> {
  const newArray: Array<TransformedElement> = [];
  array.forEach(item => {
    const transformedItem = transformer(item);
    if (transformedItem == null) return;

    newArray.push(transformedItem);
  });

  return newArray;
}
