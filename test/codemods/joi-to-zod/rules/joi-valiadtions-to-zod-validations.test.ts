import { test, expect } from 'vitest';

import joiValidationsToZodValidations from '../../../../src/codemods/joi-to-zod/rules/joi-validations-to-zod-validations';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod/index';
import { invalidRuleSignal } from '../../../test-utils/detection-theory';

test('Joi alphanum to Zod regex', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('alphanum');
  expect(updatedSource).contain('regex(/^[a-z0-9]+$/)');
});

test('Joi integer to Zod int', async () => {
  const source = `
import Joi from 'joi';

import { MAX_YEAR } from './other-source';

const MINIMUM_YEAR = 1970;

export const employee = Joi.object().keys({
  birthyear: Joi.number().integer().min(MINIMUM_YEAR).max(MAX_YEAR),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('integer');
  expect(updatedSource).contain('int()');
});

test('Joi description to Zod describe', async () => {
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
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.contain('description');
  expect(updatedSource).contain("describe('Nickname')");
});

test('Joi uri to Zod url', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  url: Joi.string().uri(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('uri');
  expect(updatedSource).contain('url()');
});

test('Joi uri to Zod url on constant', async () => {
  const source = `
import Joi from 'joi';

const url = Joi.string().uri();
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('uri');
  expect(updatedSource).contain('url()');
});

test('Joi allow null to Zod optional', async () => {
  const source = `
import Joi from 'joi';

const url = Joi.string().allow(null);
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('allow');
  expect(updatedSource).contain('nullable()');
});

test('Joi allow null to Zod nullable', async () => {
  const source = `
import Joi from 'joi';

const url = Joi.string().allow(null);
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('allow');
  expect(updatedSource).contain('nullable()');
});

test('Joi not required to Zod optional', async () => {
  const source = `
import Joi from 'joi';

const url = Joi.string().required(false);
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('required');
  expect(updatedSource).contain('optional()');
});

test('Joi unknown to Zod passthrough', async () => {
  const source = `
import Joi from 'joi';

const url = Joi.string().required(false).unknown(true);
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(2);
  expect(updatedSource).not.contain('unknown');
  expect(updatedSource).contain('passthrough()');
});

test('Joi no unknowns to Zod strict', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  name: Joi.string().uri(),
}).allow(null).unknown(false);
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(3);
  expect(updatedSource).not.contain('unknown');
  expect(updatedSource).contain('strict()');
});

test('Joi precision to Zod step', async () => {
  const source = `
import Joi from 'joi';

import { MAX_YEAR } from './other-source';

const MINIMUM_YEAR = 1970;

export const employee = Joi.object().keys({
  birthyear: Joi.number().integer().min(MINIMUM_YEAR).max(MAX_YEAR).precision(3),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return joiValidationsToZodValidations(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(2);
  expect(updatedSource).not.contain('precision');
  expect(updatedSource, updatedSource).contain('step(1 / 10**3)');
});
