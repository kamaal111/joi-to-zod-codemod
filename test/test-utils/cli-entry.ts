import type { run as srcRun } from '../../src/cli.ts';
import type { runCommand as srcRunCommand } from '../../src/commands/run.ts';

const useCompiled = process.env.CLI_ENTRY === 'dist';

const cliSpecifier: string = useCompiled ? '../../dist/cli.js' : '../../src/cli.ts';
const runCommandSpecifier: string = useCompiled ? '../../dist/commands/run.js' : '../../src/commands/run.ts';

export const run: typeof srcRun = (await import(cliSpecifier)).run;
export const runCommand: typeof srcRunCommand = (await import(runCommandSpecifier)).runCommand;
