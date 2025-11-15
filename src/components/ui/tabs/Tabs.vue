<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsRoot, useForwardPropsEmits } from "reka-ui"
import type { TabsRootEmits, TabsRootProps } from "reka-ui"
import { cn } from "@/lib/utils"

type Props = /* @vue-ignore */ TabsRootProps & {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
const emits = defineEmits</* @vue-ignore */ TabsRootEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TabsRoot
    v-slot="slotProps"
    data-slot="tabs"
    v-bind="forwarded"
    :class="cn('flex flex-col gap-2', props.class)"
  >
    <slot v-bind="slotProps" />
  </TabsRoot>
</template>
