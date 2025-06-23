import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    coverage: { include: ['src'], exclude: ['src/codemods/types.ts', 'src/utils/type-utils.ts'] },
    disableConsoleIntercept: true,
  },
});

export default config;
