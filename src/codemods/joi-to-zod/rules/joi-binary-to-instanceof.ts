import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

async function joiBinaryToInstanceof(modifications: Modifications): Promise<Modifications> {
  const joiImportIdentifierName = getJoiIdentifierName(modifications.ast.root());
  if (joiImportIdentifierName == null) return modifications;

  const binaries = modifications.ast.root().findAll({ rule: { pattern: `${joiImportIdentifierName}.binary()` } });
  const edits = arrays.compactMap(binaries, node => node.replace(`${joiImportIdentifierName}.instanceof(Buffer)`));

  return commitEditModifications(edits, modifications);
}

export default joiBinaryToInstanceof;
