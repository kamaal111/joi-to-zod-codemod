import type { Modifications } from '../../types.js';
import commitEditModifications from '../../utils/commit-edit-modifications.js';
import removeJoiValidationEdits from '../utils/remove-joi-validation-edits.js';

async function joiRemoveRequired(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const edits = removeJoiValidationEdits(root, { primitive: '*', validationTargetKey: 'required()' });

  return commitEditModifications(edits, modifications);
}

export default joiRemoveRequired;
