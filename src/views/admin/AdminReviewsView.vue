<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const queueSummary = [
  { label: '待初审', value: '48' },
  { label: '待复核', value: '17' },
  { label: '高风险举报', value: '06' },
  { label: '今日完成', value: '32' }
]

const reviewRows = [
  {
    title: '公开笔记含争议内容',
    type: '用户举报',
    level: '高',
    owner: '王敏',
    submitTime: '09:20',
    status: '待处理'
  },
  {
    title: '知识库文档疑似重复营销',
    type: '规则命中',
    level: '中',
    owner: '李越',
    submitTime: '10:45',
    status: '处理中'
  },
  {
    title: 'AI 对话记录人工升级',
    type: '客服转交',
    level: '普通',
    owner: '陈露',
    submitTime: '11:30',
    status: '待确认'
  },
  {
    title: '公开评论集中举报',
    type: '用户举报',
    level: '高',
    owner: '张敏',
    submitTime: '14:10',
    status: '待处理'
  }
]

const rules = [
  '高频举报内容优先进入人工复核。',
  '规则命中后需结合上下文再次确认，避免误伤正常内容。',
  '客服转交内容保留处理记录，便于后续追溯。'
]

const getStatusClass = (status: string) => {
  if (status === '处理中') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === '待确认') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const getLevelClass = (level: string) => {
  if (level === '高') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (level === '中') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 md:grid-cols-4">
      <Card v-for="item in queueSummary" :key="item.label" class="border-slate-200 bg-white shadow-none">
        <CardHeader class="pb-2">
          <CardDescription class="text-sm text-slate-500">{{ item.label }}</CardDescription>
          <CardTitle class="text-2xl font-semibold text-slate-900">{{ item.value }}</CardTitle>
        </CardHeader>
      </Card>
    </section>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle class="text-xl font-semibold text-slate-900">审核任务列表</CardTitle>
            <CardDescription class="mt-2 text-sm leading-6 text-slate-500">
              用表格查看当前审核队列、优先级、处理人和状态。
            </CardDescription>
          </div>
          <div class="flex gap-3">
            <Button variant="outline" class="rounded-md border-slate-200 bg-white">
              批量驳回
            </Button>
            <Button variant="outline" class="rounded-md border-slate-200 bg-white">
              指派审核人
            </Button>
          </div>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row">
          <input class="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600" placeholder="搜索标题、类型或处理人" />
          <select class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>全部风险等级</option>
            <option>高</option>
            <option>中</option>
            <option>普通</option>
          </select>
          <select class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>全部状态</option>
            <option>待处理</option>
            <option>处理中</option>
            <option>待确认</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">标题</th>
                <th class="px-4 py-3 font-medium">来源类型</th>
                <th class="px-4 py-3 font-medium">风险等级</th>
                <th class="px-4 py-3 font-medium">处理人</th>
                <th class="px-4 py-3 font-medium">提交时间</th>
                <th class="px-4 py-3 font-medium">状态</th>
                <th class="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in reviewRows" :key="`${row.title}-${row.submitTime}`" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.title }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.type }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getLevelClass(row.level)]">
                    {{ row.level }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ row.owner }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.submitTime }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.status)]">
                    {{ row.status }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs">
                      查看
                    </Button>
                    <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs">
                      处理
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">审核说明</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          当前页面保留常见规则说明，后续可接敏感词、申诉和操作日志。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul class="space-y-3 text-sm text-slate-600">
          <li v-for="rule in rules" :key="rule" class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            {{ rule }}
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
