<script setup lang="ts">
import type { DropdownMenuTriggerProps } from 'reka-ui'
import { DropdownMenuTrigger } from 'reka-ui'

const props = defineProps</* @vue-ignore */ DropdownMenuTriggerProps>()
</script>

<template>
  <DropdownMenuTrigger
    data-slot="dropdown-trigger"
    v-bind="props"
  >
    <slot />
  </DropdownMenuTrigger>
</template>


