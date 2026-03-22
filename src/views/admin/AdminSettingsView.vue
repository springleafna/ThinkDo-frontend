<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const strategyConfig = ref({
  enableRagRecall: true,
  enableModelFailover: true,
  enableChunkRetry: true,
  enableAIDigest: false,
  defaultTopK: '6',
  currentEmbeddingModel: 'bge-m3'
})

const strategyRows = [
  {
    item: '模型路由与故障切换',
    detail: '支持首包检测、自动降级、熔断恢复',
    related: 'think-do-ai / think-do-framework',
    status: '启用'
  },
  {
    item: 'RAG 检索增强',
    detail: '结合向量检索、意图检索与重排',
    related: 'tb_intent_node / think-do-knowledge',
    status: '启用'
  },
  {
    item: '文档处理链路',
    detail: '上传、提取、分块、向量化入库',
    related: 'tb_knowledge_document / tb_knowledge_chunk',
    status: '启用'
  },
  {
    item: '统一鉴权与会话',
    detail: '基于 Sa-Token 的认证鉴权与会话控制',
    related: 'think-do-system / think-do-framework',
    status: '启用'
  }
]

const governanceRows = [
  { item: '管理员角色复核', owner: '系统模块', cycle: '每周', status: '待执行' },
  { item: '知识库失败文档巡检', owner: '知识库模块', cycle: '每日', status: '执行中' },
  { item: '会话消息留存检查', owner: 'AI 对话模块', cycle: '每日', status: '执行中' },
  { item: '计划执行归档审查', owner: '计划模块', cycle: '每周', status: '待执行' }
]

const getStatusClass = (status: string) => {
  if (status === '执行中') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === '待执行') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <Badge variant="outline" class="w-fit rounded-md border-slate-200 bg-slate-50 text-slate-600">
            平台策略
          </Badge>
          <CardTitle class="pt-3 text-xl font-semibold text-slate-900">
            模型与 RAG 策略
          </CardTitle>
          <CardDescription class="text-sm leading-6 text-slate-500">
            结合项目关键技术能力，统一配置模型路由、RAG 检索和文档处理相关策略。
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <div class="overflow-hidden rounded-md border border-slate-200">
            <div class="grid grid-cols-[1.5fr,1.1fr,120px] items-center border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
              <span>策略项</span>
              <span>说明</span>
              <span>开关</span>
            </div>
            <div class="grid grid-cols-[1.5fr,1.1fr,120px] items-center border-b border-slate-200 px-4 py-4 text-sm">
              <p class="font-medium text-slate-900">启用 RAG 检索</p>
              <p class="text-slate-500">在对话中融合知识库召回结果。</p>
              <div class="flex justify-end"><Switch v-model:model-value="strategyConfig.enableRagRecall" /></div>
            </div>
            <div class="grid grid-cols-[1.5fr,1.1fr,120px] items-center border-b border-slate-200 px-4 py-4 text-sm">
              <p class="font-medium text-slate-900">启用模型故障切换</p>
              <p class="text-slate-500">异常时自动降级与恢复。</p>
              <div class="flex justify-end"><Switch v-model:model-value="strategyConfig.enableModelFailover" /></div>
            </div>
            <div class="grid grid-cols-[1.5fr,1.1fr,120px] items-center border-b border-slate-200 px-4 py-4 text-sm">
              <p class="font-medium text-slate-900">启用文档失败重试</p>
              <p class="text-slate-500">文档切块或向量化失败后重试。</p>
              <div class="flex justify-end"><Switch v-model:model-value="strategyConfig.enableChunkRetry" /></div>
            </div>
            <div class="grid grid-cols-[1.5fr,1.1fr,120px] items-center px-4 py-4 text-sm">
              <p class="font-medium text-slate-900">启用后台日报</p>
              <p class="text-slate-500">按模块汇总运营与异常情况。</p>
              <div class="flex justify-end"><Switch v-model:model-value="strategyConfig.enableAIDigest" /></div>
            </div>
          </div>

          <Separator class="bg-slate-200" />

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">默认 TopK</label>
              <Input v-model="strategyConfig.defaultTopK" class="h-10 border-slate-200 bg-white" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">默认嵌入模型</label>
              <Input v-model="strategyConfig.currentEmbeddingModel" class="h-10 border-slate-200 bg-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">关键能力配置</CardTitle>
          <CardDescription class="text-sm leading-6 text-slate-500">
            对照项目的核心技术能力，查看当前平台治理关注点。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">能力项</th>
                  <th class="px-4 py-3 font-medium">说明</th>
                  <th class="px-4 py-3 font-medium">关联模块</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in strategyRows" :key="row.item" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ row.item }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.detail }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.related }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" class="rounded-md px-2 py-0.5 text-xs border-slate-200 bg-slate-50 text-slate-700">
                      {{ row.status }}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">治理任务排期</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          从系统、知识库、会话和计划模块角度安排固定巡检与治理任务。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[880px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">任务</th>
                <th class="px-4 py-3 font-medium">所属模块</th>
                <th class="px-4 py-3 font-medium">执行周期</th>
                <th class="px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in governanceRows" :key="row.item" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.item }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.owner }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.cycle }}</td>
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
