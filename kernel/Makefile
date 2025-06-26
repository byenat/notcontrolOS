# notcontrolOS Kernel Makefile
# SPDX-License-Identifier: GPL-2.0

obj-y := core/ mm/ ai/ init/

# Core kernel subsystems
obj-$(CONFIG_NOTCONTROLOS) += core/
obj-$(CONFIG_CONTEXT_MEMORY) += mm/
obj-$(CONFIG_NOTCONTROLOS_AI) += ai/
obj-y += init/

# Build order
core-y := core/session/ core/scheduler/ core/ipc/ core/syscalls/
mm-y := mm/context/ mm/knowledge/ mm/compression/ mm/paging/
ai-y := ai/inference/ ai/routing/ ai/optimization/ ai/learning/
init-y := init/boot/ init/psp_loader/ init/config/

# Version information
VERSION_OBJS := version.o

# Always build these
obj-y += $(VERSION_OBJS)

# Clean targets
clean-files := *.o *.a
clean-dirs := $(obj-y) 