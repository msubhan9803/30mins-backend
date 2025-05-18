### Set environment variables
define HELP_TEXT
Usage: make [TARGET]
Available targets:
endef

export HELP_TEXT

help: ## help target
	@echo "$$HELP_TEXT"
	@awk 'BEGIN {FS = ":.*?## "} /^[0-9a-zA-Z_-]+:.*?## / \
                {printf "\033[36m%-30s\033[0m  %s\n", $$1, $$2}' $(MAKEFILE_LIST)

upload_document: ## update and set dfault document
	@aws sts get-caller-identity
	@env
	cd iac && bash -x update-document.sh
