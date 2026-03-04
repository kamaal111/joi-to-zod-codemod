import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';

const DEPRECATED_STRING_FORMAT_REPLACEMENTS: Array<{ deprecated: string; replacement: string }> = [
  { deprecated: 'z.string().uuid()', replacement: 'z.uuid()' },
  { deprecated: 'z.string().url()', replacement: 'z.url()' },
  { deprecated: 'z.string().datetime()', replacement: 'z.iso.datetime()' },
];

async function zodReplaceDeprecatedStringFormats(modifications: Modifications): Promise<Modifications> {
  let committed = modifications;
  for (const { deprecated, replacement } of DEPRECATED_STRING_FORMAT_REPLACEMENTS) {
    const root = committed.ast.root();
    const edits = arrays.compactMap(root.findAll({ rule: { pattern: deprecated } }), node => node.replace(replacement));
    committed = await commitEditModifications(edits, committed);
  }

  return committed;
}

export default zodReplaceDeprecatedStringFormats;
