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
  { label: '会话总数', value: '1,024' },
  { label: '今日新增会话', value: '214' },
  { label: '消息总量', value: '28,416' },
  { label: '最近 24h 删除会话', value: '19' }
]

const conversationRows = [
  {
    title: '产品文档问答',
    conversationId: 'conv_kb_20260323_001',
    userId: '1024',
    lastTime: '2026-03-23 09:14',
    mode: 'RAG 问答',
    status: '正常'
  },
  {
    title: '周计划拆解',
    conversationId: 'conv_ai_20260323_018',
    userId: '1089',
    lastTime: '2026-03-23 10:32',
    mode: '普通聊天',
    status: '正常'
  },
  {
    title: '知识库命中文档复核',
    conversationId: 'conv_kb_20260323_026',
    userId: '1006',
    lastTime: '2026-03-23 11:08',
    mode: 'RAG 问答',
    status: '关注'
  },
  {
    title: '笔记润色测试',
    conversationId: 'conv_ai_20260323_044',
    userId: '1120',
    lastTime: '2026-03-23 13:45',
    mode: '普通聊天',
    status: '正常'
  }
]

const messageRows = [
  {
    role: 'user',
    conversationId: 'conv_kb_20260323_001',
    userId: '1024',
    createdAt: '2026-03-23 09:14:10',
    summary: '询问知识库中文档检索结果来源'
  },
  {
    role: 'assistant',
    conversationId: 'conv_kb_20260323_001',
    userId: '1024',
    createdAt: '2026-03-23 09:14:13',
    summary: '返回引用文档片段与回答内容'
  },
  {
    role: 'user',
    conversationId: 'conv_ai_20260323_018',
    userId: '1089',
    createdAt: '2026-03-23 10:32:48',
    summary: '请求生成周计划的执行步骤'
  },
  {
    role: 'assistant',
    conversationId: 'conv_ai_20260323_018',
    userId: '1089',
    createdAt: '2026-03-23 10:32:51',
    summary: '按目标、步骤、每日执行拆分计划'
  }
]

const getStatusClass = (status: string) => {
  if (status === '关注') return 'border-amber-200 bg-amber-50 text-amber-700'
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
        <CardTitle class="text-xl font-semibold text-slate-900">会话列表</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          对应 tb_conversation，查看会话编号、所属用户、最近消息时间与对话模式。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">会话标题</th>
                <th class="px-4 py-3 font-medium">会话ID</th>
                <th class="px-4 py-3 font-medium">用户ID</th>
                <th class="px-4 py-3 font-medium">最近消息时间</th>
                <th class="px-4 py-3 font-medium">模式</th>
                <th class="px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in conversationRows" :key="row.conversationId" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.title }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.conversationId }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.userId }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.lastTime }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.mode }}</td>
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

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">消息留存记录</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          对应 tb_message，按角色和创建时间查看消息记录留存样例。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">角色</th>
                <th class="px-4 py-3 font-medium">会话ID</th>
                <th class="px-4 py-3 font-medium">用户ID</th>
                <th class="px-4 py-3 font-medium">创建时间</th>
                <th class="px-4 py-3 font-medium">内容摘要</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in messageRows" :key="`${row.conversationId}-${row.createdAt}`" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.role }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.conversationId }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.userId }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.createdAt }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.summary }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
