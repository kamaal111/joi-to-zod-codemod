import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import joiValidationsToZodValidations from '../../../../src/codemods/joi-to-zod/rules/joi-validations-to-zod-validations';

test('Joi alphanum to Zod regex', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
});
`;
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiValidationsToZodValidations({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.contain('alphanum');
  expect(updatedSource).contain('regex(/^[a-z0-9]+$/)');
  expect(updatedSource).toMatchSnapshot();
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
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiValidationsToZodValidations({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.contain('integer');
  expect(updatedSource).contain('int()');
  expect(updatedSource).toMatchSnapshot();
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
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiValidationsToZodValidations({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.contain('description');
  expect(updatedSource).contain("describe('Nickname')");
  expect(updatedSource).toMatchSnapshot();
});
