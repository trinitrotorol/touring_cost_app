# Makefile for touring_cost_app

SHELL = cmd.exe

WORKTREE  		:= ../touring_cost_app_gh
BRANCH    		:= gh-pages
BUILD_DIR 		:= build\web
NOW       		:= $(shell powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'")
CURRENT_BRANCH 	:= $(shell git rev-parse --abbrev-ref HEAD)
DEPLOY_BRANCH  	:= main

.PHONY: deploy build-web sync-gh

deploy: build-web sync-gh

build-web:
	flutter build web --release --base-href /touring_cost_app/

sync-gh:
ifeq ($(CURRENT_BRANCH),$(DEPLOY_BRANCH))
	cd $(WORKTREE) && \
	git checkout $(BRANCH) && \
	git reset --hard && \
	git clean -fdx && \
	xcopy ..\touring_cost_app\$(BUILD_DIR)\* . /E /I /Y >nul && \
	git add . && \
	git diff --cached --quiet || git commit -m "Update gh-pages $(NOW)" && \
	git push origin $(BRANCH)
else
	@echo [ERROR] sync-gh can only be run from branch '$(DEPLOY_BRANCH)'. Current: '$(CURRENT_BRANCH)'
	@exit 1
endif
