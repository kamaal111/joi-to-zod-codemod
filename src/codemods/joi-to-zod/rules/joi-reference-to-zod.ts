import type { Modifications } from '@kamaalio/codemod-kit';
import { arrays } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiIdentifierName from '../utils/get-joi-identifier-name.js';

async function joiReferenceToZod(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImportIdentifierName = getJoiIdentifierName(root);
  if (joiImportIdentifierName == null) return modifications;

  const edits = arrays
    .compactMap(root.findAll({ rule: { pattern: `${joiImportIdentifierName}.` } }), node => {
      return node
        .children()
        .find(child => child.text() === joiImportIdentifierName)
        ?.replace('z');
    })
    .flat();

  return commitEditModifications(edits, modifications);
}

export default joiReferenceToZod;
