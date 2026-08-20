import { test, expect } from 'vitest';

import { run } from '../src/cli.ts';
import { captureCli } from './test-utils/capture-output.ts';

test('that no arguments prints the top-level help text', async () => {
  const { stdout, exitCode } = await captureCli(() => run([]));

  expect(stdout).include('USAGE');
  expect(stdout).include('COMMANDS');
  expect(exitCode).toBeUndefined();
});

test('that --help prints the top-level help text', async () => {
  const { stdout, exitCode } = await captureCli(() => run(['--help']));

  expect(stdout).include('USAGE');
  expect(exitCode).toBeUndefined();
});

test('that --version prints the package version', async () => {
  const { stdout, exitCode } = await captureCli(() => run(['--version']));

  expect(stdout).match(/^\d+\.\d+\.\d+$/);
  expect(exitCode).toBeUndefined();
});

test('that run --help prints the run command help text', async () => {
  const { stdout, exitCode } = await captureCli(() => run(['run', '--help']));

  expect(stdout).include('Run codemod');
  expect(exitCode).toBeUndefined();
});

test('that an unknown command errors with exit code 2', async () => {
  const { stderr, exitCode } = await captureCli(() => run(['bogus']));

  expect(stderr).include("Unknown command 'bogus'");
  expect(exitCode).toBe(2);
});

test('that a usage error from the run command exits with code 2', async () => {
  const { stderr, exitCode } = await captureCli(() =>
    run(['run', 'test/resources', '--config', 'test/resources/joi-migration-phase1.json']),
  );

  expect(stderr).include("Cannot use '--config' together with a path argument. Choose one.");
  expect(exitCode).toBe(2);
});

test('that a non-usage error from the run command exits with code 1', async () => {
  const { stderr, exitCode } = await captureCli(() => run(['run', 'test/resources/does-not-exist.ts']));

  expect(stderr).include("No file or directory found at 'test/resources/does-not-exist.ts'");
  expect(exitCode).toBe(1);
});

test('that it dispatches to the run command on success', async () => {
  const { stdout, exitCode } = await captureCli(() => run(['run', 'test/resources', '-d']));

  expect(stdout).include('transformation took ');
  expect(exitCode).toBeUndefined();
});
