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
