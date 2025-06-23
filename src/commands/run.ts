import { Args, Command, Flags } from '@oclif/core';
import { runCodemod } from '@kamaalio/codemod-kit';

import { JOI_TO_ZOD_CODEMOD } from '../codemods/joi-to-zod/index.js';

const DEFAULT_DRY_RUN_OPTION = false;
const DEFAULT_NO_LOG_OPTION = false;

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
    ['no-log']: Flags.boolean({
      default: DEFAULT_NO_LOG_OPTION,
      charAliases: ['n', 'N'],
      description: 'When enabled no logs will be displayed',
    }),
  };

  public async run(): Promise<void> {
    const start = performance.now();
    const { flags, args } = await this.parse(Run);

    await runCodemod(JOI_TO_ZOD_CODEMOD, args.path, { dry: flags.dry, log: !flags['no-log'] });

    const end = performance.now();
    if (!flags.noLog) {
      console.log(`✨ transformation took ${(end - start).toFixed(2)} milliseconds`);
    }
  }
}

export default Run;
