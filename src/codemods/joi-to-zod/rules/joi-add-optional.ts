import type { Modifications } from '../../types.js';
import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiProperties from '../utils/get-joi-properties.js';

async function joiAddOptional(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const edits = getJoiProperties(root, { primitive: '*' })
    .filter(property => !property.text().includes('.required'))
    .map(property => {
      const replacement = `${property.text()}.optional()`;

      return property.replace(replacement);
    });

  return commitEditModifications(edits, modifications);
}

export default joiAddOptional;
