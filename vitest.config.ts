import { configDefaults, defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    coverage: {
      include: ['src'],
      exclude: ['src/codemods/joi-to-zod/types.ts', 'src/index.ts'],
      thresholds: { statements: 82, branches: 63, functions: 80, lines: 85 },
    },
    disableConsoleIntercept: true,
    exclude: [...configDefaults.exclude, 'example/**'],
  },
});

export default config;
