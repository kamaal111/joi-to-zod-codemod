import fs from 'node:fs/promises';

import { runCodemod } from '@kamaalio/codemod-kit';
import { Args, Command, Flags } from '@oclif/core';

import { JOI_TO_ZOD_CODEMOD } from '../codemods/joi-to-zod/index.js';

const DEFAULT_DRY_RUN_OPTION = false;
const DEFAULT_NO_LOG_OPTION = false;

class Run extends Command {
  static override args = {
    path: Args.string({ default: '.', description: 'The file or directory path to transform' }),
  };
  static override description = 'Run codemod';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    dry: Flags.boolean({
      default: DEFAULT_DRY_RUN_OPTION,
      charAliases: ['d', 'D'],
      description: 'When enabled the transformer will not write to the file but print what would have changed instead',
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

    try {
      await fs.stat(args.path);
    } catch {
      this.error(`No file or directory found at '${args.path}'`);
    }

    await runCodemod(JOI_TO_ZOD_CODEMOD, args.path, { dry: flags.dry, log: !flags['no-log'] });

    const end = performance.now();
    if (!flags['no-log']) {
      console.log(`✨ transformation took ${(end - start).toFixed(2)} milliseconds`);
    }
  }
}

export default Run;
