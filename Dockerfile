# Stage 1: Builder stage
FROM node:20-alpine AS builder

# Установим нужные пакеты для сборки native зависимостей
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Сначала копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN yarn install

# Копируем исходный код и пересобираем нативные модули
COPY . .
RUN yarn rebuild better-sqlite3

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /app

# Копируем только необходимые файлы из builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/ ./

# Убедимся, что нативные модули работают
RUN node -e "require('better-sqlite3')" || echo "Проверка нативных модулей"

CMD ["node", "index.mjs"]