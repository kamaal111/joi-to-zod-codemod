# Repository Guidelines

## Build, Test, and Development Commands

Use `pnpm` on Node.js `>=22`.

- `pnpm build`: compile TypeScript and generate the Oclif manifest.
- `pnpm test`: run the unit test suite once.
- `pnpm test:watch`: run Vitest in watch mode.
- `pnpm test:cov`: collect coverage for `src/`.
- `pnpm test:example`: run the example app tests with `example/vitest.config.ts`.
- `pnpm lint` and `pnpm format:check`: enforce ESLint and Prettier rules.
- `pnpm type-check` and `pnpm type-check:example`: verify TypeScript without emitting files.
- `just quality`: run the main local quality gate (`lint`, `format-check`, `type-check`).
- `just preview`: run the CLI against `test/resources/`.
