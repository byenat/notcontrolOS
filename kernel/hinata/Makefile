# HiNATA Kernel Module Makefile
# SPDX-License-Identifier: GPL-2.0

# HiNATA kernel module configuration
obj-$(CONFIG_HINATA) += hinata.o

# HiNATA core components
hinata-y := core/hinata_core.o \
           core/hinata_packet.o \
           core/hinata_validation.o \
           storage/hinata_storage.o \
           storage/hinata_memory.o \
           kernel/hinata_syscalls.o \
           kernel/hinata_interface.o \
           kernel/hinata_events.o

# Optional components
hinata-$(CONFIG_HINATA_SQLITE) += storage/hinata_sqlite.o
hinata-$(CONFIG_HINATA_ENCRYPTION) += security/hinata_crypto.o
hinata-$(CONFIG_HINATA_COMPRESSION) += compression/hinata_compress.o
hinata-$(CONFIG_HINATA_NETWORK) += network/hinata_sync.o

# Include paths
ccflags-y += -I$(src)/include
ccflags-y += -I$(src)/../include
ccflags-y += -I$(src)/../../fs/knowledge/hinata/core

# Compiler flags
ccflags-y += -DHINATA_VERSION=\"1.0.0\"
ccflags-y += -DHINATA_BUILD_DATE=\"$(shell date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"

# Debug flags
ccflags-$(CONFIG_HINATA_DEBUG) += -DHINATA_DEBUG -g

# Performance optimization flags
ccflags-$(CONFIG_HINATA_OPTIMIZE) += -O2 -DHINATA_OPTIMIZE

# Security flags
ccflags-$(CONFIG_HINATA_SECURITY) += -DHINATA_SECURITY -fstack-protector-strong

# Clean targets
clean-files := *.o *.ko *.mod.c *.mod.o *.symvers *.order
clean-dirs := core/ storage/ kernel/ security/ compression/ network/

# Install targets
install-y := hinata.ko

# Module information
MODULE_DESCRIPTION := "HiNATA - Core content and storage structure for notcontrolOS"
MODULE_AUTHOR := "ZentaN Team <team@zentan.ai>"
MODULE_LICENSE := "GPL v2"
MODULE_VERSION := "1.0.0"

# Export symbols for other modules
EXPORT_SYMBOL(hinata_packet_create);
EXPORT_SYMBOL(hinata_packet_destroy);
EXPORT_SYMBOL(hinata_packet_validate);
EXPORT_SYMBOL(hinata_storage_store);
EXPORT_SYMBOL(hinata_storage_retrieve);
EXPORT_SYMBOL(hinata_storage_search);
EXPORT_SYMBOL(hinata_knowledge_block_create);
EXPORT_SYMBOL(hinata_knowledge_block_update);
EXPORT_SYMBOL(hinata_knowledge_block_delete);