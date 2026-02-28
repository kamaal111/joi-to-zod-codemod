import { test, expect } from 'vitest';

import joiCheckToEnum from '../../../../src/codemods/joi-to-zod/rules/joi-check-to-enum';
import { invalidRuleSignal, validRuleSignal } from '../../../test-utils/detection-theory';
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

test('Joi check to Zod enum with required', async () => {
  const source = `
import Joi from 'joi';

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = Joi.object().keys({
  job: Joi.string().valid(...Object.values(Job)).required(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource, updatedSource).contain(
    'job: Joi.string().enum([...Object.values(Job) as [string, ...Array<string>]]).required()',
  );
});

test('Joi check to Zod enum with literal values', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  status: Joi.string().valid('active', 'inactive', 'pending'),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource, updatedSource).contain(
    "status: Joi.string().enum(['active', 'inactive', 'pending'] as [string, ...Array<string>])",
  );
});

test('Joi check to Zod enum with literal values and required', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  status: Joi.string().valid('active', 'inactive', 'pending').required(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource, updatedSource).contain(
    "status: Joi.string().enum(['active', 'inactive', 'pending'] as [string, ...Array<string>]).required()",
  );
});

test('Joi check to Zod enum valid', async () => {
  const source = `
import Joi from 'joi';

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
});
`;

  await validRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
});

test('Joi check to Zod enum with multiline literal values', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  status: Joi.string().valid(
    'active',
    'inactive',
    'pending',
  ).required(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource, updatedSource).contain(
    "status: Joi.string().enum(['active', 'inactive', 'pending'] as [string, ...Array<string>]).required()",
  );
});

test('Joi check to Zod enum with whitespace in spread', async () => {
  const source = `
import Joi from 'joi';

enum Job {
  Developer = 'developer',
  DevOps = 'devops',
  Designer = 'designer',
}

export const employee = Joi.object().keys({
  job: Joi.string().valid(
    ...Object.values(Job),
  ).required(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiCheckToEnum(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource, updatedSource).contain(
    'job: Joi.string().enum([...Object.values(Job) as [string, ...Array<string>]]).required()',
  );
});
