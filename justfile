set export

PN := "pnpm"
PNR := PN + " run"
PNX := PN + " exec"
TSX := PNX + " tsx"

CLI_BIN := if env_var_or_default("CLI_ENTRY", "src") == "dist" { "bin/run.mjs" } else { "bin/dev.mjs" }

# List available commands
default:
    just --list --unsorted

# Test package
test:
    {{ PNR }} test

# Test package with watch
test-watch:
    {{ PNR }} test:watch

# Test package with coverage
test-cov:
    {{ PNR }} test:cov

# Type check example
type-check-example:
    {{ PNR }} type-check:example

# Test example
test-example:
    {{ PNR }} test:example

# Test package and update snapshots
test-u:
    {{ PNR }} test:u

# Build package
build:
    {{ PNR }} build

# Clean and build package
build-clean:
    {{ PNR }} clean:build

# Lint package
lint:
    {{ PNR }} lint

# Lint example
lint-example:
    {{ PNR }} lint:example

# Type check
type-check:
    {{ PNR }} type-check

# Type check tests
type-check-test:
    {{ PNR }} type-check:test

# Format code
format:
    {{ PNR }} format

# Check code formatting
format-check:
    {{ PNR }} format:check

# Run quality checks
quality: lint format-check type-check type-check-test

# Preview command
preview:
    node ./bin/dev.mjs run test/resources

# Transform the example app
transform-example:
    node {{ CLI_BIN }} run example

# Publish package to NPM
publish version: install-modules build-clean
    #!/bin/zsh
    set -e

    package_name=$(node -p "require('./package.json').name")
    status_code=$(curl -s -o /dev/null -w '%{http_code}' "https://registry.npmjs.org/${package_name}/{{ version }}")
    if [ "$status_code" = "200" ]; then
      echo "❌ ${package_name}@{{ version }} is already published to npm. Push a new tag with a version that hasn't been published yet." >&2
      exit 1
    fi

    pnpm pkg set version="{{ version }}"
    pnpm publish --no-git-checks

# Install dependencies
install-modules:
    #!/bin/zsh

    echo "Y" | pnpm i

# Bootstrap project
bootstrap: install-modules

# Set up dev container. This step runs after building the dev container
[linux]
post-dev-container-create:
    just .devcontainer/post-create
    just bootstrap

# Bootstrap for CI
[linux]
bootstrap-ci: install-zsh install-modules

[private]
[linux]
install-zsh:
    sudo apt-get update
    sudo apt-get install -y zsh
