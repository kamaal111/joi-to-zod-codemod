import type { Modifications } from '@kamaalio/codemod-kit';
import { objects } from '@kamaalio/kamaal';
import type { types } from '@kamaalio/kamaal';

import commitEditModifications from '../../utils/commit-edit-modifications.js';
import type { JoiPrimitives } from '../types.js';
import replaceJoiValidationWithZodEdits from '../utils/replace-joi-validation-with-zod-edits.js';

type JoiValidationMapping = {
  primitive: JoiPrimitives;
  joi: string;
  zod: types.Optional<string>;
};

const JOI_VALIDATIONS_TO_ZOD_VALIDATION_MAPPING: Record<
  JoiPrimitives,
  Array<{ joi: string; zod: types.Optional<string> }>
> = {
  string: [
    // Joi's alphanum accepts both cases; a lowercase-only class would reject 'ABC123'.
    { joi: 'alphanum()', zod: 'regex(/^[a-zA-Z0-9]+$/)' },
    { joi: 'lowercase()', zod: 'toLowerCase()' },
    { joi: 'uppercase()', zod: 'toUpperCase()' },
    { joi: 'token()', zod: 'regex(/^\\w+$/)' },
    { joi: 'pattern($ARGS)', zod: 'regex($ARGS)' },
    { joi: "allow('')", zod: null },
    { joi: "case('lower')", zod: 'toLowerCase()' },
    { joi: "case('upper')", zod: 'toUpperCase()' },
    { joi: 'ip()', zod: 'refine(value => z.ipv4().safeParse(value).success || z.ipv6().safeParse(value).success)' },
    { joi: 'truncate()', zod: null },
    { joi: 'normalize()', zod: 'transform(value => value.normalize())' },
  ],
  '*': [
    { joi: 'description($ARGS)', zod: 'describe($ARGS)' },
    { joi: 'label($ARGS)', zod: 'describe($ARGS)' },
    { joi: 'allow(null)', zod: 'nullable()' },
    { joi: 'required(false)', zod: 'optional()' },
    { joi: 'unknown(true)', zod: 'passthrough()' },
    { joi: 'unknown(false)', zod: 'strict()' },
    { joi: 'unknown()', zod: 'passthrough()' },
    { joi: 'bool()', zod: 'boolean()' },
    { joi: 'failover($ARGS)', zod: 'catch($ARGS)' },
    { joi: 'func()', zod: 'function()' },
    { joi: 'invalid($ARGS)', zod: 'refine(value => ![$ARGS].includes(value))' },
    { joi: 'disallow($ARGS)', zod: 'refine(value => ![$ARGS].includes(value))' },
    { joi: 'raw()', zod: null },
    { joi: 'cast($ARGS)', zod: null },
    { joi: 'meta($ARGS)', zod: null },
    { joi: 'tag($ARGS)', zod: null },
    { joi: 'note($ARGS)', zod: null },
    { joi: 'example($ARGS)', zod: null },
    { joi: 'prefs($ARGS)', zod: null },
  ],
  number: [
    { joi: 'integer()', zod: 'int()' },
    { joi: 'greater($ARGS)', zod: 'gt($ARGS)' },
    { joi: 'less($ARGS)', zod: 'lt($ARGS)' },
    // Joi rounds to the given precision rather than rejecting; multipleOf would reject.
    { joi: 'precision($ARGS)', zod: 'transform(value => Number(value.toFixed($ARGS)))' },
    { joi: 'multiple($ARGS)', zod: 'multipleOf($ARGS)' },
    { joi: 'port()', zod: 'int().min(0).max(65535)' },
    { joi: "sign('positive')", zod: 'positive()' },
    { joi: "sign('negative')", zod: 'negative()' },
    { joi: 'unsafe()', zod: null },
  ],
  array: [
    { joi: 'unique()', zod: 'refine(value => new Set(value).size === value.length)' },
    { joi: 'sparse(false)', zod: 'refine(value => value.every(item => item != null))' },
    { joi: 'sparse()', zod: 'refine(value => value.every(item => item != null))' },
  ],
  date: [
    { joi: 'iso()', zod: null },
    { joi: 'timestamp()', zod: null },
  ],
  object: [
    { joi: 'min($ARGS)', zod: 'refine(value => Object.keys(value).length >= $ARGS)' },
    { joi: 'max($ARGS)', zod: 'refine(value => Object.keys(value).length <= $ARGS)' },
    { joi: 'length($ARGS)', zod: 'refine(value => Object.keys(value).length === $ARGS)' },
  ],
  boolean: [{ joi: 'sensitive()', zod: null }],
};

async function joiValidationsToZodValidations(modifications: Modifications): Promise<Modifications> {
  const mappings = objects.toEntries(JOI_VALIDATIONS_TO_ZOD_VALIDATION_MAPPING).flatMap(([primitive, values]) => {
    return values.map(({ joi, zod }) => ({ primitive, joi, zod }));
  });

  return replaceValidations(modifications, mappings, 0);
}

async function replaceValidations(
  modifications: Modifications,
  mappings: Array<JoiValidationMapping>,
  mappingIndex: number,
): Promise<Modifications> {
  const mapping = mappings[mappingIndex];
  if (mapping == null) return modifications;

  const updated = await replaceValidation(modifications, mapping);

  return replaceValidations(updated, mappings, mappingIndex + 1);
}

async function replaceValidation(
  modifications: Modifications,
  { primitive, joi, zod }: JoiValidationMapping,
): Promise<Modifications> {
  const edits = replaceJoiValidationWithZodEdits(modifications.ast.root(), {
    primitive,
    validationTargetKey: joi,
    zodValidation: zod,
  });
  const updated = await commitEditModifications(edits, modifications);
  const isUnchanged = updated.ast.root().text() === modifications.ast.root().text();
  if (isUnchanged) return modifications;

  return replaceValidation(updated, { primitive, joi, zod });
}

export default joiValidationsToZodValidations;
