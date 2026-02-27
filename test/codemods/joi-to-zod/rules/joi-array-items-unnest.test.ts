import { test, expect } from 'vitest';

import joiArrayItemsUnnest from '../../../../src/codemods/joi-to-zod/rules/joi-array-items-unnest';
import { invalidRuleSignal, validRuleSignal } from '../../../test-utils/detection-theory';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';

test('Joi array items unnest', async () => {
  const source = `
import Joi from 'joi';

export const tags = Joi.array().items(Joi.string());
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiArrayItemsUnnest(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('items');
  expect(updatedSource).toContain('Joi.array(Joi.string())');
});

test('Joi array items unnest valid', async () => {
  const source = `
import Joi from 'joi';

export const tags = Joi.array(Joi.string());
`;

  await validRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiArrayItemsUnnest(makeJoiToZodInitialModification(ast));
  });
});
