---
name: "api-integration"
description: "根据Java后端Controller接口定义，在src/api下创建对应的前端API文件，并在指定的Vue文件中替换静态数据为从接口获取的数据。"
---

# API 集成技能

本技能用于将Java后端Controller接口转换为前端API调用，并在Vue组件中替换静态数据。

## 何时调用
- 用户提供了Java后端的Controller接口定义
- 需要在 `src/api` 目录下创建新的API文件
- 需要在Vue组件中替换静态数据为API调用数据

## 必须遵循

### API文件规范
- 文件位置：`src/api/` 目录下
- 文件命名：使用小驼峰命名法（如 `userProfile.ts`、`knowledgeDocument.ts`）
- 使用统一的 `request` 工具：`import { request } from '@/utils/request'`
- 导出的API对象使用模块名 + `Api` 后缀（如 `userProfileApi`、`knowledgeDocumentApi`）
- 必须定义TypeScript接口类型（请求参数、响应数据）

### Vue组件集成规范
- 使用 `<script setup lang="ts">` 语法
- 引入API：`import { xxxApi } from '@/api/xxx'`
- 添加加载状态：`const isLoading = ref(false)`
- 使用 `try-catch` 处理错误
- 使用 `vue-sonner` 的 `toast` 进行提示

## API文件模板

```typescript
import { request } from '@/utils/request'

// 请求参数接口
export interface CreateXxxParams {
  name: string
  // ... 其他字段
}

// 响应数据接口
export interface Xxx {
  id: string
  name: string
  // ... 其他字段
}

// 分页查询参数
export interface XxxPageParams {
  current?: number
  size?: number
  keyword?: string
}

// 分页响应
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// XXX相关 API
export const xxxApi = {
  /**
   * 创建XXX
   * POST /xxx
   */
  create(data: CreateXxxParams) {
    return request.post<string>('/xxx', data)
  },

  /**
   * 更新XXX
   * PUT /xxx/{id}
   */
  update(id: string, data: Partial<CreateXxxParams>) {
    return request.put<void>(`/xxx/${id}`, data)
  },

  /**
   * 删除XXX
   * DELETE /xxx/{id}
   */
  delete(id: string) {
    return request.delete<void>(`/xxx/${id}`)
  },

  /**
   * 获取XXX详情
   * GET /xxx/{id}
   */
  getById(id: string) {
    return request.get<Xxx>(`/xxx/${id}`)
  },

  /**
   * 分页查询XXX列表
   * GET /xxx
   */
  getPage(params?: XxxPageParams) {
    return request.get<PageResult<Xxx>>('/xxx', { params })
  },

  /**
   * 获取XXX列表（不分页）
   * GET /xxx/list
   */
  getList(params?: Omit<XxxPageParams, 'current' | 'size'>) {
    return request.get<Xxx[]>('/xxx/list', { params })
  }
}
```

## Vue组件集成示例

### 1. 引入API和类型

```typescript
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { xxxApi, type Xxx } from '@/api/xxx'

// 数据列表
const dataList = ref<Xxx[]>([])

// 加载状态
const isLoading = ref(false)
```

### 2. 创建数据获取方法

```typescript
// 获取数据列表
const fetchData = async () => {
  try {
    isLoading.value = true
    const data = await xxxApi.getList()
    dataList.value = data || []
  } catch (error) {
    console.error('获取数据失败：', error)
    toast.error('获取数据失败')
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchData()
})
```

### 3. 创建操作方法（如创建、更新、删除）

```typescript
// 创建数据
const handleCreate = async (params: CreateXxxParams) => {
  try {
    isLoading.value = true
    await xxxApi.create(params)
    toast.success('创建成功')
    await fetchData() // 重新获取列表
  } catch (error) {
    console.error('创建失败：', error)
    toast.error('创建失败')
  } finally {
    isLoading.value = false
  }
}

// 删除数据
const handleDelete = async (id: string) => {
  try {
    isLoading.value = true
    await xxxApi.delete(id)
    toast.success('删除成功')
    await fetchData() // 重新获取列表
  } catch (error) {
    console.error('删除失败：', error)
    toast.error('删除失败')
  } finally {
    isLoading.value = false
  }
}
```

### 4. 在模板中使用

```vue
<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">加载中...</div>

    <!-- 数据列表 -->
    <div v-else>
      <div v-for="item in dataList" :key="item.id">
        {{ item.name }}
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && dataList.length === 0">
      暂无数据
    </div>
  </div>
</template>
```

## 执行步骤

当用户提供Java Controller接口时，按以下步骤执行：

### 第一步：分析Java接口
- 提取接口路径（如 `/knowledge-base`）
- 提取HTTP方法（GET/POST/PUT/DELETE/PATCH）
- 提取请求参数和响应字段

### 第二步：创建API文件
1. 在 `src/api/` 下创建对应的 `.ts` 文件
2. 定义TypeScript接口类型
3. 实现API方法

### 第三步：修改Vue组件
1. 读取目标Vue文件
2. 找到静态数据定义位置
3. 引入API和类型
4. 添加加载状态
5. 创建数据获取方法
6. 在 `onMounted` 中调用获取方法
7. 替换静态数据为响应式数据

## 参考示例

可参考以下文件了解实际项目的API实现：
- [knowledgeBase.ts](src/api/knowledgeBase.ts) - 知识库API
- [knowledgeDocument.ts](src/api/knowledgeDocument.ts) - 知识库文档API
- [KnowledgeBaseView.vue](src/views/KnowledgeBaseView.vue) - 知识库页面（包含API集成示例）

## 注意事项

1. **类型安全**：必须为所有请求参数和响应数据定义TypeScript接口
2. **错误处理**：所有API调用都需要 `try-catch` 包裹
3. **用户反馈**：使用 `toast` 提供操作反馈
4. **加载状态**：重要操作需要显示加载状态
5. **命名一致性**：API文件名、API对象名、类型名保持语义一致
