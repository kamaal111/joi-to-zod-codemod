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

  const modifications = await invalidRuleSignal(
    source,
    JOI_TO_ZOD_LANGUAGE,
    ast => {
      return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
    },
    2,
  );
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(3);
  expect(updatedSource).not.contain('z.string().url()');
  expect(updatedSource).not.contain('z.string().datetime()');
  expect(updatedSource).contain('z.uuid().optional()');
  expect(updatedSource).contain('z.url().nullable()');
  expect(updatedSource).contain('z.iso.datetime().optional()');
});

test('transforms z.string().email() to z.email()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  email: z.string().email(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().email()');
  expect(updatedSource).contain('z.email()');
});

test('transforms z.string().hostname() to z.hostname()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  host: z.string().hostname(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().hostname()');
  expect(updatedSource).contain('z.hostname()');
});

test('transforms z.string().base64() to z.base64()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  data: z.string().base64(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().base64()');
  expect(updatedSource).contain('z.base64()');
});

test('transforms z.string().hex() to z.hex()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  color: z.string().hex(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().hex()');
  expect(updatedSource).contain('z.hex()');
});

test('transforms z.string().isoDuration() to z.iso.duration()', async () => {
  const source = `
import { z } from "zod";

export const schema = z.object({
  duration: z.string().isoDuration(),
});
`;

  const modifications = await invalidRuleSignal(source, JOI_TO_ZOD_LANGUAGE, ast => {
    return zodTransformStringFormats(makeJoiToZodInitialModification(ast));
  });
  const updatedSource = modifications.ast.root().text();

  expect(modifications.report.changesApplied).toBe(1);
  expect(updatedSource).not.contain('z.string().isoDuration()');
  expect(updatedSource).contain('z.iso.duration()');
});
