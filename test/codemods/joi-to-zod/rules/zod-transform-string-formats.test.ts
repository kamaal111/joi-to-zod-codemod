import { test, expect } from 'vitest';

import zodTransformStringFormats from '../../../../src/codemods/joi-to-zod/rules/zod-transform-string-formats';
import { JOI_TO_ZOD_LANGUAGE, makeJoiToZodInitialModification } from '../../../../src/codemods/joi-to-zod';
import { invalidRuleSignal } from '../../../test-utils/detection-theory';

test('transforms z.string().uuid() to z.uuid()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  id: z.string().uuid(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().uuid()');
  expect(updatedSource).contain('z.uuid()');
});

test('transforms z.string().url() to z.url()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  website: z.string().url(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().url()');
  expect(updatedSource).contain('z.url()');
});

test('transforms z.string().datetime() to z.iso.datetime()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  createdAt: z.string().datetime(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().datetime()');
  expect(updatedSource).contain('z.iso.datetime()');
});

test('transforms string format patterns chained with other methods', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  id: z.string().uuid().optional(),
  website: z.string().url().nullable(),
  createdAt: z.string().datetime().optional(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(3);
  expect(updatedSource).not.contain('z.string().uuid()');
  expect(updatedSource).not.contain('z.string().url()');
  expect(updatedSource).not.contain('z.string().datetime()');
  expect(updatedSource).contain('z.uuid().optional()');
  expect(updatedSource).contain('z.url().nullable()');
  expect(updatedSource).contain('z.iso.datetime().optional()');
});
