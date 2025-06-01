set export

PNR := "pnpm run"
PNX := "pnpm exec"

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

# Compile package
compile:
    {{ PNR }} compile

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

# Publish package to NPM
publish: clean-build install-modules compile
    #!/bin/zsh

    {{ PNX }} tsx scripts/publish-package-json.ts "${VERSION:-null}"

    pnpm publish --access public --no-git-checks

# Install dependencies
install-modules:
    #!/bin/zsh

    . ~/.zshrc

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
bootstrap-ci: install-zsh bootstrap

[private]
[linux]
install-zsh:
    sudo apt-get update
    sudo apt-get install -y zsh

[private]
install-node:
    #!/bin/zsh

    curl -fsSL https://fnm.vercel.app/install | bash

    . ~/.zshrc

    fnm completions --shell zsh
    fnm install

[private]
clean-build:
    #!/bin/zsh

    rm -rf ./dist

[private]
enable-corepack:
    #!/bin/zsh

    . ~/.zshrc

    corepack enable
