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
  { label: '知识库数量', value: '12' },
  { label: '文档总数', value: '268' },
  { label: 'Chunk 总数', value: '18,420' },
  { label: '失败日志', value: '7' }
]

const kbRows = [
  {
    name: '产品帮助中心',
    scope: 'SYSTEM',
    embeddingModel: 'bge-m3',
    collection: 'kb_help_center',
    createdBy: '1',
    status: '启用'
  },
  {
    name: '研发规范库',
    scope: 'USER',
    embeddingModel: 'bge-m3',
    collection: 'kb_dev_manual',
    createdBy: '1024',
    status: '启用'
  },
  {
    name: '运营知识库',
    scope: 'USER',
    embeddingModel: 'text-embedding-3-large',
    collection: 'kb_ops_manual',
    createdBy: '1089',
    status: '维护中'
  }
]

const docRows = [
  {
    docName: '新手接入说明.pdf',
    kbName: '产品帮助中心',
    fileType: 'pdf',
    chunkCount: '128',
    status: 'success',
    sourceType: 'file',
    updatedAt: '2026-03-23 09:42'
  },
  {
    docName: '项目规范.md',
    kbName: '研发规范库',
    fileType: 'md',
    chunkCount: '56',
    status: 'success',
    sourceType: 'file',
    updatedAt: '2026-03-23 10:25'
  },
  {
    docName: '推广规则文档',
    kbName: '运营知识库',
    fileType: 'html',
    chunkCount: '0',
    status: 'failed',
    sourceType: 'url',
    updatedAt: '2026-03-23 11:18'
  }
]

const intentRows = [
  {
    code: 'DOMAIN_KNOWLEDGE',
    name: '知识检索问答',
    scope: 'SYSTEM',
    level: '0',
    collection: 'kb_help_center',
    kind: 'RAG',
    enabled: '启用'
  },
  {
    code: 'TOPIC_PLAN',
    name: '计划生成',
    scope: 'SYSTEM',
    level: '2',
    collection: '-',
    kind: 'SYSTEM',
    enabled: '启用'
  },
  {
    code: 'TOPIC_DOC_PARSE',
    name: '文档处理',
    scope: 'SYSTEM',
    level: '2',
    collection: 'kb_dev_manual',
    kind: 'RAG',
    enabled: '停用'
  }
]

const getStatusClass = (status: string) => {
  if (status === '维护中' || status === 'failed' || status === '停用') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
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
        <CardTitle class="text-xl font-semibold text-slate-900">知识库列表</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          对应 tb_knowledge_base，查看知识库范围、嵌入模型、Collection 与创建人信息。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">知识库名称</th>
                <th class="px-4 py-3 font-medium">范围</th>
                <th class="px-4 py-3 font-medium">嵌入模型</th>
                <th class="px-4 py-3 font-medium">Collection</th>
                <th class="px-4 py-3 font-medium">创建人</th>
                <th class="px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in kbRows" :key="row.name" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.scope }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.embeddingModel }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.collection }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.createdBy }}</td>
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

    <section class="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">文档处理链路</CardTitle>
          <CardDescription class="text-sm text-slate-500">
            对应 tb_knowledge_document 与 tb_knowledge_document_chunk_log，观察文档导入与分块状态。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[980px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">文档名称</th>
                  <th class="px-4 py-3 font-medium">所属知识库</th>
                  <th class="px-4 py-3 font-medium">类型</th>
                  <th class="px-4 py-3 font-medium">分块数</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                  <th class="px-4 py-3 font-medium">来源</th>
                  <th class="px-4 py-3 font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in docRows" :key="row.docName" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ row.docName }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.kbName }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.fileType }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.chunkCount }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.status)]">
                      {{ row.status }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ row.sourceType }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.updatedAt }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">意图树节点配置</CardTitle>
          <CardDescription class="text-sm text-slate-500">
            对应 tb_intent_node，查看意图编码、范围、层级、Collection 与启用状态。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[820px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">intent_code</th>
                  <th class="px-4 py-3 font-medium">名称</th>
                  <th class="px-4 py-3 font-medium">范围</th>
                  <th class="px-4 py-3 font-medium">层级</th>
                  <th class="px-4 py-3 font-medium">Collection</th>
                  <th class="px-4 py-3 font-medium">类型</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in intentRows" :key="row.code" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ row.code }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.name }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.scope }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.level }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.collection }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.kind }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.enabled)]">
                      {{ row.enabled }}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>
