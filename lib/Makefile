# notcontrolOS Library Makefile
# SPDX-License-Identifier: GPL-2.0

lib-y := psp/ ai_utils/ compression/ crypto/

# PSP library
obj-$(CONFIG_PSP_SUPPORT) += psp/

# AI utilities
obj-$(CONFIG_NOTCONTROLOS_AI) += ai_utils/

# Compression library
obj-$(CONFIG_CONTEXT_MEMORY) += compression/

# Cryptographic library
obj-$(CONFIG_NOTCONTROLOS_SECURITY) += crypto/

# Always build these core libraries
obj-y += psp/ ai_utils/

# Clean targets
clean-files := *.o *.a
clean-dirs := $(lib-y) 