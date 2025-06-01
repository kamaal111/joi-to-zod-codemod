import { DEFAULT_DRY_RUN_OPTION, DEFAULT_GLOB, DEFAULT_LOG_OPTION, DEFAULT_PARALLEL_OPTION } from './constants.js';
import { findSourcePathsWithJoi } from './utils/source-finding.js';

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

  const transformerConfig = { dryRun, parallel, log };
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

export async function joiToZodTransformer(
  sourcePath: string,
  config?: { dryRun?: boolean; parallel?: boolean; log?: boolean },
) {
  const parallel = config?.parallel ?? DEFAULT_PARALLEL_OPTION;
  const dryRun = config?.dryRun ?? DEFAULT_DRY_RUN_OPTION;
  const log = config?.log ?? DEFAULT_LOG_OPTION;
  console.log('parallel', parallel);
  console.log('dryRun', dryRun);
  console.log('log', log);
  console.log('sourcePath', sourcePath);
}
