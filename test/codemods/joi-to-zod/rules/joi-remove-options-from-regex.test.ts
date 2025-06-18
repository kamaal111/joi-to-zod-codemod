import { test, expect } from 'vitest';

import joiRemoveOptionsFromRegex from '../../../../src/codemods/joi-to-zod/rules/joi-remove-options-from-regex';
import { invalidRuleSignal } from '../../../test-utils/detect-theory';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';

test('Joi remove options from regex', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  nickname: Joi.string()
    .required()
    .min(3)
    .max(20)
    .description('Nickname')
    .regex(/^[a-z]+$/, { name: 'alpha', invert: true }),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiRemoveOptionsFromRegex(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('alpha');
  expect(updatedSource).not.contain('invert');
  expect(updatedSource).toContain('.regex(/^[a-z]+$/)');
});
