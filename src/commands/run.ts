import { loadCodemodConfig, runCodemod, type CodemodConfig } from '@kamaalio/codemod-kit';
import { Args, Command, Flags } from '@oclif/core';

import { JOI_TO_ZOD_CODEMOD } from '../codemods/joi-to-zod/index.js';

const DEFAULT_DRY_RUN_OPTION = false;
const DEFAULT_NO_LOG_OPTION = false;
const DEFAULT_PATH_ARG = '.';

class Run extends Command {
  static override args = {
    path: Args.string({ default: DEFAULT_PATH_ARG, description: 'The file or directory path to transform' }),
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
    config: Flags.string({
      charAliases: ['c', 'C'],
      description:
        'Path to a JSON config file listing the paths to migrate (mutually exclusive with the path argument)',
    }),
  };

  public async run(): Promise<void> {
    const start = performance.now();
    const { flags, args } = await this.parse(Run);

    if (flags.config != null && args.path !== DEFAULT_PATH_ARG) {
      this.error("Cannot use '--config' together with a path argument. Choose one.");
    }

    const config = await this.resolveConfig(flags, args);

    await runCodemod(JOI_TO_ZOD_CODEMOD, config);

    const end = performance.now();
    if (config.log !== false) {
      console.log(`✨ transformation took ${(end - start).toFixed(2)} milliseconds`);
    }
  }

  private async resolveConfig(
    flags: { config: string | undefined; dry: boolean; 'no-log': boolean },
    args: { path: string },
  ): Promise<CodemodConfig> {
    if (flags.config == null) {
      return { paths: [args.path], dry_run: flags.dry, log: !flags['no-log'] };
    }

    const config = await loadCodemodConfig(flags.config);

    if (flags.dry && config.dry_run !== undefined) {
      this.error("Cannot use '--dry' together with 'dry_run' in the config file. Choose one.");
    }
    if (flags['no-log'] && config.log !== undefined) {
      this.error("Cannot use '--no-log' together with 'log' in the config file. Choose one.");
    }

    return {
      ...config,
      dry_run: flags.dry || (config.dry_run ?? false),
      log: flags['no-log'] ? false : (config.log ?? true),
    };
  }
}

export default Run;
