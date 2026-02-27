import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiArrayItemsUnnest(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays.compactMap(
    root.findAll({ rule: { pattern: `${joiImportIdentifierName}.array().items($${ARGS_META_IDENTIFIER})` } }),
    node => {
      const itemsSchema = node.getMatch(ARGS_META_IDENTIFIER);
      if (itemsSchema == null) return null;

      return node.replace(`${joiImportIdentifierName}.array(${itemsSchema.text()})`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiArrayItemsUnnest;
