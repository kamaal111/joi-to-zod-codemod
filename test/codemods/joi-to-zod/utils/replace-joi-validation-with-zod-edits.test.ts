import { test, expect } from 'vitest';
import { Lang, parseAsync } from '@ast-grep/napi';

import replaceJoiValidationWithZodEdits from '../../../../src/codemods/joi-to-zod/utils/replace-joi-validation-with-zod-edits';

test('replaces Joi required with optional edits', async () => {
  const source = `
import Joi from 'joi';

export const employee = Joi.object().keys({
    name: Joi.string().regex(/^[a-z0-9]+$/).min(3).max(30).required()
})
`;
  const ast = await parseAsync(Lang.TypeScript, source);
  const root = ast.root();
  const edits = replaceJoiValidationWithZodEdits(root, {
    primitive: '*',
    validationTargetKey: 'required()',
    zodValidation: 'optional()',
  });

  const updatedSource = root.commitEdits(edits);

  expect(edits.length).toBe(1);
  expect(updatedSource).not.toContain('required');
  expect(updatedSource).toContain('optional');
  expect(updatedSource).toMatchSnapshot();
});
