<script setup lang="ts">
import type { DropdownMenuLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { DropdownMenuLabel } from 'reka-ui'
import { cn } from '@/lib/utils'

type Props = /* @vue-ignore */ DropdownMenuLabelProps & {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuLabel
    data-slot="dropdown-label"
    v-bind="props"
    :class="cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', props.class)"
  >
    <slot />
  </DropdownMenuLabel>
</template>


