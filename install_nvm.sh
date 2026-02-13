#!/bin/bash

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM (so we can use it immediately)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js LTS
nvm install --lts

# Install pnpm globally
npm install -g pnpm

# Verify installations
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PNPM version: $(pnpm -v)"

# Install project dependencies
echo "Installing project dependencies..."
pnpm install
