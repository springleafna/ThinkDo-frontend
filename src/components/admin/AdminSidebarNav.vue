<script setup lang="ts">
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck } from 'lucide-vue-next'

type AdminNavItem = {
  label: string
  to: string
  icon: Component
  hint: string
}

defineProps<{
  items: AdminNavItem[]
}>()

const route = useRoute()

const isActive = (target: string) => route.path === target
</script>

<template>
  <aside class="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
    <div class="px-5 py-4">
      <div class="flex items-center gap-3">
        <div class="flex size-9 items-center justify-center rounded-md bg-slate-900 text-white">
          <ShieldCheck class="size-5" />
        </div>
        <div>
          <h1 class="text-base font-semibold text-slate-900">管理后台</h1>
          <p class="text-xs text-slate-500">ThinkDo 内部系统</p>
        </div>
      </div>
      <Badge variant="outline" class="mt-4 rounded-md border-slate-200 bg-slate-50 text-slate-600">
        演示环境
      </Badge>
    </div>

    <Separator class="bg-slate-200" />

    <nav class="flex-1 space-y-1 px-3 py-3">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :class="[
          'group flex items-start gap-3 rounded-md border px-3 py-3 transition-colors',
          isActive(item.to)
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
        ]"
      >
        <div
          :class="[
            'mt-0.5 flex size-8 items-center justify-center rounded-md',
            isActive(item.to) ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
          ]"
        >
          <component :is="item.icon" class="size-4" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">
            {{ item.label }}
          </p>
          <p :class="['mt-1 text-xs leading-5', isActive(item.to) ? 'text-slate-300' : 'text-slate-500']">
            {{ item.hint }}
          </p>
        </div>
      </RouterLink>
    </nav>

    <div class="border-t border-slate-200 px-5 py-4 text-xs leading-5 text-slate-500">
      当前页面为静态后台原型，后续可继续接权限、接口和日志能力。
    </div>
  </aside>
</template>
