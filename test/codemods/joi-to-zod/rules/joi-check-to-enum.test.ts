import { test, expect } from 'vitest';

import joiCheckToEnum from '../../../../src/codemods/joi-to-zod/rules/joi-check-to-enum';
import { invalidRuleSignal } from '../../../test-utils/detect-theory';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';

test('Joi check to Zod enum', async () => {
  const source = `
import Joi from 'joi';

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = Joi.object().keys({
  job: Joi.string().valid(...Object.values(Job)),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('check');
  expect(updatedSource, updatedSource).contain(
    'job: Joi.string().enum([...Object.values(Job) as [string, ...Array<string>]])',
  );
});
