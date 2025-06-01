import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: { coverage: { include: ['src'] }, disableConsoleIntercept: true },
});

export default config;
