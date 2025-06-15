import { Args, Command, Flags } from '@oclif/core';

import { DEFAULT_DRY_RUN_OPTION, DEFAULT_IGNORES, DEFAULT_NO_LOG_OPTION, DEFAULT_SEARCHES } from '../constants.js';
import parseAndTransformFiles from '../codemods/utils/parse-and-transform-files.js';
import joiToZodTransformer, { JOI_TO_ZOD_LANGUAGE } from '../codemods/joi-to-zod/index.js';
import { compactMap } from '../utils/arrays.js';

class Run extends Command {
  static override args = {
    path: Args.directory({ exists: true, default: '.', description: 'The path to transform' }),
  };
  static override description = 'Run codemod';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    dry: Flags.boolean({
      default: DEFAULT_DRY_RUN_OPTION,
      charAliases: ['d', 'D'],
      description: 'When enabled the transformer will not write to the file but print what would have changed instead',
    }),
    ignores: Flags.string({
      default: JSON.stringify(DEFAULT_IGNORES),
      charAliases: ['i', 'I'],
      description: 'Directories or files to ignore',
    }),
    search: Flags.string({
      default: JSON.stringify(DEFAULT_SEARCHES),
      charAliases: ['s', 'S'],
      description: 'Directories or files to include',
    }),
    ['no-log']: Flags.boolean({
      default: DEFAULT_NO_LOG_OPTION,
      charAliases: ['n', 'N'],
      description: 'When enabled no logs will be displayed',
    }),
  };

  public async run(): Promise<void> {
    const start = performance.now();
    const { flags, args } = await this.parse(Run);

    await parseAndTransformFiles(
      this.parseGlobs(flags.ignores, flags.search),
      JOI_TO_ZOD_LANGUAGE,
      { dryRun: flags.dry, noLog: flags['no-log'], cwd: args.path },
      joiToZodTransformer,
    );

    const end = performance.now();
    if (!flags.noLog) {
      console.log(`✨ transformation took ${(end - start).toFixed(2)} milliseconds`);
    }
  }

  private parseGlobs = (
    rawIgnores: string,
    rawSearches: string,
  ): { searches: Array<string>; ignores: Array<string> } => {
    return { searches: this.mapGlob(rawSearches), ignores: this.mapGlob(rawIgnores) };
  };

  private parseGlob = (rawGlob: string): Array<unknown> => {
    try {
      const parsedGlob = JSON.parse(rawGlob);
      if (!Array.isArray(parsedGlob)) return [parsedGlob];
      return parsedGlob;
    } catch {
      return [rawGlob];
    }
  };

  private mapGlob = (rawGlob: string): Array<string> => {
    return compactMap(this.parseGlob(rawGlob), glob => {
      if (typeof glob !== 'string') return null;

      const trimmed = glob.trim();
      if (trimmed.length === 0) return null;

      return trimmed;
    });
  };
}

export default Run;
