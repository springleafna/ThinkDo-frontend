<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const summary = [
  { label: '笔记总数', value: '2,148' },
  { label: '计划总数', value: '1,032' },
  { label: '每日执行记录', value: '1,286' },
  { label: '便签总数', value: '710' }
]

const moduleRows = [
  {
    module: '笔记',
    tables: 'tb_note / tb_note_category',
    records: '2,148 / 86',
    description: '笔记内容、分类管理、全文搜索、收藏与最近笔记'
  },
  {
    module: '计划',
    tables: 'tb_plan / tb_plan_category',
    records: '1,032 / 38',
    description: '计划、分类、四象限与 AI 创建计划'
  },
  {
    module: '计划步骤',
    tables: 'tb_plan_step',
    records: '2,946',
    description: '按计划拆解步骤并切换完成状态'
  },
  {
    module: '每日清单',
    tables: 'tb_plan_execution',
    records: '1,286',
    description: '按日期管理每日执行清单'
  },
  {
    module: '便签',
    tables: 'tb_memo',
    records: '710',
    description: '轻量记录、置顶切换与最新便签'
  }
]

const recentRows = [
  {
    type: '笔记',
    title: 'RAG 检索优化思路',
    owner: '1024',
    updatedAt: '2026-03-23 09:45',
    status: '已收藏'
  },
  {
    type: '计划',
    title: '三月运营目标拆解',
    owner: '1089',
    updatedAt: '2026-03-23 10:12',
    status: '进行中'
  },
  {
    type: '每日清单',
    title: '今日研发任务清单',
    owner: '1006',
    updatedAt: '2026-03-23 11:05',
    status: '待完成'
  },
  {
    type: '便签',
    title: '模型路由告警记录',
    owner: '1',
    updatedAt: '2026-03-23 13:26',
    status: '置顶'
  }
]

const getStatusClass = (status: string) => {
  if (status === '进行中' || status === '待完成') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === '置顶' || status === '已收藏') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 md:grid-cols-4">
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
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">模块</th>
                <th class="px-4 py-3 font-medium">关联表</th>
                <th class="px-4 py-3 font-medium">记录量</th>
                <th class="px-4 py-3 font-medium">功能说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in moduleRows" :key="row.module" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.module }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.tables }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.records }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">最近内容活动</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          按对象类型查看最近被创建或更新的内容资产记录。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">类型</th>
                <th class="px-4 py-3 font-medium">标题</th>
                <th class="px-4 py-3 font-medium">用户ID</th>
                <th class="px-4 py-3 font-medium">更新时间</th>
                <th class="px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in recentRows" :key="`${row.type}-${row.title}`" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.type }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.title }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.owner }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.updatedAt }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.status)]">
                    {{ row.status }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
