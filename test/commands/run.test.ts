import { runCommand } from '@oclif/test';
import { test, expect } from 'vitest';

test('that it runs run', async () => {
  const { stdout } = await runCommand('run test/resources -d');

  expect(stdout).include('transformation took ');
});

test('that it runs run against a single file', async () => {
  const { stdout } = await runCommand('run test/resources/joi-imports.ts -d');

  expect(stdout).include('transformation took ');
});

test('that --no-log suppresses the timing line', async () => {
  const { stdout } = await runCommand('run test/resources -d --no-log');

  expect(stdout).not.include('transformation took ');
});

test('that it errors on a path that does not exist', async () => {
  const { error } = await runCommand('run test/resources/does-not-exist.ts -d');

  expect(error?.message).include("No file or directory found at 'test/resources/does-not-exist.ts'");
});
