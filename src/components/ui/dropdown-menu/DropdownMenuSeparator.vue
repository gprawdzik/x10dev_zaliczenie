<script setup lang="ts">
import type { DropdownMenuSeparatorProps } from 'reka-ui'
import { DropdownMenuSeparator } from 'reka-ui'

const props = defineProps</* @vue-ignore */ DropdownMenuSeparatorProps>()
</script>

<template>
  <DropdownMenuSeparator
    data-slot="dropdown-separator"
    v-bind="props"
    class="-mx-1 my-1 h-px bg-border"
  />
</template>


