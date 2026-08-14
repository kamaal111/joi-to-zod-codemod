import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

async function joiForbiddenToNever(modifications: Modifications): Promise<Modifications> {
  const joiImportIdentifierName = getJoiIdentifierName(modifications.ast.root());
  if (joiImportIdentifierName == null) return modifications;

  const nodes = modifications.ast.root().findAll({ rule: { pattern: `${joiImportIdentifierName}.forbidden()` } });
  const edits = arrays.compactMap(nodes, node => node.replace(`${joiImportIdentifierName}.never()`));

  return commitEditModifications(edits, modifications);
}

export default joiForbiddenToNever;
