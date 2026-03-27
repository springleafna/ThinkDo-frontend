<script setup lang="ts">
import type { Component } from 'vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-vue-next'

type AdminNavItem = {
  label: string
  to: string
  icon: Component
  hint: string
  children?: AdminNavItem[]
}

const route = useRoute()

const props = defineProps<{
  items: AdminNavItem[]
}>()

const isActive = (item: AdminNavItem) => {
  if (route.path === item.to) return true
  return item.children?.some((child: AdminNavItem) => route.path === child.to) ?? false
}

const expandedItems = ref<Set<string>>(new Set())

// Auto-expand when route matches a child
watch(() => route.path, (path) => {
  for (const item of props.items) {
    if (item.children?.some((child: AdminNavItem) => child.to === path)) {
      expandedItems.value.add(item.to)
    }
  }
}, { immediate: true })

const isExpanded = (item: AdminNavItem) => {
  return item.children ? expandedItems.value.has(item.to) : false
}

const toggleExpand = (item: AdminNavItem) => {
  if (!item.children) return
  const s = new Set(expandedItems.value)
  if (s.has(item.to)) {
    s.delete(item.to)
  } else {
    s.add(item.to)
  }
  expandedItems.value = s
}
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
      <template v-for="item in items" :key="item.to">
        <!-- Parent with children -->
        <div v-if="item.children?.length">
          <button
            :class="[
              'group flex w-full items-start gap-3 rounded-md border px-3 py-3 transition-colors',
              isActive(item)
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
            ]"
            @click="toggleExpand(item)"
          >
            <div
              :class="[
                'mt-0.5 flex size-8 items-center justify-center rounded-md',
                isActive(item) ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
              ]"
            >
              <component :is="item.icon" class="size-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <p class="truncate text-sm font-medium">
                  {{ item.label }}
                </p>
                <component
                  :is="isExpanded(item) ? ChevronDown : ChevronRight"
                  class="size-4 shrink-0 opacity-60"
                />
              </div>
            </div>
          </button>

          <!-- Children -->
          <div v-show="isExpanded(item)" class="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
            <RouterLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              :class="[
                'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                route.path === child.to
                  ? 'bg-slate-100 font-medium text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ]"
            >
              {{ child.label }}
            </RouterLink>
          </div>
        </div>

        <!-- Single item without children -->
        <RouterLink
          v-else
          :to="item.to"
          :class="[
            'group flex items-start gap-3 rounded-md border px-3 py-3 transition-colors',
            isActive(item)
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
          ]"
        >
          <div
            :class="[
              'mt-0.5 flex size-8 items-center justify-center rounded-md',
              isActive(item) ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
            ]"
          >
            <component :is="item.icon" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {{ item.label }}
            </p>
          </div>
        </RouterLink>
      </template>
    </nav>

    <div class="border-t border-slate-200 px-5 py-4 text-xs leading-5 text-slate-500">
      当前页面为静态后台原型，后续可继续接权限、接口和日志能力。
    </div>
  </aside>
</template>
