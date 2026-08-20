import type { Modifications } from '@kamaalio/codemod-kit';

import commitEditModifications from '../../utils/commit-edit-modifications.ts';
import innermostNodes from '../../utils/innermost-nodes.ts';
import getJoiProperties from '../utils/get-joi-properties.ts';

const PRESENCE_BEARING_PARENTS = new Set<string>(['pair', 'variable_declarator']);

async function joiAddOptional(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const candidates = getJoiProperties(root, { primitive: '*' }).filter(property => {
    const parentKind = property.parent()?.kind();
    if (parentKind == null || !PRESENCE_BEARING_PARENTS.has(String(parentKind))) return false;

    const text = property.text();

    return !text.includes('.required') && !text.trimEnd().endsWith('.optional()');
  });
  const edits = innermostNodes(candidates).map(property => property.replace(`${property.text()}.optional()`));
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  return joiAddOptional(committed);
}

export default joiAddOptional;
