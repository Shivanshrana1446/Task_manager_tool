# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# base: shared foundation for every stage below.
# python3/make/g++ are needed because `bcrypt` compiles a native addon and
# Alpine's musl libc has no prebuilt binary for it — without these, `npm ci`
# falls back to source compilation and fails.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./

# ---------------------------------------------------------------------------
# dependencies: full install (incl. devDependencies) — used by the dev stage.
# ---------------------------------------------------------------------------
FROM base AS dependencies
RUN npm ci

# ---------------------------------------------------------------------------
# dependencies-prod: production-only install, still built on top of the
# python/make/g++ toolchain so bcrypt compiles cleanly.
# ---------------------------------------------------------------------------
FROM base AS dependencies-prod
RUN npm ci --omit=dev

# ---------------------------------------------------------------------------
# development: nodemon + live-reloaded source (mounted via docker-compose).
# ---------------------------------------------------------------------------
FROM dependencies AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1
CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# production: minimal runtime image, prod-only deps, non-root user.
# Starts fresh from node:20-alpine (not `base`) so the python/make/g++
# toolchain never ships in the final image — only the compiled node_modules
# copied over from dependencies-prod are needed at runtime.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S expressjs -G nodejs

COPY --from=dependencies-prod /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs && chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
