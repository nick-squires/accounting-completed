# syntax=docker/dockerfile:1

# --- builder: install workspace deps and produce the deploy artifact ---
FROM node:22-bookworm-slim AS builder
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
# `prisma generate` (via prisma.config.ts) requires DATABASE_URL to resolve, but never
# connects at generate time. Placeholder satisfies it; runtime uses MAC_DB_* instead.
ENV DATABASE_URL="sqlserver://build-placeholder:1433;database=build;"
# builds web + api and copies the web bundle into dist/apps/api/public
RUN pnpm build:deploy
# materialize production-only deps inside the artifact
WORKDIR /repo/dist/apps/api
RUN npm install --omit=dev --no-audit --no-fund

# --- runner: slim runtime carrying only the built artifact ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# App Service maps to this port (WEBSITES_PORT=8080); the server reads process.env.PORT.
ENV PORT=8080
COPY --from=builder /repo/dist/apps/api ./
EXPOSE 8080
CMD ["node", "main.js"]
