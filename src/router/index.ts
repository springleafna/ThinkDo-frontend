import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue')
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayoutView.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          redirect: '/admin/overview'
        },
        {
          path: 'overview',
          name: 'admin-overview',
          component: () => import('@/views/admin/AdminOverviewView.vue'),
          meta: {
            title: '运营总览',
            subtitle: '围绕用户、会话、知识库、笔记与计划等核心模块查看后台整体运行情况。'
          }
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue'),
          meta: {
            title: '用户与权限',
            subtitle: '对应 tb_user、tb_role、tb_user_role，查看账号、角色分配与权限治理。'
          }
        },
        {
          path: 'conversations',
          name: 'admin-conversations',
          component: () => import('@/views/admin/AdminConversationView.vue'),
          meta: {
            title: '会话消息',
            subtitle: '对应 tb_conversation、tb_message，管理聊天会话、消息留存和 AI 对话链路。'
          }
        },
        {
          path: 'knowledge',
          name: 'admin-knowledge',
          component: () => import('@/views/admin/AdminKnowledgeView.vue'),
          meta: {
            title: '知识库与 RAG',
            subtitle: '对应知识库、文档、分块、日志与意图树节点，管理 RAG 检索链路。'
          }
        },
        {
          path: 'content',
          name: 'admin-content',
          component: () => import('@/views/admin/AdminContentView.vue'),
          meta: {
            title: '内容资产',
            subtitle: '对应笔记、分类、计划、步骤、每日清单与便签，查看内容沉淀与执行数据。'
          }
        },
        {
          path: 'system',
          name: 'admin-system',
          component: () => import('@/views/admin/AdminSettingsView.vue'),
          meta: {
            title: '系统策略',
            subtitle: '结合项目能力查看模型路由、RAG 策略、文档处理链路与平台治理配置。'
          }
        },
        {
          path: 'intent-tree',
          name: 'admin-intent-tree',
          component: () => import('@/views/admin/AdminIntentTreeView.vue'),
          meta: {
            title: '意图树配置',
            subtitle: '配置意图层级、类型和节点关系，管理意图树结构。'
          }
        },
        {
          path: 'intent-list',
          name: 'admin-intent-list',
          component: () => import('@/views/admin/AdminIntentListView.vue'),
          meta: {
            title: '意图列表',
            subtitle: '分页查看和快速定位到意图树节点。'
          }
        }
      ]
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/memo',
      name: 'memo',
      component: () => import('@/views/MemoView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('@/views/PlanView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/quadrant',
      name: 'quadrant',
      component: () => import('@/views/QuadrantView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/views/NotesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes/:id',
      name: 'note-detail',
      component: () => import('@/views/NoteDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-chat',
      name: 'ai-chat',
      component: () => import('@/views/AIChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('@/views/DailyTaskView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/knowledge-base',
      name: 'knowledge-base',
      component: () => import('@/views/KnowledgeBaseView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/knowledge-base/:id',
      name: 'knowledge-files',
      component: () => import('@/views/KnowledgeFilesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 管理员页面鉴权
  if (to.meta.requiresAdmin) {
    if (!userStore.isLoggedIn() || !userStore.isAdmin()) {
      next({ name: 'auth', query: { redirect: to.fullPath } })
    } else {
      next()
    }
    return
  }

  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn()) {
      next({ name: 'auth', query: { redirect: to.fullPath } })
    } else {
      next()
    }
    return
  }

  if (to.name === 'auth' && userStore.isLoggedIn()) {
    if (userStore.isAdmin()) {
      next({ name: 'admin-overview' })
    } else {
      next({ name: 'dashboard' })
    }
    return
  }

  next()
})

export default router
