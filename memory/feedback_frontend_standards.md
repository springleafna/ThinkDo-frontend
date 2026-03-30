---
name: frontend_standards
description: 前端代码规范与技术标准
type: feedback
---

## 前端开发技术标准

### UI 组件

- 使用 shadcn-vue 组件库（基于 reka-ui），组件位于 `src/components/ui/`
- 样式使用 Tailwind CSS，优先使用 Slate 色系
- 图标统一使用 Lucide Vue Next

### 样式规范

- 颜色：`bg-slate-50`、`text-slate-700`、`border-slate-200`
- 圆角：`rounded-md`
- 按钮高度：`h-9`（小按钮）或默认
- 输入框高度：`h-9`

### API 对接

- API 文件与后端 Controller 一一对应，存放在 `src/api/` 目录
- 定义 TypeScript 接口描述请求参数和响应数据
- 使用 `src/utils/request.ts` 封装的 Axios 实例发起请求
- 响应格式：`{ code: number, data: T, message: string, success: boolean }`

### 组件规范

- 使用 `<script setup>` 语法
- 组件文件命名：大驼峰（PascalCase）
- Props 和 Emits 使用 TypeScript 类型定义

### Why: 保持代码一致性

项目使用统一的技术栈和代码风格，确保代码可维护性、可读性和团队协作效率。

### How to apply:

创建新页面或组件时：
1. 从 `src/components/ui/` 导入 shadcn-vue 组件
2. 使用 Tailwind CSS 编写样式
3. 从 `lucide-vue-next` 导入图标
4. API 调用使用 `request` 工具并定义类型
5. 参考现有页面的结构和风格
