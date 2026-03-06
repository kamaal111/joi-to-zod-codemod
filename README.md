# Joi to Zod Codemod

- [Joi to Zod Codemod](#joi-to-zod-codemod)
  - [Installation](#installation)
  - [CLI usage](#cli-usage)
    - [Flags](#flags)
    - [Examples](#examples)
  - [What it transforms](#what-it-transforms)
  - [Example](#example)
  - [Current constraints](#current-constraints)
  - [Library usage](#library-usage)
  - [Development](#development)
  - [License](#license)

`@kamaalio/joi-to-zod-codemod` is an CLI and reusable codemod that rewrites supported Joi schema patterns into Zod equivalents.

The project is currently focused on files that use a default Joi import:

```ts
import Joi from 'joi';
```

If a file does not match that shape, it is ignored.

## Installation

```bash
npm install -g @kamaalio/joi-to-zod-codemod
```

You can also use `pnpm add -g` or `yarn global add`.

## CLI usage

The CLI exposes a single command:

```bash
joi-to-zod-codemod run [PATH]
```

`PATH` defaults to `.`.

### Flags

| Flag       | Default | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| `--dry`    | `false` | Print what would change without writing files |
| `--no-log` | `false` | Disable log output                            |

### Examples

```bash
# Transform the current directory
joi-to-zod-codemod run

# Transform a specific directory
joi-to-zod-codemod run src

# Preview changes without writing them
joi-to-zod-codemod run src --dry

# Run quietly
joi-to-zod-codemod run src --no-log
```

## What it transforms

The codemod pipeline currently covers these Joi-to-Zod rewrites:

- Adds `import { z } from "zod"` when needed.
- Removes the `joi` import after the file no longer references it.
- `Joi.object().keys({...})` -> `z.object({...}).strict()`
- `Joi.array().items(schema)` -> `z.array(schema)`
- `Joi.alternatives().try(a, b)` -> `z.union([a, b])`
- `Joi.object().pattern(key, value)` -> `z.record(key, value)`
- `Joi.string().valid(...)` -> `z.enum(...)`
- `Joi.string().required()` -> required property in `z.object(...)`
- Optional object properties without `.required()` -> `.optional()`
- `alphanum` -> `regex(/^[a-z0-9]+$/)`
- `uri` -> `url`
- `guid` -> `uuid`
- `isoDate` -> `z.iso.datetime()`
- `integer` -> `int`
- `greater` / `less` -> `gt` / `lt`
- `multiple` / `precision` -> `multipleOf`
- `description` -> `describe`
- `allow(null)` -> `nullable`
- `required(false)` -> `optional`
- `unknown(true)` / `unknown(false)` -> `passthrough()` / `strict()`
- `lowercase` / `uppercase` -> `toLowerCase()` / `toUpperCase()`
- `token`, `hex`, and `pattern(...)` -> regex-based validations
- `bool()` -> `boolean()`

After the Joi calls are rewritten, the codemod also normalizes some Zod 4 string formats:

- `z.string().uuid()` -> `z.uuid()`
- `z.string().url()` -> `z.url()`
- `z.string().datetime()` -> `z.iso.datetime()`

## Example

Input:

```ts
import Joi from 'joi';

enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export const memberSchema = Joi.object().keys({
  id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  status: Joi.string()
    .valid(...Object.values(MemberStatus))
    .required(),
  website: Joi.string().uri(),
  metadata: Joi.object().pattern(Joi.string(), Joi.number()),
});
```

Output:

```ts
import { z } from 'zod';

enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export const memberSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    status: z.enum([...(Object.values(MemberStatus) as [string, ...Array<string>])]),
    website: z.url().optional(),
    metadata: z.record(z.string(), z.number()).optional(),
  })
  .strict();
```

## Current constraints

- The codemod only targets files with a default `import Joi from 'joi'`.
- The AST language is configured as TypeScript, so this project is best suited to TypeScript-style source files.
- Coverage is driven by the rules and tests in [`src/codemods/joi-to-zod`](./src/codemods/joi-to-zod) and [`test/codemods/joi-to-zod`](./test/codemods/joi-to-zod). Patterns outside those rules may remain unchanged.
- The tool is a codemod, not a semantic migration assistant. Review the output before committing.

## Library usage

The package also exports the codemod pieces from [`src/index.ts`](./src/index.ts):

```ts
export { run } from '@oclif/core';
export { default, joiToZodTransformer, JOI_TO_ZOD_LANGUAGE, JOI_TO_ZOD_CODEMOD } from './codemods/joi-to-zod/index.js';
```

## Development

Use `pnpm` on Node.js `>=22`.

```bash
pnpm install
pnpm build
pnpm test
```

Useful commands:

- `pnpm test`
- `pnpm test:watch`
- `pnpm test:cov`
- `pnpm test:example`
- `pnpm lint`
- `pnpm format:check`
- `pnpm type-check`
- `pnpm type-check:example`
- `just quality`
- `just preview`

## License

MIT. See [LICENSE](./LICENSE).
