import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';

const STRING_FORMAT_TRANSFORMATIONS: Array<{ from: string; to: string }> = [
  { from: 'z.string().uuid()', to: 'z.uuid()' },
  { from: 'z.string().url()', to: 'z.url()' },
  { from: 'z.string().datetime()', to: 'z.iso.datetime()' },
];

async function zodTransformStringFormats(modifications: Modifications): Promise<Modifications> {
  let committed = modifications;
  for (const { from, to } of STRING_FORMAT_TRANSFORMATIONS) {
    const root = committed.ast.root();
    const edits = arrays.compactMap(root.findAll({ rule: { pattern: from } }), node => node.replace(to));
    committed = await commitEditModifications(edits, committed);
  }

  return committed;
}

export default zodTransformStringFormats;
