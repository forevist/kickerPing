# Загружаем переменные окружения из .env
include .env
export

# === Константы ===
IMAGE_NAME = kikerping-bot
TAR_FILE = $(IMAGE_NAME).tar.gz
SERVER = $(SERVER_USER)@$(SERVER_HOST)
SERVER_DIR = $(SERVER_PATH)

# === Цели ===

.PHONY: all build save push deploy clean

# Собрать образ Docker локально
build:
	docker build --platform linux/amd64 -t $(IMAGE_NAME) .

# Сохранить образ в tar.gz
save:
	docker save $(IMAGE_NAME) | gzip > $(TAR_FILE)

# Передать архив, .env и БД на сервер
push: save
	scp $(TAR_FILE) .env storage.db docker-compose.yml $(SERVER):$(SERVER_DIR)

# Развернуть на сервере: распаковать, загрузить, запустить
deploy: push
	ssh $(SERVER) 'cd $(SERVER_DIR) && \
		gunzip -f $(TAR_FILE) && \
		docker load < $(IMAGE_NAME).tar && \
		docker compose up -d'

# Удалить временный архив
clean:
	rm -f $(TAR_FILE)