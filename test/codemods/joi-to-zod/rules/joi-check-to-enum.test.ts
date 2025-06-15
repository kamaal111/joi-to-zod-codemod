import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import joiCheckToEnum from '../../../../src/codemods/joi-to-zod/rules/joi-check-to-enum';

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
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiCheckToEnum({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.toContain('check');
  expect(updatedSource).toContain('job: Joi.string().enum([...Object.values(Job) as [string, ...Array<string>]])');
  expect(updatedSource).toMatchSnapshot();
});
