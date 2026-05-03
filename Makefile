SHELL := /bin/bash

.DEFAULT_GOAL := help

DEV_HOST ?= 127.0.0.1
DEV_PORT ?= 4173
CACHE_DIR := .cache
DEV_PID := $(CACHE_DIR)/vite.pid
DEV_LOG := $(CACHE_DIR)/vite.log

.PHONY: help up down lint test build deploy sync-assets

help:
	@printf "Targets: up down lint test build deploy\n"

sync-assets:
	@npm run sync:assets

up: sync-assets
	@DEV_HOST=$(DEV_HOST) DEV_PORT=$(DEV_PORT) node scripts/dev-server.mjs up

down:
	@DEV_HOST=$(DEV_HOST) DEV_PORT=$(DEV_PORT) node scripts/dev-server.mjs down

lint:
	@npm run lint

test:
	@npm run test

build:
	@npm run build

deploy:
	@npm run deploy
