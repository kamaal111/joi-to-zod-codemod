import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import joiRemovePrimitiveForEnum from '../../../../src/codemods/joi-to-zod/rules/joi-remove-primitive-for-enum';

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
  const ast = await parseAsync(Lang.TypeScript, source);

  const modifications = await joiRemovePrimitiveForEnum({
    ast,
    report: { changesApplied: 0 },
    lang: Lang.TypeScript,
    filename: null,
    history: [ast],
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(modifications.history.length).toBe(2);
  expect(updatedSource).not.toContain('string()');
  expect(updatedSource).toContain('job: Joi.enum([...Object.values(Job) as [string, ...Array<string>]])');
  expect(updatedSource).toMatchSnapshot();
});
