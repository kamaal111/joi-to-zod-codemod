import { test, expect } from 'vitest';

import joiRemovePrimitiveForEnum from '../../../../src/codemods/joi-to-zod/rules/joi-remove-primitive-for-enum';
import { invalidRuleSignal } from '../../../test-utils/detection-theory';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';

test('Joi remove primitive for enum', async () => {
  const source = `
import Joi from 'joi';

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = Joi.object().keys({
  job: Joi.string().enum([...Object.values(Job) as [string, ...Array<string>]]),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiRemovePrimitiveForEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.toContain('string()');
  expect(updatedSource).toContain('job: Joi.enum([...Object.values(Job) as [string, ...Array<string>]])');
});
