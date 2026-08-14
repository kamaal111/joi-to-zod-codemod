import type { Modifications } from '@kamaalio/codemod-kit';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import getJoiProperties from '../utils/get-joi-properties.js';

const UNSUPPORTED_VALIDATIONS = [
  {
    name: 'when',
    guidance: 'replace it with a discriminated union or object-level superRefine',
  },
  {
    name: 'custom',
    guidance: 'replace its Joi helper callback with refine or superRefine',
  },
  {
    name: 'assert',
    guidance: 'replace its cross-field assertion with superRefine',
  },
];

async function joiAddManualMigrationTodo(modifications: Modifications): Promise<Modifications> {
  return addManualMigrationTodos(modifications, 0);
}

async function addManualMigrationTodos(modifications: Modifications, validationIndex: number): Promise<Modifications> {
  const validation = UNSUPPORTED_VALIDATIONS[validationIndex];
  if (validation == null) return modifications;

  const { name, guidance } = validation;
  const properties = getJoiProperties(modifications.ast.root(), {
    primitive: '*',
    validationName: `${name}($ARGS)`,
  });
  const edits = properties.map(property => {
    return property.replace(`/* TODO(joi-to-zod): Manually migrate ${name}(); ${guidance}. */ ${property.text()}`);
  });
  const committed = await commitEditModifications(edits, modifications);

  return addManualMigrationTodos(committed, validationIndex + 1);
}

export default joiAddManualMigrationTodo;
