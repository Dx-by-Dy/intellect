.DEFAULT_GOAL := build

UV ?= uv
PORT ?= 8000

UV_PYTHON := $(UV) run --locked --python 3.12 python
SITE_DIR := _site

.PHONY: build serve sync lock help

build: ## Собрать весь сайт в _site/
	$(UV_PYTHON) scripts/build_pages.py "$(SITE_DIR)"

serve: build ## Собрать сайт и запустить локальный сервер (PORT=8000)
	$(UV_PYTHON) -m http.server "$(PORT)" --bind 127.0.0.1 --directory "$(SITE_DIR)"

sync: ## Установить зависимости из uv.lock
	$(UV) sync --locked --python 3.12

lock: ## Обновить uv.lock
	$(UV) lock --python 3.12

help: ## Показать список целей
	@awk -F ':[^#]*##[[:space:]]+' \
		'/^[[:alnum:]_-]+:[^#]*##[[:space:]]/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)
