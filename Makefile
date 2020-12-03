# Local variables.
SHELL    := bash
CENV     := $(HOME)/.cargo/env

ROOTDIR  := $(shell pwd)
WASM2WAT := $(ROOTDIR)/wabt/bin/wasm2wat

PROJECT  := qspm
DPATH    := $(PROJECT)/target/wasm32-unknown-unknown/debug
RPATH    := $(PROJECT)/target/wasm32-unknown-unknown/release
WATFILE  := $(DPATH)/$(PROJECT)_bg.wat
WASMFILE := www/wasm/$(PROJECT)_bg.wasm
JSFILE   := www/js/$(PROJECT).js
VERFILE  := www/js/version.js
HELPFILE := www/help/index.html

IMGSRCS  := $(shell ls -1 img/*png)
IMGFILES := $(patsubst img/%.png,www/help/img/%.png,$(IMGSRCS))

PORT     ?= 8005
TAR      ?= gnutar
BACKUP   ?= /tmp/$(PROJECT).tar
VERSION  ?= $(shell cat VERSION | awk '{print $$1}')
PANDOC   := pandoc

# webapp variables
WEBSRCS  := $(shell find www -type f)
WEBAPP   ?= $(PROJECT).zip
ZIP      ?= zip

# Macros
define hdr
	@printf '\x1b[35;1m'
	@printf '\n'
	@printf '=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n'
        @printf '=-=-= Date: %s %s\n' "$(shell date)"
        @printf '=-=-= Target: %s %s\n' "$1"
        @printf '=-=-= Directory: %s %s\n' "$$(pwd)"
	@printf '=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n'
	@printf '\x1b[0m'
endef

# Local targets.
.PHONY: default
default: build  ## Default target is build.

.PHONY: setup
setup: .setup  ## Initial setup.

# This only needs to be done once.
.setup: | tools/setup.sh
	$(call hdr,"setup")
	$(SHELL) ./tools/setup.sh
	pipenv install -d
	@touch $@

.PHONY: clean
clean:  ## Clean up everything.
	$(call hdr,"$@")
	-find . -type f -name '*~' -delete
	-rm -rf wabt
	-git clean -xdf -e keep .

# Help.
.PHONY: help
help:  ## This help message.
	@echo "Targets"
	@egrep '^[ ]*[^:]*[ ]*:.*##' $(MAKEFILE_LIST) 2>/dev/null | \
		egrep -v '^ *#' | \
		egrep -v 'egrep|sed' | \
		sed -e 's/: .*##/##/' -e 's/^[^:#]*://' | \
		column -t -s '##' | \
		sort -f | \
		sed -e 's@^@   @'
	@echo "Variables"
	@echo "   BACKUP   := $(BACKUP)"
	@echo "   CENV     := $(CENV)"
	@echo "   HELPFILE := $(HELPFILE)"
	@echo "   JSFILE   := $(JSFILE)"
	@echo "   PORT     := $(PORT)"
	@echo "   PROJECT  := $(PROJECT)"
	@echo "   PANDOC   := $(PANDOC)"
	@echo "   ROOTDIR  := $(ROOTDIR)"
	@echo "   TAR      := $(TAR)"
	@echo "   VARFILE  := $(VERFILE)"
	@echo "   VERSION  := $(VERSION)"
	@echo "   WATFILE  := $(WATFILE)"
	@echo "   WASM2WAT := $(WASM2WAT)"
	@echo "   WASMFILE := $(WASMFILE)"
	@echo "   WEBAPP   := $(WEBAPP)"

# Test.
# At present this only tests the Rust code.
.PHONY: test
test: build  ## Run the test actions.
	cd qspm && cargo test

# Web app bundle.
# This the collection of files that are used to install the
# webapp.
.PHONY: webapp
webapp: build webapp/$(WEBAPP)  ## Create the web app bundle.

webapp/$(WEBAPP): $(WEBSRCS)
	$(call hdr,"$(PROJECT)-$@")
	@-rm -rf $(dir $@)
	@mkdir -p $(dir $@)www
	@cp -r www/* $(dir $@)www/
	@cd $(dir $@)www && time $(ZIP) -r ../$(notdir $@) .
	@rm -rf $(dir $@)www
	unzip -l webapp/qspm.zip

# Backup.
# This was added after my laptop crashed 4 times in a single day.
.PHONY: backup
backup:  # Backup the source code.
	$(call hdr,"$(PROJECT)-$@")
	@-rm -f $(BACKUP)
	time $(TAR) -J -c -f $(BACKUP) .git $$(git ls-files)
	ls -lh $(BACKUP)

# Build all of the examples.
.PHONY: build
build: .setup $(VERFILE) $(WASM2WAT) $(WATFILE) $(JSFILE) $(HELPFILE) $(IMGFILES)  ## Build the project (default).

.PHONY: serve
serve: build  ## Run the server.
	$(call hdr,"$(PROJECT)-$@")
	@echo "Serving $@ at http://localhost: $(PORT) exit via ^C."
	cd www && pipenv run ../tools/server.py $(PORT)

# Image files.
www/help/img/%.png : img/%.png
	$(call hdr,"$(PROJECT)-$@")
	@[ ! -d $(dir $@)img ] && mkdir -p $(dir $@)img || true
	cp $< $@

# Generate help.
$(HELPFILE): README.md
	$(call hdr,"$(PROJECT)-$@")
	@[ ! -d $(dir $@)img ] && mkdir -p $(dir $@)img || true
	time $(PANDOC) --html-q-tags -o $(dir $@)index.html README.md
	@sed -ie 's@src="/@src="@' $(dir $@)index.html
	@sed -ie 's@\<img@<img width="800"@' $(dir $@)index.html
	@cp -r img/*.png $(dir $@)img/

# Capture the VERSION for runtime use.
$(VERFILE): VERSION
	$(call hdr,"$(PROJECT)-$@")
	@echo '// Automatically generated from VERSION.' > $@
	@echo '/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/' >> $@
	@echo 'window.addEventListener("load", function(_evt) {' >> $@
	@echo '    document.getElementById("version").innerHTML = "$(VERSION)";' >> $@
	@echo '    window.$(PROJECT)Version = "$(VERSION)";' >> $@
	@echo '});' >> $@
	cat -n $@

# Setup the shared infrastructure.
$(WASM2WAT):
	$(call hdr,"$(PROJECT)-$@")
	$(MAKE) setup

# Create the WAT file.
$(WATFILE): $(WASMFILE)
	$(call hdr,"$(PROJECT)-wat")
	time $(WASM2WAT) $< -o $@
	grep export $@

# The bindgen json file.
$(JSFILE): $(DPATH)/$(PROJECT).js
	$(call hdr,"$(PROJECT)-$@")
	@cp -v $< $@

# The wasm file.
$(WASMFILE): $(DPATH)/$(PROJECT)_bg.wasm
	$(call hdr,"$(PROJECT)-$@")
	@[ ! -d $(dir $@) ] && mkdir -p $(dir $@) || true
	@cp -v $< $@

$(DPATH)/$(PROJECT).js \
$(DPATH)/$(PROJECT)_bg.wasm: $(PROJECT)/.init src/lib.rs src/Cargo.toml
	$(call hdr,"$(PROJECT)-build")
	@cp -v src/Cargo.toml $(PROJECT)/
	@cp -v src/*.rs $(PROJECT)/src/
	source $(CENV) && cd $(PROJECT) && cargo build --target wasm32-unknown-unknown
	source $(CENV) && cd $(PROJECT) && cargo test
	source $(CENV) && cd $(PROJECT) && cargo doc --no-deps
	source $(CENV) && cd $(DPATH) && wasm-bindgen --target web --no-typescript --out-dir . $(PROJECT).wasm
	@cp -v $@ $@.orig
	source $(CENV) && wasm-gc $@
	ls -lh $@*

# Need to do it this way because the Cargo.toml and src/lib.rs files
# are always newer than the replacements.
$(PROJECT)/.init:
	$(call hdr,"$(PROJECT)-create")
	source $(CENV) && cargo new --lib $(PROJECT)
	@cp -v src/Cargo.toml $(PROJECT)/
	@cp -v src/*.rs $(PROJECT)/src/
	@touch $@
