import { toEntries } from '../../../utils/objects.js';
import type { Optional } from '../../../utils/type-utils.js';
import type { Modifications } from '../../types.js';
import commitEditModifications from '../../utils/commit-edit-modifications.js';
import type { JoiPrimitives } from '../types.js';
import replaceJoiValidationWithZodEdits from '../utils/replace-joi-validation-with-zod-edits.js';

const JOI_VALIDATIONS_TO_ZOD_VALIDATION_MAPPING: Record<
  JoiPrimitives,
  Array<{ joi: string; zod: Optional<string> }>
> = {
  string: [
    { joi: 'alphanum()', zod: 'regex(/^[a-z0-9]+$/)' },
    { joi: 'uri()', zod: 'url()' },
  ],
  '*': [
    { joi: 'description($ARGS)', zod: 'describe($ARGS)' },
    { joi: 'allow(null)', zod: 'nullable()' },
    { joi: 'required(false)', zod: 'optional()' },
    // { joi: 'unknown(true)', zod: 'passthrough()' }, // Needs to be covered
    // { joi: 'unknown(false)', zod: 'strict()' }, // Needs to be covered
  ],
  number: [
    { joi: 'integer()', zod: 'int()' },
    { joi: 'greater($ARGS)', zod: 'gt($ARGS)' },
    { joi: 'less($ARGS)', zod: 'lt($ARGS)' },
    // { joi: 'precision($ARGS)', zod: 'step(1 / 10**$ARGS)' }, // Needs to be covered
  ],
};

async function joiValidationsToZodValidations(modifications: Modifications): Promise<Modifications> {
  const root = modifications.ast.root();
  const edits = toEntries(JOI_VALIDATIONS_TO_ZOD_VALIDATION_MAPPING)
    .map(([primitive, mappings]) => {
      return mappings.map(({ joi, zod }) => {
        return replaceJoiValidationWithZodEdits(root, {
          primitive,
          validationTargetKey: joi,
          zodValidation: zod,
        });
      });
    })
    .flat(2);

  return commitEditModifications(edits, modifications);
}

export default joiValidationsToZodValidations;
