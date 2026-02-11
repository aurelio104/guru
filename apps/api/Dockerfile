# APlat API · Node 22 (compatible Koyeb) · build desde apps/api
FROM node:22-alpine AS base
WORKDIR /app

# Builder: deps + compilar
FROM base AS builder
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
COPY src ./src
RUN npm run build

# Producción: solo runtime (node_modules ya incluye prod por omit=dev en primer install)
FROM base AS runner
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
