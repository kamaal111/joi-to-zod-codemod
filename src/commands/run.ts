import { Args, Command, Flags } from '@oclif/core';

import { joiToZod } from '../joi-to-zod.js';
import { DEFAULT_DRY_RUN_OPTION, DEFAULT_GLOB, DEFAULT_LOG_OPTION, DEFAULT_PARALLEL_OPTION } from '../constants.js';

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
    glob: Flags.string({
      default: JSON.stringify(DEFAULT_GLOB),
      charAliases: ['g', 'G'],
      description: 'Directories or files to ignore or include in glob form',
    }),
    parallel: Flags.boolean({
      default: DEFAULT_PARALLEL_OPTION,
      charAliases: ['p', 'P'],
      description: 'When disabled the transformers will run sequentially',
    }),
    log: Flags.boolean({
      default: DEFAULT_LOG_OPTION,
      charAliases: ['l', 'L'],
      description: 'When disabled no logs will be displayed',
    }),
  };

  public async run(): Promise<void> {
    const start = performance.now();
    const { args, flags } = await this.parse(Run);

    await joiToZod(args.path, {
      dryRun: flags.dry,
      glob: this.parseGlob(flags.glob),
      parallel: flags.parallel,
      log: flags.log,
    });

    const timeInSeconds = ((performance.now() - start) / 1000).toFixed(2);
    if (flags.log) {
      console.log(`Transformed files successfully in ${timeInSeconds} seconds ✨`);
    }
  }

  private parseGlob = (rawIgnores: string): Array<string> => {
    let parsedIgnores: unknown;
    try {
      parsedIgnores = JSON.parse(rawIgnores);
    } catch {
      return [];
    }

    if (!Array.isArray(parsedIgnores)) return [];
    return parsedIgnores.filter(ignore => typeof ignore === 'string');
  };
}

export default Run;
