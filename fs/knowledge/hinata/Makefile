# HiNATA Makefile for notcontrolOS Integration
# This Makefile handles the build, test, and integration of HiNATA into notcontrolOS

# ============================================================================
# Configuration
# ============================================================================

# Project information
PROJECT_NAME := hinata
VERSION := 1.0.0
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Directories
SRC_DIR := .
CORE_DIR := $(SRC_DIR)/core
STORAGE_DIR := $(SRC_DIR)/storage
BUILD_DIR := build
DIST_DIR := dist
TEST_DIR := tests
DOCS_DIR := docs

# Tools
TSC := npx tsc
ESLINT := npx eslint
JEST := npx jest
TYPEDOC := npx typedoc
CLANG := clang
GCC := gcc

# Compiler flags
CFLAGS := -Wall -Wextra -std=c11 -O2 -fPIC
CFLAGS_DEBUG := -Wall -Wextra -std=c11 -g -DDEBUG -fPIC
TSFLAGS := --strict --target ES2020 --module commonjs --declaration
TSFLAGS_PROD := $(TSFLAGS) --sourceMap false --removeComments

# Source files
TS_SOURCES := $(shell find $(SRC_DIR) -name '*.ts' -not -path '*/node_modules/*' -not -path '*/build/*' -not -path '*/dist/*')
C_SOURCES := $(shell find $(CORE_DIR) -name '*.c' 2>/dev/null || true)
H_SOURCES := $(shell find $(CORE_DIR) -name '*.h')

# Output files
JS_OUTPUTS := $(TS_SOURCES:%.ts=$(BUILD_DIR)/%.js)
D_TS_OUTPUTS := $(TS_SOURCES:%.ts=$(BUILD_DIR)/%.d.ts)
C_OBJECTS := $(C_SOURCES:%.c=$(BUILD_DIR)/%.o)
LIBRARY := $(BUILD_DIR)/libhinata.a
SHARED_LIBRARY := $(BUILD_DIR)/libhinata.so

# ============================================================================
# Default target
# ============================================================================

.PHONY: all
all: build

# ============================================================================
# Build targets
# ============================================================================

.PHONY: build
build: typescript c-library

.PHONY: typescript
typescript: $(BUILD_DIR) $(JS_OUTPUTS) $(D_TS_OUTPUTS)
	@echo "TypeScript compilation completed"

.PHONY: c-library
c-library: $(BUILD_DIR) $(LIBRARY) $(SHARED_LIBRARY)
	@echo "C library compilation completed"

# TypeScript compilation
$(BUILD_DIR)/%.js $(BUILD_DIR)/%.d.ts: %.ts
	@mkdir -p $(dir $@)
	$(TSC) $(TSFLAGS) --outDir $(BUILD_DIR) --declarationDir $(BUILD_DIR) $<

# C object files
$(BUILD_DIR)/%.o: %.c
	@mkdir -p $(dir $@)
	$(GCC) $(CFLAGS) -c $< -o $@

# Static library
$(LIBRARY): $(C_OBJECTS)
	@mkdir -p $(dir $@)
	ar rcs $@ $^

# Shared library
$(SHARED_LIBRARY): $(C_OBJECTS)
	@mkdir -p $(dir $@)
	$(GCC) -shared -o $@ $^

# ============================================================================
# Development targets
# ============================================================================

.PHONY: dev
dev: build-dev watch

.PHONY: build-dev
build-dev: CFLAGS := $(CFLAGS_DEBUG)
build-dev: TSFLAGS := $(TSFLAGS) --sourceMap
build-dev: build

.PHONY: watch
watch:
	@echo "Starting development watch mode..."
	$(TSC) $(TSFLAGS) --watch --outDir $(BUILD_DIR) &
	make watch-c &
	wait

.PHONY: watch-c
watch-c:
	@echo "Watching C files for changes..."
	while true; do \
		inotifywait -e modify $(C_SOURCES) $(H_SOURCES) 2>/dev/null && \
		make c-library; \
	done

# ============================================================================
# Testing targets
# ============================================================================

.PHONY: test
test: test-ts test-c

.PHONY: test-ts
test-ts: typescript
	@echo "Running TypeScript tests..."
	$(JEST) --config jest.config.js

.PHONY: test-c
test-c: c-library
	@echo "Running C tests..."
	@if [ -d "$(TEST_DIR)/c" ]; then \
		for test in $(TEST_DIR)/c/*.c; do \
			echo "Compiling and running $$test..."; \
			$(GCC) $(CFLAGS_DEBUG) -I$(CORE_DIR) $$test $(LIBRARY) -o $(BUILD_DIR)/test_$$(basename $$test .c) && \
			$(BUILD_DIR)/test_$$(basename $$test .c); \
		done; \
	else \
		echo "No C tests found"; \
	fi

.PHONY: test-watch
test-watch:
	$(JEST) --config jest.config.js --watch

.PHONY: test-coverage
test-coverage:
	$(JEST) --config jest.config.js --coverage

# ============================================================================
# Quality assurance
# ============================================================================

.PHONY: lint
lint: lint-ts lint-c

.PHONY: lint-ts
lint-ts:
	@echo "Linting TypeScript files..."
	$(ESLINT) $(TS_SOURCES)

.PHONY: lint-c
lint-c:
	@echo "Linting C files..."
	@if command -v cppcheck >/dev/null 2>&1; then \
		cppcheck --enable=all --std=c11 $(C_SOURCES); \
	else \
		echo "cppcheck not found, skipping C linting"; \
	fi

.PHONY: format
format: format-ts format-c

.PHONY: format-ts
format-ts:
	@echo "Formatting TypeScript files..."
	npx prettier --write $(TS_SOURCES)

.PHONY: format-c
format-c:
	@echo "Formatting C files..."
	@if command -v clang-format >/dev/null 2>&1; then \
		clang-format -i $(C_SOURCES) $(H_SOURCES); \
	else \
		echo "clang-format not found, skipping C formatting"; \
	fi

# ============================================================================
# Documentation
# ============================================================================

.PHONY: docs
docs: docs-ts docs-c

.PHONY: docs-ts
docs-ts:
	@echo "Generating TypeScript documentation..."
	@mkdir -p $(DOCS_DIR)
	$(TYPEDOC) --out $(DOCS_DIR)/typescript $(TS_SOURCES)

.PHONY: docs-c
docs-c:
	@echo "Generating C documentation..."
	@mkdir -p $(DOCS_DIR)
	@if command -v doxygen >/dev/null 2>&1; then \
		doxygen Doxyfile; \
	else \
		echo "doxygen not found, skipping C documentation"; \
	fi

# ============================================================================
# Distribution
# ============================================================================

.PHONY: dist
dist: clean build test
	@echo "Creating distribution package..."
	@mkdir -p $(DIST_DIR)
	cp -r $(BUILD_DIR)/* $(DIST_DIR)/
	cp README.md $(DIST_DIR)/
	cp package.json $(DIST_DIR)/ 2>/dev/null || true
	echo '{"name":"hinata","version":"$(VERSION)","buildDate":"$(BUILD_DATE)"}' > $(DIST_DIR)/package.json
	tar -czf $(DIST_DIR)/hinata-$(VERSION).tar.gz -C $(DIST_DIR) .
	@echo "Distribution package created: $(DIST_DIR)/hinata-$(VERSION).tar.gz"

# ============================================================================
# Installation
# ============================================================================

.PHONY: install
install: build
	@echo "Installing HiNATA to notcontrolOS..."
	# Copy TypeScript build outputs
	@mkdir -p ../../lib/hinata
	cp -r $(BUILD_DIR)/*.js ../../lib/hinata/ 2>/dev/null || true
	cp -r $(BUILD_DIR)/*.d.ts ../../lib/hinata/ 2>/dev/null || true
	# Copy C libraries
	@mkdir -p ../../../kernel/lib
	cp $(LIBRARY) ../../../kernel/lib/ 2>/dev/null || true
	cp $(SHARED_LIBRARY) ../../../kernel/lib/ 2>/dev/null || true
	# Copy headers
	@mkdir -p ../../../kernel/include/hinata
	cp $(CORE_DIR)/*.h ../../../kernel/include/hinata/ 2>/dev/null || true
	@echo "HiNATA installed successfully"

.PHONY: uninstall
uninstall:
	@echo "Uninstalling HiNATA from notcontrolOS..."
	rm -rf ../../lib/hinata
	rm -f ../../../kernel/lib/libhinata.*
	rm -rf ../../../kernel/include/hinata
	@echo "HiNATA uninstalled successfully"

# ============================================================================
# Integration with notcontrolOS
# ============================================================================

.PHONY: integrate
integrate: install
	@echo "Integrating HiNATA with notcontrolOS kernel..."
	# Add HiNATA to kernel Makefile if not already present
	@if ! grep -q "hinata" ../../../kernel/Makefile; then \
		echo "Adding HiNATA to kernel Makefile..."; \
		echo "" >> ../../../kernel/Makefile; \
		echo "# HiNATA Integration" >> ../../../kernel/Makefile; \
		echo "HINATA_LIB := lib/libhinata.a" >> ../../../kernel/Makefile; \
		echo "HINATA_INCLUDES := -Iinclude/hinata" >> ../../../kernel/Makefile; \
		echo "CFLAGS += \$$(HINATA_INCLUDES)" >> ../../../kernel/Makefile; \
		echo "LIBS += \$$(HINATA_LIB)" >> ../../../kernel/Makefile; \
	fi
	@echo "HiNATA integration completed"

# ============================================================================
# Benchmarking
# ============================================================================

.PHONY: benchmark
benchmark: build
	@echo "Running HiNATA benchmarks..."
	@if [ -d "$(TEST_DIR)/benchmarks" ]; then \
		node $(TEST_DIR)/benchmarks/run_benchmarks.js; \
	else \
		echo "No benchmarks found"; \
	fi

# ============================================================================
# Profiling
# ============================================================================

.PHONY: profile
profile: build-dev
	@echo "Running HiNATA profiling..."
	node --prof $(TEST_DIR)/profiling/profile_hinata.js
	node --prof-process isolate-*.log > profile_report.txt
	@echo "Profiling report generated: profile_report.txt"

# ============================================================================
# Memory analysis
# ============================================================================

.PHONY: memory-check
memory-check: c-library
	@echo "Running memory analysis..."
	@if command -v valgrind >/dev/null 2>&1; then \
		for test in $(BUILD_DIR)/test_*; do \
			if [ -x "$$test" ]; then \
				echo "Memory checking $$test..."; \
				valgrind --leak-check=full --show-leak-kinds=all $$test; \
			fi; \
		done; \
	else \
		echo "valgrind not found, skipping memory analysis"; \
	fi

# ============================================================================
# Cleanup
# ============================================================================

.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -rf $(DIST_DIR)
	rm -rf node_modules/.cache
	rm -f *.log
	rm -f profile_report.txt

.PHONY: clean-all
clean-all: clean
	@echo "Cleaning all generated files..."
	rm -rf node_modules
	rm -rf $(DOCS_DIR)
	rm -f package-lock.json

# ============================================================================
# Utilities
# ============================================================================

.PHONY: info
info:
	@echo "HiNATA Build Information:"
	@echo "  Project: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Build Date: $(BUILD_DATE)"
	@echo "  Source Directory: $(SRC_DIR)"
	@echo "  Build Directory: $(BUILD_DIR)"
	@echo "  TypeScript Sources: $(words $(TS_SOURCES)) files"
	@echo "  C Sources: $(words $(C_SOURCES)) files"
	@echo "  Header Files: $(words $(H_SOURCES)) files"

.PHONY: check-deps
check-deps:
	@echo "Checking dependencies..."
	@command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed"; exit 1; }
	@command -v $(GCC) >/dev/null 2>&1 || { echo "GCC is required but not installed"; exit 1; }
	@echo "All required dependencies are available"

.PHONY: setup
setup: check-deps
	@echo "Setting up HiNATA development environment..."
	npm install
	@mkdir -p $(BUILD_DIR)
	@mkdir -p $(TEST_DIR)
	@mkdir -p $(DOCS_DIR)
	@echo "Development environment setup completed"

# ============================================================================
# Directory creation
# ============================================================================

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(DIST_DIR):
	@mkdir -p $(DIST_DIR)

$(DOCS_DIR):
	@mkdir -p $(DOCS_DIR)

# ============================================================================
# Help
# ============================================================================

.PHONY: help
help:
	@echo "HiNATA Makefile - Available targets:"
	@echo ""
	@echo "Build targets:"
	@echo "  all          - Build everything (default)"
	@echo "  build        - Build TypeScript and C components"
	@echo "  typescript   - Build TypeScript components only"
	@echo "  c-library    - Build C library only"
	@echo "  dev          - Build for development with debug info"
	@echo "  watch        - Watch for changes and rebuild"
	@echo ""
	@echo "Testing targets:"
	@echo "  test         - Run all tests"
	@echo "  test-ts      - Run TypeScript tests"
	@echo "  test-c       - Run C tests"
	@echo "  test-watch   - Run tests in watch mode"
	@echo "  test-coverage - Run tests with coverage report"
	@echo ""
	@echo "Quality targets:"
	@echo "  lint         - Lint all source files"
	@echo "  format       - Format all source files"
	@echo "  docs         - Generate documentation"
	@echo ""
	@echo "Distribution targets:"
	@echo "  dist         - Create distribution package"
	@echo "  install      - Install to notcontrolOS"
	@echo "  uninstall    - Remove from notcontrolOS"
	@echo "  integrate    - Full integration with notcontrolOS"
	@echo ""
	@echo "Analysis targets:"
	@echo "  benchmark    - Run performance benchmarks"
	@echo "  profile      - Run profiling analysis"
	@echo "  memory-check - Run memory analysis"
	@echo ""
	@echo "Utility targets:"
	@echo "  clean        - Clean build artifacts"
	@echo "  clean-all    - Clean all generated files"
	@echo "  info         - Show build information"
	@echo "  check-deps   - Check required dependencies"
	@echo "  setup        - Setup development environment"
	@echo "  help         - Show this help message"

# ============================================================================
# Special targets
# ============================================================================

.SUFFIXES:
.SECONDARY:
.DELETE_ON_ERROR:

# Prevent make from deleting intermediate files
.PRECIOUS: $(BUILD_DIR)/%.o $(BUILD_DIR)/%.js $(BUILD_DIR)/%.d.ts