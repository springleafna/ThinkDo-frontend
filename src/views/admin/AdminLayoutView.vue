<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  BookText,
  Database,
  GitBranch,
  LayoutDashboard,
  ListTree,
  MessageSquare,
  Settings2,
  UsersRound
} from 'lucide-vue-next'
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
    label: '系统策略',
    to: '/admin/system',
    icon: Settings2,
    hint: '配置模型路由、RAG 与平台治理策略'
  }
]

const pageTitle = computed(() => String(route.meta.title ?? '管理员后台'))
const pageSubtitle = computed(() =>
  String(route.meta.subtitle ?? '这里是管理员后台的静态页面演示。')
)
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-950">
    <div class="mx-auto flex min-h-screen max-w-[1480px] gap-4 p-4">
      <AdminSidebarNav :items="navItems" />

      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <div class="flex items-center gap-2 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 xl:hidden">
          <Activity class="size-4 text-slate-400" />
          管理员导航已折叠，当前页面可继续预览静态内容。
        </div>

        <AdminTopbar :title="pageTitle" :subtitle="pageSubtitle" />

        <main class="min-h-0 flex-1">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
