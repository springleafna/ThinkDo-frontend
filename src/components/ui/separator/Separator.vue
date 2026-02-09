<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { SeparatorProps } from '.'
import { separatorVariants } from '.'

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true
})

const separatorClass = computed(() => {
  return cn(separatorVariants({ orientation: props.orientation }), props.class)
})
</script>

<template>
  <div
    :role="!decorative ? 'separator' : undefined"
    :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
    :class="separatorClass"
    :data-orientation="orientation"
  />
</template>
