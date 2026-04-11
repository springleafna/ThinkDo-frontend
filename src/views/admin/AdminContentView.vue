<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { adminNoteApi, adminPlanApi, adminMemoApi } from '@/api/admin'

const loading = ref(false)
const noteTotal = ref(0)
const planTotal = ref(0)
const memoTotal = ref(0)

const summary = ref([
  { label: '笔记总数', value: '-' },
  { label: '计划总数', value: '-' },
  { label: '便签总数', value: '-' }
])

const moduleRows = [
  {
    module: '笔记',
    tables: 'tb_note / tb_note_category',
    description: '笔记内容、分类管理、全文搜索、收藏与最近笔记'
  },
  {
    module: '计划',
    tables: 'tb_plan / tb_plan_category',
    description: '计划、分类、四象限与 AI 创建计划'
  },
  {
    module: '计划步骤',
    tables: 'tb_plan_step',
    description: '按计划拆解步骤并切换完成状态'
  },
  {
    module: '每日清单',
    tables: 'tb_plan_execution',
    description: '按日期管理每日执行清单'
  },
  {
    module: '便签',
    tables: 'tb_memo',
    description: '轻量记录、置顶切换与最新便签'
  }
]

const fetchData = async () => {
  loading.value = true
  try {
    const [noteRes, planRes, memoRes] = await Promise.all([
      adminNoteApi.getList({ pageNum: 1, pageSize: 1 }),
      adminPlanApi.getList({ pageNum: 1, pageSize: 1 }),
      adminMemoApi.getList({ pageNum: 1, pageSize: 1 })
    ])
    noteTotal.value = noteRes.total
    planTotal.value = planRes.total
    memoTotal.value = memoRes.total
    summary.value = [
      { label: '笔记总数', value: String(noteTotal.value) },
      { label: '计划总数', value: String(planTotal.value) },
      { label: '便签总数', value: String(memoTotal.value) }
    ]
  } catch {
    // 静默失败，保留占位符
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 md:grid-cols-3">
      <Card v-for="item in summary" :key="item.label" class="border-slate-200 bg-white shadow-none">
        <CardHeader class="pb-2">
          <CardDescription class="text-sm text-slate-500">{{ item.label }}</CardDescription>
          <CardTitle class="text-2xl font-semibold text-slate-900">{{ item.value }}</CardTitle>
        </CardHeader>
      </Card>
    </section>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">内容模块概览</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          对应笔记、计划、步骤、执行清单与便签相关表，统一查看内容资产规模与功能覆盖。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[780px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">模块</th>
                <th class="px-4 py-3 font-medium">关联表</th>
                <th class="px-4 py-3 font-medium">功能说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in moduleRows" :key="row.module" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.module }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.tables }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
