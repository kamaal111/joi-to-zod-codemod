# Joi to Zod Codemod

A powerful CLI tool and library for automatically converting [Joi](https://joi.dev/) schema definitions to [Zod](https://zod.dev/) schemas in TypeScript and JavaScript projects. This codemod intelligently transforms validation schemas while preserving complex relationships, nested structures, and import dependencies.

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
joi-to-zod-codemod run ./src
```

### CLI Options

| Flag        | Short | Default          | Description                              |
| ----------- | ----- | ---------------- | ---------------------------------------- |
| `--dry`     | `-d`  | `false`          | Preview changes without writing to files |
| `--ignores` | `-i`  | `"node_modules"` | Paths to ignore                          |
| `--search`  | `-s`  | `**/*.ts`        | Glob patterns to search for              |
| `--log`     | `-l`  | `true`           | Enable logging output                    |

### Examples

```bash
# Dry run to preview changes
joi-to-zod-codemod run --dry

# Transform specific files with custom glob
joi-to-zod-codemod run --search src/**/*.ts

# Transform specific directory with minimal output
joi-to-zod-codemod run ./api --no-log
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

## Author

**Kamaal Farah** - [GitHub](https://github.com/kamaal111)

---

_Transform your validation schemas with confidence! 🧉_
