import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.ts';
import innermostNodes from '../../utils/innermost-nodes.ts';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.ts';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiObjectKeysUnnest(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const matches = root.findAll({
    rule: { pattern: `${joiImportIdentifierName}.object().keys($${ARGS_META_IDENTIFIER})` },
  });
  const edits = arrays.compactMap(innermostNodes(matches), node => {
    const objectSchema = node.getMatch(ARGS_META_IDENTIFIER);
    if (objectSchema == null) return null;

    return node.replace(`${joiImportIdentifierName}.object(${objectSchema.text()}).strict()`);
  });
  const committed = await commitEditModifications(edits, modifications);
  if (committed.ast.root().text() === modifications.ast.root().text()) return modifications;

  return joiObjectKeysUnnest(committed);
}

export default joiObjectKeysUnnest;
