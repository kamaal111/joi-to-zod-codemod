import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import type { types } from '@kamaalio/kamaal';

function traverseUp(
  node: SgNode<TypesMap, Kinds<TypesMap>>,
  until: (node: SgNode<TypesMap, Kinds<TypesMap>>) => boolean,
): types.Optional<SgNode<TypesMap, Kinds<TypesMap>>> {
  let current = node.parent();
  if (current == null) return null;

  while (current != null) {
    const next: types.Optional<SgNode<TypesMap, Kinds<TypesMap>>> = current.parent();
    if (next == null) break;
    if (until(next)) {
      current = next;
      break;
    }

    current = next;
  }

  if (!until(current)) return null;
  return current;
}

export default traverseUp;
