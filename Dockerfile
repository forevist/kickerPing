FROM node:20-alpine

# Установим нужные пакеты для сборки native зависимостей
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Сначала копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN yarn install

# Затем копируем остальной код
COPY . .

CMD ["node", "index.mjs"]