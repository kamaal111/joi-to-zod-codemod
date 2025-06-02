# Joi to Zod Codemod

A powerful CLI tool and library for automatically converting [Joi](https://joi.dev/) schema definitions to [Zod](https://zod.dev/) schemas in TypeScript and JavaScript projects. This codemod intelligently transforms validation schemas while preserving complex relationships, nested structures, and import dependencies.

## Features

- 🔄 **Automated Conversion**: Transforms Joi schemas to equivalent Zod schemas
- 🎯 **Smart Detection**: Automatically finds files containing Joi imports
- 🧠 **Intelligent Analysis**: Handles complex scenarios including:
  - Global variable and enum references within schemas
  - Nested object and array schemas
  - Validation rules and constraints
  - Import statement management (removes Joi, adds Zod)
  - Cleanup of unused enums and variables after transformation
- 🚀 **Parallel Processing**: Supports concurrent file transformation for better performance
- 🔍 **Dry Run Mode**: Preview changes before applying them
- 📁 **Flexible Targeting**: Configurable glob patterns for file selection
- 🛠 **TypeScript Support**: Works with both TypeScript and JavaScript files

## Installation

```bash
# Using npm
npm install -g @kamaalio/joi-to-zod-codemod

# Using pnpm
pnpm add -g @kamaalio/joi-to-zod-codemod

# Using yarn
yarn global add @kamaalio/joi-to-zod-codemod
```

## Usage

### CLI Usage

Transform all Joi schemas in the current directory:

```bash
joi-to-zod-codemod
```

Transform specific directory:

```bash
joi-to-zod-codemod ./src
```

### CLI Options

| Flag         | Short | Default                      | Description                                |
| ------------ | ----- | ---------------------------- | ------------------------------------------ |
| `--dry`      | `-d`  | `false`                      | Preview changes without writing to files   |
| `--glob`     | `-g`  | `["!node_modules", "!dist"]` | Glob patterns for file inclusion/exclusion |
| `--parallel` | `-p`  | `true`                       | Enable parallel processing of files        |
| `--log`      | `-l`  | `true`                       | Enable logging output                      |

### Examples

```bash
# Dry run to preview changes
joi-to-zod-codemod --dry

# Transform specific files with custom glob
joi-to-zod-codemod --glob '["src/**/*.ts", "!src/**/*.test.ts"]'

# Sequential processing with verbose logging
joi-to-zod-codemod --no-parallel --log

# Transform specific directory with minimal output
joi-to-zod-codemod ./api --no-log
```

### Programmatic Usage

```typescript
import { joiToZod, joiToZodTransformer } from '@kamaalio/joi-to-zod-codemod';

// Transform all files in a directory
const result = await joiToZod('./src', {
  dryRun: false,
  glob: ['src/**/*.ts', '!src/**/*.test.ts'],
  parallel: true,
  log: true,
});

console.log(`Transformed ${result.sourcesFound} files`);

// Transform a single file
await joiToZodTransformer('./path/to/schema.ts', {
  dryRun: false,
  log: true,
});
```

### Advanced Usage with jscodeshift

```typescript
import joiToZodJscodeshiftTransformer from '@kamaalio/joi-to-zod-codemod';

// Use directly with jscodeshift
const transform = joiToZodJscodeshiftTransformer;
```

## Transformation Examples

### Basic Schema Conversion

**Before (Joi):**

```typescript
import Joi from 'joi';

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120),
});
```

**After (Zod):**

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(3).max(30),
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
});
```

### Complex Schema with Enums

**Before:**

```typescript
import Joi from 'joi';

enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

const userSchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRole)),
  metadata: Joi.object({
    lastLogin: Joi.date().iso(),
    preferences: Joi.array().items(Joi.string()),
  }),
});
```

**After:**

```typescript
import { z } from 'zod';

enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

const userSchema = z.object({
  role: z.enum(['admin', 'user', 'guest']),
  metadata: z
    .object({
      lastLogin: z.string().datetime().optional(),
      preferences: z.array(z.string()).optional(),
    })
    .optional(),
});
```

## API Reference

### `joiToZod(targetRootDirectory, config?)`

Transforms all Joi schemas found in the specified directory.

**Parameters:**

- `targetRootDirectory` (string): Root directory to search for files
- `config` (object, optional):
  - `dryRun` (boolean): Preview changes without writing files
  - `glob` (string[]): Glob patterns for file filtering
  - `parallel` (boolean): Enable parallel processing
  - `log` (boolean): Enable logging

**Returns:** Promise<JoiToZodReport>

- `sourcesFound` (number): Number of files that were processed

### `joiToZodTransformer(sourcePath, config?)`

Transforms a single file from Joi to Zod.

**Parameters:**

- `sourcePath` (string): Path to the file to transform
- `config` (object, optional):
  - `dryRun` (boolean): Preview changes without writing
  - `log` (boolean): Enable logging

### `findSourcePathsWithJoi(targetRootDirectory, config?)`

Utility function to find all files containing Joi imports.

**Parameters:**

- `targetRootDirectory` (string): Root directory to search
- `config` (object, optional):
  - `glob` (string[]): Glob patterns for file filtering

**Returns:** Promise<string[]> - Array of file paths containing Joi imports

## Development

### Prerequisites

- Node.js >=22.0.0
- pnpm (recommended package manager)

### Setup

```bash
# Clone the repository
git clone https://github.com/kamaal111/joi-to-zod-codemod.git
cd joi-to-zod-codemod

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov
```

### Scripts

- `pnpm build` - Compile TypeScript and prepare for distribution
- `pnpm test` - Run test suite
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [jscodeshift](https://github.com/facebook/jscodeshift) for AST transformations
- Uses [joi-to-json](https://github.com/kenspirit/joi-to-json) for Joi schema analysis
- Uses [json-schema-to-zod](https://github.com/StefanTerdell/json-schema-to-zod) for Zod generation
- CLI powered by [oclif](https://oclif.io/)

## Author

**Kamaal Farah** - [GitHub](https://github.com/kamaal111)

---

_Transform your validation schemas with confidence! 🧉_
