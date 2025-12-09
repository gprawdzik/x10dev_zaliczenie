<script setup lang="ts">
import type { DropdownMenuRootProps } from 'reka-ui'
import { DropdownMenuRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps</* @vue-ignore */ DropdownMenuRootProps>()
// const emits = defineEmits</* @vue-ignore */ DropdownMenuRootEmits>()

const forwarded = useForwardPropsEmits(props)
</script>

<template>
  <DropdownMenuRoot v-slot="slotProps" data-slot="dropdown-menu" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </DropdownMenuRoot>
</template>
