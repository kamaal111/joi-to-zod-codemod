import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';

const STRING_FORMAT_TRANSFORMATIONS: Array<{ from: string; to: string }> = [
  { from: 'z.string().uuid()', to: 'z.uuid()' },
  { from: 'z.string().url()', to: 'z.url()' },
  { from: 'z.string().datetime()', to: 'z.iso.datetime()' },
];

async function zodTransformStringFormats(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const edits = STRING_FORMAT_TRANSFORMATIONS.flatMap(({ from, to }) =>
    arrays.compactMap(root.findAll({ rule: { pattern: from } }), node => node.replace(to)),
  );

  return commitEditModifications(edits, modifications);
}

export default zodTransformStringFormats;
