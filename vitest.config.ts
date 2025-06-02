import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: { coverage: { include: ['src'] }, disableConsoleIntercept: true, testTimeout: 50_000 },
});

export default config;
