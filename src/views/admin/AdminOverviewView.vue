<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import AdminMetricCard from '@/components/admin/AdminMetricCard.vue'
import {
  BookText,
  Database,
  ListChecks,
  MessageSquare,
  Users
} from 'lucide-vue-next'

const metrics = [
  {
    title: '用户总数',
    value: '3,286',
    description: '对应 tb_user，包含普通用户与管理员账号。',
    trend: '管理员角色账号 12 个',
    icon: Users,
    iconClass: 'bg-slate-100 text-slate-700'
  },
  {
    title: '活跃会话',
    value: '1,024',
    description: '对应 tb_conversation、tb_message 的近期会话活跃量。',
    trend: '今日新增消息 8,412 条',
    icon: MessageSquare,
    iconClass: 'bg-slate-100 text-slate-700'
  },
  {
    title: '知识库文档',
    value: '268',
    description: '对应知识库与文档管理链路中的文档总量。',
    trend: '分块总数 18,420 条',
    icon: Database,
    iconClass: 'bg-slate-100 text-slate-700'
  },
  {
    title: '内容与计划',
    value: '5,176',
    description: '覆盖笔记、计划、步骤、每日清单与便签。',
    trend: '今日新增 146 条内容记录',
    icon: BookText,
    iconClass: 'bg-slate-100 text-slate-700'
  }
]

const moduleRows = [
  {
    module: '系统模块',
    tables: 'tb_user / tb_role / tb_user_role',
    ability: '注册登录、角色分配、账号治理',
    status: '稳定'
  },
  {
    module: 'AI 对话',
    tables: 'tb_conversation / tb_message',
    ability: '流式聊天、会话管理、历史消息',
    status: '稳定'
  },
  {
    module: '知识库与 RAG',
    tables: 'tb_knowledge_base / tb_knowledge_document / tb_knowledge_chunk / tb_intent_node',
    ability: '知识库、文档分块、检索增强问答',
    status: '关注'
  },
  {
    module: '笔记模块',
    tables: 'tb_note / tb_note_category',
    ability: '笔记管理、分类检索、AI 文本增强',
    status: '稳定'
  },
  {
    module: '计划模块',
    tables: 'tb_plan / tb_plan_step / tb_plan_execution / tb_memo',
    ability: '计划、步骤、每日清单与便签',
    status: '稳定'
  }
]

const riskRows = [
  {
    item: '知识库文档切块失败重试',
    source: 'tb_knowledge_document_chunk_log',
    owner: '知识库模块',
    level: '中'
  },
  {
    item: '高频消息会话占比上升',
    source: 'tb_message',
    owner: 'AI 对话模块',
    level: '中'
  },
  {
    item: '管理员权限分配待复核',
    source: 'tb_user_role',
    owner: '系统模块',
    level: '低'
  },
  {
    item: '计划执行数据需补充归档策略',
    source: 'tb_plan_execution',
    owner: '计划模块',
    level: '低'
  }
]

const trends = [
  { name: '用户注册', value: '86', compare: '较昨日 +12%' },
  { name: '新建会话', value: '214', compare: '较昨日 +8%' },
  { name: '文档上传', value: '37', compare: '较昨日 -5%' },
  { name: '新增笔记/计划', value: '146', compare: '较昨日 +19%' }
]

const getStatusClass = (status: string) => {
  if (status === '关注') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const getLevelClass = (level: string) => {
  if (level === '中') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 xl:grid-cols-4">
      <AdminMetricCard
        v-for="metric in metrics"
        :key="metric.title"
        :title="metric.title"
        :value="metric.value"
        :description="metric.description"
        :trend="metric.trend"
        :icon="metric.icon"
        :icon-class="metric.iconClass"
      />
    </section>

    <section class="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">模块运行概览</CardTitle>
          <CardDescription class="text-sm text-slate-500">
            结合表结构与业务模块，查看当前后台重点模块、主表与功能覆盖情况。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">模块</th>
                  <th class="px-4 py-3 font-medium">核心表</th>
                  <th class="px-4 py-3 font-medium">能力说明</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in moduleRows" :key="row.module" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ row.module }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.tables }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.ability }}</td>
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
          <CardTitle class="text-xl font-semibold text-slate-900">今日变化</CardTitle>
          <CardDescription class="text-sm text-slate-500">
            从注册、会话、知识库和内容资产四个维度观察当日增量。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="item in trends" :key="item.name" class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-slate-900">{{ item.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ item.compare }}</p>
              </div>
              <div class="text-lg font-semibold text-slate-900">{{ item.value }}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1fr,1fr]">
      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">待关注事项</CardTitle>
          <CardDescription class="text-sm text-slate-500">
            结合各业务表的处理链路，整理当前需要管理员跟进的问题。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[700px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">事项</th>
                  <th class="px-4 py-3 font-medium">来源表</th>
                  <th class="px-4 py-3 font-medium">所属模块</th>
                  <th class="px-4 py-3 font-medium">等级</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in riskRows" :key="row.item" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ row.item }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.source }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.owner }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getLevelClass(row.level)]">
                      {{ row.level }}
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
          <CardTitle class="text-xl font-semibold text-slate-900">核心链路覆盖</CardTitle>
          <CardDescription class="text-sm text-slate-500">
            当前项目管理员后台已经围绕主要业务链路做了对应页面设计。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 text-sm text-slate-600">
          <div class="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <MessageSquare class="mt-0.5 size-4 text-slate-400" />
            <div>
              <p class="font-medium text-slate-900">AI 对话链路</p>
              <p class="mt-1">覆盖会话列表、消息记录、会话活跃度与会话删除留存场景。</p>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <Database class="mt-0.5 size-4 text-slate-400" />
            <div>
              <p class="font-medium text-slate-900">知识库与 RAG 链路</p>
              <p class="mt-1">覆盖知识库、文档、分块日志、Chunk 启用状态与意图树节点配置。</p>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <BookText class="mt-0.5 size-4 text-slate-400" />
            <div>
              <p class="font-medium text-slate-900">内容沉淀链路</p>
              <p class="mt-1">覆盖笔记、分类、计划、步骤、每日执行与便签沉淀数据。</p>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <ListChecks class="mt-0.5 size-4 text-slate-400" />
            <div>
              <p class="font-medium text-slate-900">平台治理链路</p>
              <p class="mt-1">覆盖角色权限、鉴权、模型路由、故障切换和平台策略配置。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
