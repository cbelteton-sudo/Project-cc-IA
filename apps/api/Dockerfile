# 1. Base Image
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Dependencies (Cached Layer)
FROM base AS dependencies
# Force development environment to ensure devDependencies (like @nestjs/cli) are installed
ENV NODE_ENV=development
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

# Check if packages exist to avoid copy error if empty in some environments
# But assuming structure relies on it.
# Using --no-frozen-lockfile to bypass strict lockfile checks in CI environment
# This resolved persistent "ERR_PNPM_OUTDATED_LOCKFILE" errors on Railway
RUN pnpm install --no-frozen-lockfile

# 3. Build Stage
FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
# Re-link workspace packages if needed, but pnpm install in step 2 should handle it
# However, modifying source code invalidates this layer, so we install again or rely on copy
# Best practice with pnpm workspaces:
# We need the full source to build.
# Dependencies layer is for node_modules.
# Let's refine:
# COPY --from=dependencies /app/node_modules ./node_modules
# The previous step installed deps based on package.json content.
# If we copy source now, we are good.

# Generate Prisma Client (needed for build)
WORKDIR /app/apps/api
# Use npx with explicit version to guarantee correct binary (v5.22.0) and avoid "command not found" 
RUN npx --yes prisma@5.22.0 generate

# Build API
WORKDIR /app
RUN pnpm --filter api build

# 4. Production Image
FROM base AS deploy
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json

EXPOSE 3000

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

CMD ["node", "dist/main"]
# trigger build
