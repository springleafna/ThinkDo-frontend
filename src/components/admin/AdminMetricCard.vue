<script setup lang="ts">
import type { Component } from 'vue'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

defineProps<{
  title: string
  value: string
  description: string
  icon: Component
  iconClass?: string
}>()
</script>

<template>
  <Card class="border-slate-200 bg-white shadow-none">
    <CardHeader class="flex flex-row items-start justify-between space-y-0 pb-2">
      <div class="space-y-1">
        <CardDescription class="text-sm text-slate-500">
          {{ title }}
        </CardDescription>
        <CardTitle class="text-3xl font-semibold text-slate-900">
          {{ value }}
        </CardTitle>
      </div>
      <div :class="['flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-700', iconClass]">
        <component :is="icon" class="size-5" />
      </div>
    </CardHeader>
    <CardContent class="space-y-2">
      <p class="text-sm leading-6 text-slate-500">
        {{ description }}
      </p>
    </CardContent>
  </Card>
</template>
