# notcontrolOS Makefile
# SPDX-License-Identifier: GPL-2.0

VERSION = 0
PATCHLEVEL = 1
SUBLEVEL = 0
EXTRAVERSION = -alpha
NAME = notcontrolOS

# Top-level build targets
.PHONY: all kernel modules clean distclean help

# Default target
all: kernel modules

# Include configuration
-include .config

# Build directories
KERNELDIR = kernel
ARCHDIR = arch
DRIVERSDIR = drivers
FSDIR = fs
NETDIR = net
SECURITYDIR = security
LIBDIR = lib

# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -std=gnu11
KERNELFLAGS = -O2 -fno-stack-protector -nostdlib -nostdinc

# Architecture detection
ARCH ?= $(shell uname -m)
ifeq ($(ARCH),x86_64)
    ARCHDIR := arch/x86_64
else ifeq ($(ARCH),aarch64)
    ARCHDIR := arch/arm64
else ifeq ($(ARCH),arm64)
    ARCHDIR := arch/arm64
else
    ARCHDIR := arch/common
endif

# Build kernel
kernel:
	@echo "Building notcontrolOS kernel..."
	$(MAKE) -C $(KERNELDIR) ARCH=$(ARCH)
	$(MAKE) -C $(ARCHDIR) ARCH=$(ARCH)

# Build modules
modules:
	@echo "Building notcontrolOS modules..."
	$(MAKE) -C $(DRIVERSDIR)
	$(MAKE) -C $(FSDIR)
	$(MAKE) -C $(NETDIR)
	$(MAKE) -C $(SECURITYDIR)
	$(MAKE) -C $(LIBDIR)

# PSP support
psp:
	@echo "Building PSP support..."
	$(MAKE) -C lib/psp

# AI subsystem
ai:
	@echo "Building AI subsystem..."
	$(MAKE) -C kernel/ai

# Tools
tools:
	@echo "Building notcontrolOS tools..."
	$(MAKE) -C tools

# Install
install: all
	@echo "Installing notcontrolOS..."
	install -d $(DESTDIR)/boot
	install -d $(DESTDIR)/lib/modules/$(VERSION).$(PATCHLEVEL).$(SUBLEVEL)

# Configuration
config:
	@echo "Running notcontrolOS configuration..."
	scripts/config/conf Kconfig

menuconfig:
	@echo "Running notcontrolOS menu configuration..."
	scripts/config/mconf Kconfig

# Clean targets
clean:
	@echo "Cleaning notcontrolOS build..."
	$(MAKE) -C $(KERNELDIR) clean
	$(MAKE) -C $(DRIVERSDIR) clean
	$(MAKE) -C $(FSDIR) clean
	$(MAKE) -C $(NETDIR) clean
	$(MAKE) -C $(SECURITYDIR) clean
	$(MAKE) -C $(LIBDIR) clean
	$(MAKE) -C tools clean

distclean: clean
	@echo "Performing deep clean..."
	rm -f .config .config.old
	rm -f System.map
	rm -f notcontrolos

# Documentation
docs:
	@echo "Building documentation..."
	$(MAKE) -C Documentation

# Help
help:
	@echo "notcontrolOS Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all         - Build kernel and modules (default)"
	@echo "  kernel      - Build kernel only"
	@echo "  modules     - Build modules only"
	@echo "  psp         - Build PSP support"
	@echo "  ai          - Build AI subsystem"
	@echo "  tools       - Build development tools"
	@echo "  config      - Configure build"
	@echo "  menuconfig  - Interactive configuration"
	@echo "  install     - Install notcontrolOS"
	@echo "  clean       - Clean build files"
	@echo "  distclean   - Deep clean"
	@echo "  docs        - Build documentation"
	@echo "  help        - Show this help"

# Version information
version:
	@echo "notcontrolOS $(VERSION).$(PATCHLEVEL).$(SUBLEVEL)$(EXTRAVERSION) ($(NAME))"

.PHONY: config menuconfig docs version 