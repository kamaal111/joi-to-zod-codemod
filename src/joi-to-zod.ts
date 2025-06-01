import { findSourcePathsWithJoi } from './utils/source-finding.js';

export type JoiToZodReport = {
  sourcesFound: number;
};

export async function joiToZod(
  targetRootDirectory: string,
  config: { dryRun?: boolean; glob?: Array<string> } = {},
): Promise<JoiToZodReport> {
  const sourcePaths = await findSourcePathsWithJoi(targetRootDirectory, { glob: config.glob });

  return { sourcesFound: sourcePaths.length };
}
