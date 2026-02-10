# APlat API · Node 24 · Koyeb
FROM node:24-alpine AS base

WORKDIR /app

# Dependencias
FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

# Build
FROM base AS builder
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

# Producción
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]
