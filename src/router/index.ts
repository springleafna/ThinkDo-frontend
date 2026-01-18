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
    }
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 如果路由需要登录
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn()) {
      // 未登录，跳转到登录页
      next({ name: 'auth', query: { redirect: to.fullPath } })
    } else {
      // 已登录，正常访问
      next()
    }
  } else {
    // 不需要登录的页面
    // 如果已登录且访问登录页，跳转到仪表盘
    if (to.name === 'auth' && userStore.isLoggedIn()) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  }
})

export default router
