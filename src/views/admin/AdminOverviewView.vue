<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminMetricCard from '@/components/admin/AdminMetricCard.vue'
import {
  BookText,
  Database,
  ListChecks,
  MessageSquare,
  Users
} from 'lucide-vue-next'
import { adminDashboardApi, type AdminDashboardTrend } from '@/api/admin'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const loading = ref(false)

// 统计数据
const stats = ref({
  userTotal: 0,
  conversationTotal: 0,
  documentTotal: 0,
  noteTotal: 0,
  planTotal: 0,
  memoTotal: 0
})

// 今日趋势数据
const trend = ref({
  userRegisterCount: 0,
  userRegisterCompare: '',
  conversationCreateCount: 0,
  conversationCreateCompare: '',
  documentUploadCount: 0,
  documentUploadCompare: '',
  contentCreateCount: 0,
  contentCreateCompare: ''
})

// 指标卡片配置
const metrics = [
  {
    title: '用户总数',
    value: ref('0'),
    description: '包含普通用户与管理员账号。',
    icon: Users,
    iconClass: 'bg-slate-100 text-slate-700',
    field: 'userTotal' as const
  },
  {
    title: '活跃会话',
    value: ref('0'),
    description: '近期会话活跃量。',
    icon: MessageSquare,
    iconClass: 'bg-slate-100 text-slate-700',
    field: 'conversationTotal' as const
  },
  {
    title: '知识库文档',
    value: ref('0'),
    description: '对应知识库中的文档总量。',
    icon: Database,
    iconClass: 'bg-slate-100 text-slate-700',
    field: 'documentTotal' as const
  },
  {
    title: '内容与计划',
    value: ref('0'),
    description: '覆盖笔记、计划、步骤、每日清单与便签。',
    icon: BookText,
    iconClass: 'bg-slate-100 text-slate-700',
    field: 'contentTotal' as const
  }
]

// 今日变化项配置
const trendItems = [
  {
    name: '用户注册',
    value: ref(0),
    compare: ref(''),
    field: 'userRegister' as const
  },
  {
    name: '新建会话',
    value: ref(0),
    compare: ref(''),
    field: 'conversationCreate' as const
  },
  {
    name: '文档上传',
    value: ref(0),
    compare: ref(''),
    field: 'documentUpload' as const
  },
  {
    name: '新增笔记/计划',
    value: ref(0),
    compare: ref(''),
    field: 'contentCreate' as const
  }
]

// 获取统计数据
const fetchStats = async () => {
  loading.value = true
  try {
    const [statsRes, trendRes] = await Promise.all([
      adminDashboardApi.getStats(),
      adminDashboardApi.getTrend()
    ])

    stats.value = statsRes
    trend.value = trendRes

    // 更新指标卡片数据
    metrics.forEach(m => {
      if (m.field === 'contentTotal') {
        m.value.value = String(statsRes.noteTotal + statsRes.planTotal + statsRes.memoTotal)
      } else {
        m.value.value = String(statsRes[m.field])
      }
    })

    // 更新今日变化数据
    trendItems.forEach(item => {
      const key = item.field as 'userRegister' | 'conversationCreate' | 'documentUpload' | 'contentCreate'
      item.value.value = Number(trendRes[`${key}Count` as keyof AdminDashboardTrend])
      item.compare.value = '较昨日 ' + String(trendRes[`${key}Compare` as keyof AdminDashboardTrend])
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 xl:grid-cols-4">
      <AdminMetricCard
        v-for="metric in metrics"
        :key="metric.title"
        :title="metric.title"
        :value="loading ? '加载中...' : metric.value.value"
        :description="metric.description"
        :icon="metric.icon"
        :icon-class="metric.iconClass"
      />
    </section>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">今日变化</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-if="loading" class="text-center py-8 text-sm text-slate-500">
          正在加载今日变化数据...
        </div>
        <template v-else>
          <div v-for="item in trendItems" :key="item.name" class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-slate-900">{{ item.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ item.compare.value }}</p>
              </div>
              <div class="text-lg font-semibold text-slate-900">{{ item.value.value }}</div>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
