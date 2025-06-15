import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import joiObjectKeysUnnest from '../../../../src/codemods/joi-to-zod/rules/joi-object-keys-unnest';

test('Joi unnest object', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
  name: Joi.string().alphanum().min(3).max(30).required(),
});
`;
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiObjectKeysUnnest({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.toContain('keys');
  expect(updatedSource).toContain('Joi.object({');
  expect(updatedSource).toContain('}).strict()');
  expect(updatedSource).toMatchSnapshot();
});
