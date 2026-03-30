# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供项目指导，所有内容均为中文。

## 项目概述

ThinkDo 前端项目是基于 **Vue 3.5 + TypeScript + Vite** 构建的单页应用，与后端 Spring Boot 项目（端口 8091）配合使用。项目聚焦「AI 对话 + 知识库(RAG) + 笔记 + 计划管理」一体化场景。

**关键特性：**
- 智能对话界面（AIChatView）
- 知识库与文档管理
- 笔记编辑（基于 TipTap 富文本编辑器）
- 计划管理与四象限视图
- 管理员后台（数据总览、用户管理、意图树配置等）

## 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3.5 | Composition API |
| 语言 | TypeScript 5.9 | 类型安全 |
| 构建 | Vite 7.3 | 开发服务器 & 打包 |
| 路由 | Vue Router 4.6 | 页面路由与权限控制 |
| 状态 | Pinia 3.0 | 全局状态管理 |
| UI | shadcn-vue (reka-ui) | 无样式组件库 |
| 样式 | Tailwind CSS 4.1 | 原子化 CSS |
| 图标 | Lucide Vue Next | 统一图标库 |
| 富文本 | TipTap 3.19 | 笔记编辑器 |
| 通知 | vue-sonner | Toast 提示 |
| HTTP | Axios 1.13 | API 请求 |
| 工具库 | @vueuse/core | Vue 组合式工具集 |

## 项目结构

```
src/
├── api/                 # API 接口定义
│   ├── ai.ts           # AI 对话相关
│   ├── intentNode.ts   # 意图节点
│   ├── knowledgeBase.ts # 知识库
│   ├── knowledgeDocument.ts
│   ├── note.ts         # 笔记
│   ├── noteCategory.ts
│   ├── plan.ts         # 计划
│   ├── planStep.ts
│   ├── planExecution.ts
│   ├── planCategory.ts
│   ├── memo.ts         # 便签
│   └── user.ts         # 用户认证
├── components/
│   ├── ui/             # shadcn-vue 组件
│   ├── layout/         # 布局组件（Header/Sidebar）
│   ├── admin/          # 管理后台组件
│   └── TiptapEditor/   # 富文本编辑器组件
├── router/
│   └── index.ts        # 路由配置与权限守卫
├── stores/
│   ├── user.ts         # 用户状态（token/username/role）
│   └── layout.ts       # 布局状态
├── utils/
│   └── request.ts      # Axios 封装
├── views/
│   ├── LandingView.vue        # 落地页
│   ├── AuthView.vue           # 登录/注册
│   ├── DashboardView.vue      # 用户仪表板
│   ├── AIChatView.vue         # AI 对话
│   ├── NotesView.vue          # 笔记列表
│   ├── NoteDetailView.vue     # 笔记详情
│   ├── PlanView.vue           # 计划管理
│   ├── DailyTaskView.vue      # 每日任务
│   ├── QuadrantView.vue       # 四象限
│   ├── MemoView.vue           # 便签
│   ├── KnowledgeBaseView.vue  # 知识库列表
│   ├── KnowledgeFilesView.vue # 知识库文件
│   ├── SettingsView.vue       # 设置
│   └── admin/                 # 管理后台页面
│       ├── AdminLayoutView.vue
│       ├── AdminOverviewView.vue    # 运营总览
│       ├── AdminUsersView.vue       # 用户管理
│       ├── AdminConversationView.vue # 会话消息
│       ├── AdminKnowledgeView.vue   # 知识库与 RAG
│       ├── AdminContentView.vue     # 内容资产
│       ├── AdminSettingsView.vue    # 系统策略
│       ├── AdminIntentTreeView.vue  # 意图树配置
│       └── AdminIntentListView.vue  # 意图列表
├── App.vue
└── main.ts
```

## 构建与运行

```bash
# 安装依赖
npm install

# 开发模式（默认端口 5173）
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

**Node 版本要求：** ^20.19.0 || >=22.12.0

## 环境配置

项目使用环境变量控制 API 地址：

| 文件 | 变量 | 值 |
|------|------|-----|
| `.env.development` | `VITE_API_BASE_URL` | `http://localhost:8091` |
| `.env.production` | `VITE_API_BASE_URL` | `/api`（生产环境通过 Nginx 代理） |

## API 接口规范

### 请求封装

所有 API 请求通过 `src/utils/request.ts` 封装的 Axios 实例发起：

```typescript
import { request } from '@/utils/request'

// GET 请求
request.get<ResponseType>('/url', { params: { key: value } })

// POST 请求
request.post<ResponseType>('/url', { data })

// PUT 请求
request.put<ResponseType>('/url', { data })

// DELETE 请求
request.delete<ResponseType>(`/url/${id}`)

// 文件上传
const formData = new FormData()
formData.append('file', file)
request.upload<ResponseType>('/upload', formData)
```

### 响应格式

后端统一响应格式：

```typescript
interface ApiResponse<T> {
  code: number      // 0 表示成功
  data: T          // 实际数据
  message: string  // 提示信息
  success: boolean // 是否成功
}
```

### 认证机制

- Token 存储在 `localStorage`，字段名为 `token`
- 请求时在请求头中携带 `token` 字段
- 401 响应自动跳转到登录页

### API 文件结构

每个 API 文件应包含：
1. TypeScript 接口定义（请求参数、响应数据）
2. 导出的 API 对象，包含具体接口方法
3. JSDoc 注释说明接口用途和后端端点

示例：

```typescript
// src/api/intentNode.ts
export interface IntentNodeTree {
  id: string
  intentCode: string
  name: string
  // ...
}

export const intentNodeApi = {
  /**
   * 获取整棵意图树
   * GET /intent-tree
   */
  getFullTree() {
    return request.get<IntentNodeTree[]>('/intent-tree')
  }
}
```

## 路由与权限

### 路由守卫

`src/router/index.ts` 实现了三级权限控制：

| Meta 字段 | 说明 | 行为 |
|-----------|------|------|
| `requiresAuth` | 需要登录 | 未登录跳转 `/auth` |
| `requiresAdmin` | 需要管理员权限 | 非管理员跳转 `/auth` |

### 用户角色

用户角色存储在 `localStorage.role`：
- `ADMIN`：管理员，可访问后台 `/admin/*`
- 普通用户：只能访问前端功能页面

### 路由结构

```
/                        # 落地页
/auth                    # 登录/注册
/dashboard               # 用户仪表板（需登录）
/memo                    # 便签
/plan                    # 计划管理
/quadrant                # 四象限
/notes                   # 笔记列表
/notes/:id               # 笔记详情
/ai-chat                 # AI 对话
/daily                   # 每日任务
/knowledge-base          # 知识库列表
/knowledge-base/:id      # 知识库文件
/settings                # 设置
/admin                   # 管理后台（需管理员）
  /overview             # 运营总览
  /users                # 用户管理
  /conversations        # 会话消息
  /knowledge            # 知识库与 RAG
  /content              # 内容资产
  /system               # 系统策略
  /intent-tree          # 意图树配置
  /intent-list          # 意图列表
```

## 组件规范

### shadcn-vue 组件

项目使用 shadcn-vue（基于 reka-ui）的组件库，组件位于 `src/components/ui/`：

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>标题</CardTitle>
    </CardHeader>
    <CardContent>
      <Input placeholder="请输入" />
      <Button>确认</Button>
    </CardContent>
  </Card>
</template>
```

### 样式规范

- 使用 **Tailwind CSS** 进行样式编写
- 颜色使用 Slate 色系：`bg-slate-50`、`text-slate-700`、`border-slate-200`
- 圆角统一使用 `rounded-md`
- 按钮高度 `h-9`（小按钮）或默认高度
- 输入框高度 `h-9`

### 图标规范

使用 **Lucide Vue Next** 图标库：

```vue
<script setup lang="ts">
import { Search, RefreshCw, X, Plus, Edit, Trash } from 'lucide-vue-next'
</script>

<template>
  <Search class="size-4 text-slate-400" />
  <RefreshCw :class="{ 'animate-spin': loading }" />
</template>
```

## 代码约定

### Vue 组件

1. **使用 `<script setup>` 语法**
2. **组件文件命名**：大驼峰（PascalCase），如 `AdminIntentListView.vue`
3. **Props 定义**：使用 TypeScript 接口
4. **Emits 定义**：使用 TypeScript 类型

```vue
<script setup lang="ts">
interface Props {
  title: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
}>()
</script>
```

### 组合式函数

对于可复用的逻辑，提取到 `src/composables/`（如需要）：

```typescript
// src/composables/usePagination.ts
export function usePagination() {
  const current = ref(1)
  const pageSize = ref(10)

  const reset = () => {
    current.value = 1
  }

  return { current, pageSize, reset }
}
```

### 类型定义

- API 相关类型定义在对应的 `src/api/*.ts` 文件中
- 通用类型定义在 `src/types/`（如需要）
- 避免使用 `any`，使用 `unknown` 或具体类型

## 状态管理

### 用户状态（Pinia Store）

`src/stores/user.ts`：

```typescript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 登录
userStore.setToken(token)
userStore.setUsername(username)
userStore.setRole(role)

// 检查登录状态
userStore.isLoggedIn()

// 检查管理员权限
userStore.isAdmin()

// 登出
userStore.logout()
```

## 富文本编辑器（TipTap）

项目使用 TipTap 作为富文本编辑器，组件位于 `src/components/TiptapEditor.vue`。

扩展功能：
- 代码块高亮（`@tiptap/extension-code-block-lowlight`）
- 图片插入（`@tiptap/extension-image`）
- 链接（`@tiptap/extension-link`）
- 占位符（`@tiptap/extension-placeholder`）

## 与后端对接

### 后端项目信息

- **路径**：`D:\javatools\IDEAtool\javaproject\ThinkDo`
- **端口**：8091
- **协议**：HTTP + JSON
- **文档**：参考后端 `CLAUDE.md` 和 `docs/项目介绍.md`

### 主要 API 模块

| 模块 | API 文件 | 后端 Controller |
|------|----------|-----------------|
| AI 对话 | `ai.ts` | ChatController |
| 意图节点 | `intentNode.ts` | IntentNodeController |
| 知识库 | `knowledgeBase.ts` | KnowledgeBaseController |
| 文档 | `knowledgeDocument.ts` | KnowledgeDocumentController |
| 笔记 | `note.ts` | NoteController |
| 计划 | `plan.ts` | PlanController |
| 便签 | `memo.ts` | MemoController |
| 用户 | `user.ts` | UserController |

### 接口对接流程

1. 确认后端 Controller 接口定义
2. 在 `src/api/` 下创建或更新对应的 API 文件
3. 定义 TypeScript 接口（请求参数、响应数据）
4. 在 Vue 组件中导入并调用 API

## 技能（Skills）

项目配置了以下技能，可通过 `/skill-name` 调用：

| 技能 | 说明 |
|------|------|
| `api-integration` | 根据后端 Controller 创建前端 API 文件并替换静态数据 |
| `vue-shadcn-standards` | 创建 Vue 页面时使用 shadcn-vue 组件、Tailwind CSS、Lucide 图标 |

## 开发建议

1. **优先使用项目已有组件**：从 `src/components/ui/` 导入，而非自行实现
2. **保持样式一致性**：参考现有页面的样式风格
3. **类型安全**：充分利用 TypeScript 类型检查
4. **组件拆分**：复杂页面拆分为多个子组件
5. **错误处理**：API 调用时处理错误情况，通过 `toast` 提示用户

## 相关文档

- 后端项目文档：`D:\javatools\IDEAtool\javaproject\ThinkDo\CLAUDE.md`
- 项目介绍：`D:\javatools\IDEAtool\javaproject\ThinkDo\docs\项目介绍.md`
- Tailwind CSS：https://tailwindcss.com/docs
- shadcn-vue：https://www.shadcn-vue.com/docs/installation
- TipTap：https://tiptap.dev/docs
- Lucide：https://lucide.dev/icons/
