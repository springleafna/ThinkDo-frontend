<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  knowledgeBaseApi,
  type KnowledgeBase
} from '@/api/knowledgeBase'
import {
  knowledgeDocumentApi,
  type KnowledgeDocument
} from '@/api/knowledgeDocument'
import { RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// ============ 知识库列表 ============
const kbLoading = ref(false)
const kbRows = ref<KnowledgeBase[]>([])

const fetchKnowledgeBases = async () => {
  kbLoading.value = true
  try {
    const res = await knowledgeBaseApi.getPage({ current: 1, size: 100 })
    kbRows.value = res.records
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    toast.error('获取知识库列表失败')
  } finally {
    kbLoading.value = false
  }
}

// ============ 文档列表（遍历知识库获取文档） ============
interface DocRow extends KnowledgeDocument {
  kbName: string
}

const docLoading = ref(false)
const docRows = ref<DocRow[]>([])

const fetchDocuments = async () => {
  docLoading.value = true
  try {
    const kbRes = await knowledgeBaseApi.getPage({ current: 1, size: 100 })
    const allDocs: DocRow[] = []
    const docPromises = kbRes.records.map(async (kb) => {
      try {
        const docRes = await knowledgeDocumentApi.getPage(String(kb.id), { pageNo: 1, pageSize: 100 })
        return docRes.records.map((doc): DocRow => ({
          ...doc,
          kbName: kb.name
        }))
      } catch {
        return [] as DocRow[]
      }
    })
    const results = await Promise.all(docPromises)
    results.forEach(docs => allDocs.push(...docs))
    allDocs.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    docRows.value = allDocs
  } catch (error) {
    console.error('获取文档列表失败:', error)
    toast.error('获取文档列表失败')
  } finally {
    docLoading.value = false
  }
}

// ============ 统计摘要（动态计算） ============
const summary = computed(() => [
  { label: '知识库数量', value: String(kbRows.value.length) },
  { label: '文档总数', value: String(docRows.value.length) },
  { label: 'Chunk 总数', value: docRows.value.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0).toLocaleString() },
  { label: '失败日志', value: String(docRows.value.filter(d => d.status === 'failed').length) }
])

// ============ 初始化 ============
onMounted(async () => {
  await Promise.all([
    fetchKnowledgeBases(),
    fetchDocuments()
  ])
})

const getDocStatusClass = (status: string) => {
  if (status === 'failed') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (status === 'success') {
    return 'border-slate-200 bg-slate-50 text-slate-700'
  }
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

const formatTime = (t: string | undefined) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
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
        <div v-if="kbLoading" class="flex items-center justify-center py-8 text-sm text-slate-400">
          <RefreshCw class="mr-2 size-4 animate-spin" />
          加载中...
        </div>
        <div v-else-if="!kbRows.length" class="flex items-center justify-center py-8 text-sm text-slate-400">
          暂无知识库
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">知识库名称</th>
                <th class="px-4 py-3 font-medium">范围</th>
                <th class="px-4 py-3 font-medium">嵌入模型</th>
                <th class="px-4 py-3 font-medium">Collection</th>
                <th class="px-4 py-3 font-medium">创建人</th>
                <th class="px-4 py-3 font-medium">文档数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in kbRows" :key="row.id" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.scope }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.embeddingModel }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.collectionName ?? '-' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.createdBy }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.documentCount ?? 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">文档处理链路</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          对应 tb_knowledge_document 与 tb_knowledge_document_chunk_log，观察文档导入与分块状态。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="docLoading" class="flex items-center justify-center py-8 text-sm text-slate-400">
          <RefreshCw class="mr-2 size-4 animate-spin" />
          加载中...
        </div>
        <div v-else-if="!docRows.length" class="flex items-center justify-center py-8 text-sm text-slate-400">
          暂无文档
        </div>
        <div v-else class="overflow-x-auto">
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
              <tr v-for="row in docRows" :key="row.id" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.docName }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.kbName }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.fileType }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.chunkCount ?? 0 }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getDocStatusClass(row.status)]">
                    {{ row.status }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ row.sourceType }}</td>
                <td class="px-4 py-3 text-slate-600">{{ formatTime(row.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
