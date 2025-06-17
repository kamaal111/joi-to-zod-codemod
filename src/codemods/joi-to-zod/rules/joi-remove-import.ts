import type { Modifications } from '../../types.js';
import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiImport from '../utils/get-joi-import.js';

async function joiRemoveImport(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const joiImport = getJoiImport(root);
  if (joiImport == null) return modifications;

  const lines = root.text().split('\n');
  const index = lines.findIndex(line => line.includes(joiImport.text()));
  if (index === -1) return modifications;

  lines.splice(index, 1);
  const edit = root.replace(lines.join('\n'));

  return commitEditModifications([edit], modifications);
}

export default joiRemoveImport;
