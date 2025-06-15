import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import joiAddOptional from '../../../../src/codemods/joi-to-zod/rules/joi-add-optional';

test('Joi add optional', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
  birthyear: Joi.number().integer().min(1970).max(2013),
});
`;
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiAddOptional({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.toContain('required().optional');
  expect(updatedSource).toContain('birthyear: Joi.number().integer().min(1970).max(2013).optional()');
  expect(updatedSource).toMatchSnapshot();
});
