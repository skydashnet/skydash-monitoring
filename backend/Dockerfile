FROM node:18-alpine AS base
WORKDIR /usr/src/app
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
FROM base AS runner
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]