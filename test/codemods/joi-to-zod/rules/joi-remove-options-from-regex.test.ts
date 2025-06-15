import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import joiRemoveOptionsFromRegex from '../../../../src/codemods/joi-to-zod/rules/joi-remove-options-from-regex';

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
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiRemoveOptionsFromRegex({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.toContain('alpha');
  expect(updatedSource).not.toContain('invert');
  expect(updatedSource).toContain('.regex(/^[a-z]+$/)');
  expect(updatedSource).toMatchSnapshot();
});
