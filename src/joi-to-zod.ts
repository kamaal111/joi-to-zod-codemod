import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { run as jscodeshift } from 'jscodeshift/src/Runner.js';

import { DEFAULT_DRY_RUN_OPTION, DEFAULT_GLOB, DEFAULT_LOG_OPTION, DEFAULT_PARALLEL_OPTION } from './constants.js';
import { findSourcePathsWithJoi } from './utils/source-finding.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JOI_TO_ZOD_CODEMOD_PARSER = 'ts';
const JOI_TO_ZOD_CODEMOD_FILEPATH_WITHOUT_EXTENSION = path.resolve(path.join(__dirname, 'codemods/joi-to-zod'));
const JOI_TO_ZOD_CODEMOD_JS_FILEPATH = JOI_TO_ZOD_CODEMOD_FILEPATH_WITHOUT_EXTENSION + '.js';
const JOI_TO_ZOD_CODEMOD_TS_FILEPATH = JOI_TO_ZOD_CODEMOD_FILEPATH_WITHOUT_EXTENSION + '.ts';
const JOI_TO_ZOD_CODEMOD_FILEPATH = fs.existsSync(JOI_TO_ZOD_CODEMOD_JS_FILEPATH)
  ? JOI_TO_ZOD_CODEMOD_JS_FILEPATH
  : JOI_TO_ZOD_CODEMOD_TS_FILEPATH;

export type JoiToZodReport = {
  sourcesFound: number;
};

export async function joiToZod(
  targetRootDirectory: string,
  config?: { dryRun?: boolean; glob?: Array<string>; parallel?: boolean; log?: boolean },
): Promise<JoiToZodReport> {
  const glob = config?.glob ?? DEFAULT_GLOB;
  const parallel = config?.parallel ?? DEFAULT_PARALLEL_OPTION;
  const dryRun = config?.dryRun ?? DEFAULT_DRY_RUN_OPTION;
  const log = config?.log ?? DEFAULT_LOG_OPTION;
  const sourcePaths = await findSourcePathsWithJoi(targetRootDirectory, { glob });

  if (log) {
    console.log(
      `Will transform ${sourcePaths.length} ${sourcePaths.length === 1 ? 'file' : 'files'}, chill and grab some maté 🧉`,
    );
  }

  const transformerConfig = { dryRun, log };
  let resolvedTransformedValues: Array<Awaited<ReturnType<typeof joiToZodTransformer>>> = [];
  if (parallel) {
    resolvedTransformedValues = await Promise.all(
      sourcePaths.map(sourcePath => joiToZodTransformer(sourcePath, transformerConfig)),
    );
  } else {
    for (let index = 0; index < sourcePaths.length; index += 1) {
      const sourcePath = sourcePaths[index];
      const transformed = await joiToZodTransformer(sourcePath, transformerConfig);
      resolvedTransformedValues.push(transformed);
    }
  }

  return { sourcesFound: sourcePaths.length };
}

export async function joiToZodTransformer(sourcePath: string, config?: { dryRun?: boolean; log?: boolean }) {
  const dryRun = config?.dryRun ?? DEFAULT_DRY_RUN_OPTION;
  const log = config?.log ?? DEFAULT_LOG_OPTION;
  const result = await jscodeshift(JOI_TO_ZOD_CODEMOD_FILEPATH, [sourcePath], {
    dry: dryRun,
    print: log,
    parser: JOI_TO_ZOD_CODEMOD_PARSER,
  });
  console.log('result', result);
}
