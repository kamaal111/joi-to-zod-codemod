import { test, expect } from 'vitest';

import joiObjectPatternToRecord from '../../../../src/codemods/joi-to-zod/rules/joi-object-pattern-to-record';
import { invalidRuleSignal, validRuleSignal } from '../../../test-utils/detection-theory';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';

test('Joi object pattern to Zod record', async () => {
  const source = `
import Joi from 'joi';

export const config = Joi.object().pattern(Joi.string(), Joi.number());
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiObjectPatternToRecord(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.toContain('object().pattern');
  expect(updatedSource).toContain('Joi.record(Joi.string(), Joi.number())');
});

test('Joi object multiline pattern to Zod record', async () => {
  const source = `
import Joi from 'joi';

export const config = Joi
  .object()
  .pattern(Joi.string(), Joi.number());
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiObjectPatternToRecord(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.toContain('object()');
  expect(updatedSource).toContain('Joi.record(Joi.string(), Joi.number())');
});

test('Joi object pattern with regex key is unchanged', async () => {
  const source = `
import Joi from 'joi';

export const config = Joi.object().pattern(/^key/, Joi.string());
`;

  await validRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiObjectPatternToRecord(makeJoiToZodInitialModification(ast));
  });
});

test('Joi object without pattern is unchanged', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object({ name: Joi.string() });
`;

  await validRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiObjectPatternToRecord(makeJoiToZodInitialModification(ast));
  });
});
