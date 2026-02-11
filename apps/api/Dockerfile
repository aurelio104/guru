# APlat API · Node 22 (compatible Koyeb) · build desde apps/api
FROM node:22-alpine AS base
WORKDIR /app

# Builder: deps + compilar (--ignore-scripts evita fallos en módulos nativos opcionales)
FROM base AS builder
COPY package.json tsconfig.json ./
RUN npm install --ignore-scripts
COPY src ./src
RUN npm run build
RUN npm prune --production --ignore-scripts

# Producción
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
