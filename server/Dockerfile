# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN chown node:node /app
USER node

FROM base AS dependencies
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci --no-audit --no-fund

FROM dependencies AS development
COPY --chown=node:node . .
EXPOSE 3000
CMD ["npm", "run", "start:dev", "--", "--no-shell", "--path", "tsconfig.build.json"]

FROM development AS build
RUN npm run build

FROM base AS production-dependencies
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci --omit=dev --no-audit --no-fund

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
