---
name: "vue-shadcn-standards"
description: "在创建任何Vue页面或组件时：使用@/components/ui下的shadcn-vue组件，样式用Tailwind CSS，图标用Lucide；当新增页面/组件或改造UI时调用。"
---

# Vue 页面/组件 UI 规范（shadcn-vue + Tailwind + Lucide）

本技能用于在新建或改造 Vue 页面/组件时，统一使用已安装的 shadcn-vue 组件、Tailwind CSS 实用类，以及 Lucide 图标库，确保风格一致、开发高效。

## 何时调用
- 新建任何 Vue 页面或组件
- 为现有页面添加新 UI 元素（表单、对话框、列表、标签等）
- 将原生元素替换为规范化 UI 组件

## 必须遵循
- 组件来源：从 `@/components/ui/` 导入 shadcn-vue 组件
- 样式规范：使用 Tailwind CSS 实用类，结合 `cn` 工具合并类名（位于 `@/lib/utils`）
- 图标规范：从 `lucide-vue-next` 按需导入图标
- 统一使用 `<script setup lang="ts">` 与组合式 API

## 常用导入示例

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-vue-next'
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center gap-2">
      <Button class="gap-2">
        <Plus class="size-4" />
        新建
      </Button>
      <Input placeholder="搜索" class="w-64" />
    </div>

    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>示例对话框</DialogTitle>
        </DialogHeader>
        <div class="text-sm text-muted-foreground">内容区域</div>
      </DialogContent>
    </Dialog>
  </div>
</template>
```

## 目录与别名
- UI 组件目录：`@/components/ui`
- 图标库：`lucide-vue-next`
- 实用函数：`@/lib/utils`（包含 `cn`）

## 组件选型建议
- 按钮、输入、选择器、对话框、标签、卡片等，优先使用 `@/components/ui/` 下对应组件
- 消息提示使用 `vue-sonner`（已集成）
- 列表与布局优先通过 Tailwind 工具类实现

## 审核要点
- 是否所有新 UI 都来自 `@/components/ui/`
- 是否仅使用 Tailwind 工具类完成样式
- 是否使用 Lucide 图标并按需导入
- 是否保持一致的命名与结构