#!/usr/bin/env node

import { register } from 'tsx/esm/api';

const unregister = register();
try {
  const { run } = await import('../src/cli.js');
  await run();
} finally {
  await unregister();
}
