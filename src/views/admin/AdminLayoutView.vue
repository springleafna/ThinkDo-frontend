<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  BookText,
  ClipboardList,
  Database,
  GitBranch,
  LayoutDashboard,
  ListTree,
  MessageSquare,
  NotebookPen,
  StickyNote,
  UsersRound
} from 'lucide-vue-next'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AdminSidebarNav from '@/components/admin/AdminSidebarNav.vue'
import AdminTopbar from '@/components/admin/AdminTopbar.vue'

const route = useRoute()

const navItems = [
  {
    label: '运营总览',
    to: '/admin/overview',
    icon: LayoutDashboard,
    hint: '查看核心模块整体运行情况'
  },
  {
    label: '用户与权限',
    to: '/admin/users',
    icon: UsersRound,
    hint: '管理用户、角色与后台权限'
  },
  {
    label: '会话消息',
    to: '/admin/conversations',
    icon: MessageSquare,
    hint: '查看 AI 对话会话与消息记录'
  },
  {
    label: '知识库与 RAG',
    to: '/admin/knowledge',
    icon: Database,
    hint: '管理知识库、文档分块与意图节点'
  },
  {
    label: '意图管理',
    to: '/admin/intent-tree',
    icon: GitBranch,
    hint: '配置意图层级、类型与节点关系',
    children: [
      { label: '意图树配置', to: '/admin/intent-tree', icon: ListTree, hint: '' },
      { label: '意图列表', to: '/admin/intent-list', icon: ListTree, hint: '' }
    ]
  },
  {
    label: '内容资产',
    to: '/admin/content',
    icon: BookText,
    hint: '查看笔记、计划、清单与便签数据'
  },
  {
    label: '笔记管理',
    to: '/admin/notes',
    icon: StickyNote,
    hint: '管理所有用户的笔记内容'
  },
  {
    label: '计划管理',
    to: '/admin/plans',
    icon: ClipboardList,
    hint: '管理所有用户的计划任务'
  },
  {
    label: '便签管理',
    to: '/admin/memos',
    icon: NotebookPen,
    hint: '管理所有用户的便签'
  }
]

const pageTitle = computed(() => String(route.meta.title ?? '管理员后台'))
const pageSubtitle = computed(() =>
  String(route.meta.subtitle ?? '这里是管理员后台的静态页面演示。')
)
</script>

<template>
  <SidebarProvider>
    <AdminSidebarNav :items="navItems" />

    <SidebarInset>
      <header class="flex h-12 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
      </header>

      <div class="flex flex-1 flex-col gap-4 p-4">
        <AdminTopbar :title="pageTitle" :subtitle="pageSubtitle" />

        <main class="min-h-0 flex-1">
          <RouterView />
        </main>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
