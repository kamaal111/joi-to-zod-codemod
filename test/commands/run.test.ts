import { runCommand } from '@oclif/test';
import { test, expect } from 'vitest';

test('that it runs run', async () => {
  const { stdout } = await runCommand('run -d');

  expect(stdout).include('Transformed files successfully in');
});
