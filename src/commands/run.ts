import { Args, Command, Flags } from '@oclif/core';
import { Lang } from '@ast-grep/napi';

import { DEFAULT_DRY_RUN_OPTION, DEFAULT_IGNORES, DEFAULT_LOG_OPTION, DEFAULT_SEARCHES } from '../constants.js';
import parseAndTransformFiles from '../codemods/utils/parse-and-transform-files.js';
import joiToZodTransformer from '../codemods/joi-to-zod/index.js';

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
    log: Flags.boolean({
      default: DEFAULT_LOG_OPTION,
      charAliases: ['l', 'L'],
      description: 'When disabled no logs will be displayed',
    }),
  };

  public async run(): Promise<void> {
    const start = performance.now();
    const { flags } = await this.parse(Run);

    await parseAndTransformFiles(
      this.parseGlob(flags.ignores, flags.search),
      Lang.TypeScript,
      { dryRun: flags.dry, log: flags.log },
      joiToZodTransformer,
    );

    const end = performance.now();
    if (flags.log) {
      console.log(`✨ transformation took ${(end - start).toFixed(2)} milliseconds`);
    }
  }

  private parseGlob = (
    rawIgnores: string,
    rawSearches: string,
  ): { searches: Array<string>; ignores: Array<string> } => {
    let parsedIgnores: unknown;
    try {
      parsedIgnores = JSON.parse(rawIgnores);
    } catch {
      parsedIgnores = [];
    }

    let parsedSearches: unknown;
    try {
      parsedSearches = JSON.parse(rawSearches);
    } catch {
      parsedSearches = [];
    }

    return {
      searches: Array.isArray(parsedSearches) ? parsedSearches.filter(search => typeof search === 'string') : [],
      ignores: Array.isArray(parsedIgnores) ? parsedIgnores.filter(ignore => typeof ignore === 'string') : [],
    };
  };
}

export default Run;
