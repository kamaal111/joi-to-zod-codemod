set export

PN := "pnpm"
PNR := PN + " run"
PNX := PN + " exec"
TSX := PNX + " tsx"

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

# Type check
type-check:
    {{ PNR }} type-check

# Format code
format:
    {{ PNR }} format

# Check code formatting
format-check:
    {{ PNR }} format:check

# Run quality checks
quality: lint format-check type-check

# Preview command
preview:
    node ./bin/dev.mjs run test/resources

# Publish package to NPM
publish: install-modules build-clean
    #!/bin/zsh

    {{ TSX }} scripts/publish-package-json.ts "${VERSION:-null}"

    pnpm publish --access public --no-git-checks

# Install dependencies
install-modules:
    #!/bin/zsh

    . ~/.zshrc || true

    echo "Y" | pnpm i

# Bootstrap project
bootstrap: install-node enable-corepack install-modules

# Set up dev container. This step runs after building the dev container
[linux]
post-dev-container-create:
    just .devcontainer/post-create
    just bootstrap

# Bootstrap for CI
[linux]
bootstrap-ci: install-zsh enable-corepack install-modules

[private]
[linux]
install-zsh:
    sudo apt-get update
    sudo apt-get install -y zsh

[private]
install-node:
    #!/bin/zsh

    curl -fsSL https://fnm.vercel.app/install | bash

    . ~/.zshrc || true

    fnm completions --shell zsh
    fnm install

[private]
enable-corepack:
    #!/bin/zsh

    . ~/.zshrc || true

    corepack enable
