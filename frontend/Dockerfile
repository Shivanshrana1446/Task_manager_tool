# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# base + dependencies: shared install layer for both the dev server and the
# production build.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS dependencies
RUN npm ci

# ---------------------------------------------------------------------------
# development: Vite's own dev server with HMR, source mounted via
# docker-compose for live reload.
# ---------------------------------------------------------------------------
FROM dependencies AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------------------------------------------------------------------------
# build: compiles the static production bundle. VITE_* vars are inlined into
# the bundle at build time, so they arrive as build args, not runtime env.
# Defaults point at the nginx reverse proxy defined in nginx.conf, so the
# browser only ever talks to a single origin.
# ---------------------------------------------------------------------------
FROM dependencies AS build
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_SOCKET_URL=/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
RUN npm run build

# ---------------------------------------------------------------------------
# production: static bundle served by nginx, which also reverse-proxies
# /api and /socket.io through to the backend container.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
