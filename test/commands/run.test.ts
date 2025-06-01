import { runCommand } from '@oclif/test';
import { test, expect } from 'vitest';

test('that it runs run', async () => {
  const { stdout } = await runCommand('run');
  expect(stdout).include('🐸🐸🐸 hello wonderer\n');
});
