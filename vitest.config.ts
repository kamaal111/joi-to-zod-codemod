import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: { coverage: { include: ['src'] }, disableConsoleIntercept: true, testTimeout: 30_000 },
});

export default config;
