# GURU API · Node 22 · build desde apps/api (contexto = apps/api en Koyeb)
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json tsconfig.json ./
RUN npm install --ignore-scripts --legacy-peer-deps
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
