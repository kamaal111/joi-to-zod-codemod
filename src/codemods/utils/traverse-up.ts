import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import type { types } from '@kamaalio/kamaal';

function traverseUp(
  node: SgNode<TypesMap, Kinds<TypesMap>>,
  until: (node: SgNode<TypesMap, Kinds<TypesMap>>) => boolean,
): types.Optional<SgNode<TypesMap, Kinds<TypesMap>>> {
  let current: types.Optional<SgNode<TypesMap, Kinds<TypesMap>>> = node.parent();

  while (current != null) {
    if (until(current)) return current;

    current = current.parent();
  }

  return null;
}

export default traverseUp;
