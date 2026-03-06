import type { Modifications } from '@kamaalio/codemod-kit';
import { objects } from '@kamaalio/kamaal';
import type { types } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import type { JoiPrimitives } from '../types.js';
import replaceJoiValidationWithZodEdits from '../utils/replace-joi-validation-with-zod-edits.js';

const JOI_VALIDATIONS_TO_ZOD_VALIDATION_MAPPING: Record<
  JoiPrimitives,
  Array<{ joi: string; zod: types.Optional<string> }>
> = {
  string: [
    { joi: 'alphanum()', zod: 'regex(/^[a-z0-9]+$/)' },
    { joi: 'uri()', zod: 'url()' },
    { joi: 'guid()', zod: 'uuid()' },
    { joi: 'lowercase()', zod: 'toLowerCase()' },
    { joi: 'uppercase()', zod: 'toUpperCase()' },
    { joi: 'isoDate()', zod: 'datetime()' },
    { joi: 'token()', zod: 'regex(/^\\w+$/)' },
    { joi: 'pattern($ARGS)', zod: 'regex($ARGS)' },
    { joi: "case('lower')", zod: 'toLowerCase()' },
    { joi: "case('upper')", zod: 'toUpperCase()' },
    { joi: 'domain()', zod: 'hostname()' },
  ],
  '*': [
    { joi: 'description($ARGS)', zod: 'describe($ARGS)' },
    { joi: 'allow(null)', zod: 'nullable()' },
    { joi: 'required(false)', zod: 'optional()' },
    { joi: 'unknown(true)', zod: 'passthrough()' },
    { joi: 'unknown(false)', zod: 'strict()' },
    { joi: 'bool()', zod: 'boolean()' },
    { joi: 'failover($ARGS)', zod: 'catch($ARGS)' },
    { joi: 'func()', zod: 'function()' },
  ],
  number: [
    { joi: 'integer()', zod: 'int()' },
    { joi: 'greater($ARGS)', zod: 'gt($ARGS)' },
    { joi: 'less($ARGS)', zod: 'lt($ARGS)' },
    { joi: 'precision($ARGS)', zod: 'multipleOf(1 / 10**$ARGS)' },
    { joi: 'multiple($ARGS)', zod: 'multipleOf($ARGS)' },
  ],
  array: [],
  date: [],
  object: [],
  boolean: [],
};

async function joiValidationsToZodValidations(modifications: Modifications): Promise<Modifications> {
  let committed = modifications;
  const mappings = objects.toEntries(JOI_VALIDATIONS_TO_ZOD_VALIDATION_MAPPING).flatMap(([primitive, values]) => {
    return values.map(({ joi, zod }) => ({ primitive, joi, zod }));
  });
  for (const { primitive, joi, zod } of mappings) {
    const root = committed.ast.root();
    const edits = replaceJoiValidationWithZodEdits(root, {
      primitive,
      validationTargetKey: joi,
      zodValidation: zod,
    });
    committed = await commitEditModifications(edits, committed);
  }

  return committed;
}

export default joiValidationsToZodValidations;
