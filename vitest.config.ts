import { configDefaults, defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    coverage: {
      include: ['src'],
      exclude: ['src/codemods/joi-to-zod/types.ts'],
      /* Set just under the level measured when they were introduced, so coverage ratchets. */
      thresholds: { statements: 87, branches: 67, functions: 86, lines: 89 },
    },
    disableConsoleIntercept: true,
    exclude: [...configDefaults.exclude, 'example/**'],
  },
});

export default config;
