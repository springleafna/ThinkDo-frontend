<script setup lang="ts">
import type { Component } from 'vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  ChevronRight,
  ShieldCheck,
} from 'lucide-vue-next'

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

const openMenus = ref<Set<string>>(new Set())

watch(() => route.path, (path) => {
  for (const item of props.items) {
    if (item.children?.some((child: AdminNavItem) => child.to === path)) {
      openMenus.value.add(item.to)
    }
  }
}, { immediate: true })

const isOpen = (item: AdminNavItem) => openMenus.value.has(item.to)

const toggleOpen = (item: AdminNavItem) => {
  if (!item.children) return
  const s = new Set(openMenus.value)
  if (s.has(item.to)) {
    s.delete(item.to)
  } else {
    s.add(item.to)
  }
  openMenus.value = s
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" class="hover:bg-sidebar-accent">
            <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">管理后台</span>
              <span class="truncate text-xs text-muted-foreground">ThinkDo 内部系统</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarSeparator />

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <template v-for="item in items" :key="item.to">
              <!-- Item with children -->
              <SidebarMenuItem v-if="item.children?.length">
                <SidebarMenuButton
                  :isActive="isActive(item)"
                  :tooltip="item.label"
                  @click="toggleOpen(item)"
                >
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                  <ChevronRight
                    class="ml-auto transition-transform duration-200"
                    :class="{ 'rotate-90': isOpen(item) }"
                  />
                </SidebarMenuButton>

                <SidebarMenuSub v-show="isOpen(item)">
                  <SidebarMenuSubItem
                    v-for="child in item.children"
                    :key="child.to"
                  >
                    <SidebarMenuSubButton
                      asChild
                      :isActive="route.path === child.to"
                    >
                      <RouterLink :to="child.to">
                        <span>{{ child.label }}</span>
                      </RouterLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              <!-- Single item -->
              <SidebarMenuItem v-else>
                <SidebarMenuButton
                  asChild
                  :isActive="isActive(item)"
                >
                  <RouterLink :to="item.to">
                    <component :is="item.icon" />
                    <span>{{ item.label }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </template>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarRail />
  </Sidebar>
</template>
