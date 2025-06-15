import { compactMap } from '../../../utils/arrays.js';
import type { Modifications } from '../../types.js';
import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

const ARGS_META_IDENTIFIER = 'ARGS';

async function joiObjectKeysUnnest(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = compactMap(
    root.findAll({ rule: { pattern: `${joiImportIdentifierName}.object().keys($${ARGS_META_IDENTIFIER})` } }),
    node => {
      const objectSchema = node.getMatch(ARGS_META_IDENTIFIER);
      if (objectSchema == null) return null;

      return node.replace(`${joiImportIdentifierName}.object(${objectSchema.text()}).strict()`);
    },
  );

  return commitEditModifications(edits, modifications);
}

export default joiObjectKeysUnnest;
