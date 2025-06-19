import { test, expect } from 'vitest';

import joiObjectKeysUnnest from '../../../../src/codemods/joi-to-zod/rules/joi-object-keys-unnest';
import { invalidRuleSignal, validRuleSignal } from '../../../test-utils/detection-theory';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';

test('Joi unnest object', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiObjectKeysUnnest(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('keys');
  expect(updatedSource).toContain('Joi.object({');
  expect(updatedSource).toContain('}).strict()');
});

test('Joi unnest object valid', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object({name: Joi.string().alphanum().min(3).max(30).required()});
`;

  await validRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiObjectKeysUnnest(makeJoiToZodInitialModification(ast));
  });
});
