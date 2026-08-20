import { createRequire } from 'node:module';

import { RUN_HELP_TEXT, runCommand } from './commands/run.ts';
import { CliUsageError } from './errors.ts';

const HELP_FLAGS = new Set(['-h', '--help']);
const VERSION_FLAGS = new Set(['-v', '--version']);

const TOP_LEVEL_HELP_TEXT = `Rewrites supported Joi schema patterns into Zod equivalents.

USAGE
  $ joi-to-zod-codemod [COMMAND]

COMMANDS
  run  Run codemod

Run '$ joi-to-zod-codemod run --help' for command-specific usage.
`;

export async function run(argv: Array<string> = process.argv.slice(2)): Promise<void> {
  const [command, ...rest] = argv;

  if (command === undefined || HELP_FLAGS.has(command)) {
    console.log(TOP_LEVEL_HELP_TEXT);
    return;
  }

  if (VERSION_FLAGS.has(command)) {
    console.log(readPackageVersion());
    return;
  }

  if (command !== 'run') {
    handleError(
      new CliUsageError(`Unknown command '${command}'. Run 'joi-to-zod-codemod --help' for a list of commands.`),
    );
    return;
  }

  if (rest.some(arg => HELP_FLAGS.has(arg))) {
    console.log(RUN_HELP_TEXT);
    return;
  }

  try {
    await runCommand(rest);
  } catch (error) {
    handleError(error);
  }
}

function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = error instanceof CliUsageError ? 2 : 1;
}

function readPackageVersion(): string {
  const nodeRequire = createRequire(import.meta.url);
  const pkg: { version: string } = nodeRequire('../package.json');
  return pkg.version;
}
