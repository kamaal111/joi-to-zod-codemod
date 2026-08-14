import type { SgNode } from '@ast-grep/napi';
import type { Kinds, TypesMap } from '@ast-grep/napi/types/staticTypes.js';
import type { Modifications } from '@kamaalio/codemod-kit';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiProperties from '../utils/get-joi-properties.js';

type JoiProperty = SgNode<TypesMap, Kinds<TypesMap>>;

function contains(outer: JoiProperty, inner: JoiProperty): boolean {
  const outerRange = outer.range();
  const innerRange = inner.range();
  const isSameRange =
    outerRange.start.index === innerRange.start.index && outerRange.end.index === innerRange.end.index;

  return (
    !isSameRange && outerRange.start.index <= innerRange.start.index && outerRange.end.index >= innerRange.end.index
  );
}

/**
 * Presence only applies where Joi applies it: object keys and standalone schemas.
 *
 * A chain sitting in an argument list is a nested schema — the key type of a `record`,
 * the item type of an `array` — and marking those optional would change the contract.
 */
const PRESENCE_BEARING_PARENTS = new Set<string>(['pair', 'variable_declarator']);

async function joiAddOptional(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const candidates = getJoiProperties(root, { primitive: '*' }).filter(property => {
    const parentKind = property.parent()?.kind();
    if (parentKind == null || !PRESENCE_BEARING_PARENTS.has(String(parentKind))) return false;

    const text = property.text();

    return !text.includes('.required') && !text.trimEnd().endsWith('.optional()');
  });
  // An outer edit replaces the range its nested schemas live in, which would discard their
  // edits, so only the innermost chains are rewritten per pass.
  const innermost = candidates.filter(candidate => !candidates.some(other => contains(candidate, other)));
  const edits = innermost.map(property => property.replace(`${property.text()}.optional()`));
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  // Outer chains, and siblings sharing a chain's exact text, are reached on later passes.
  return joiAddOptional(committed);
}

export default joiAddOptional;
