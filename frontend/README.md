# 辰光 Agent 平台 — 前端工程化框架

基于 **Vue3 + TypeScript + Pinia + Vue-Router + Vite + Axios** 的前端分层脚手架。

## 分层结构

```
frontend/src/
├── apis/                  # 异步请求层（封装 axios）
│   ├── request.ts         # axios 实例 + 拦截器 + 泛型 http 方法
│   └── modules/user.ts    # 按业务域拆分的接口定义
├── services/              # 业务逻辑层（校验、聚合、转换）
│   └── user.ts            # 用户业务逻辑
├── router/                # 路由层
│   └── index.ts           # 路由 + 全局守卫
├── store/                 # 状态管理层（Pinia）
│   ├── index.ts           # Pinia 实例
│   └── user.ts            # 用户 store
├── pages/                 # 页面组件
│   ├── Login.vue
│   ├── Users.vue
│   └── NotFound.vue
├── components/            # 公共组件
│   ├── BaseButton.vue
│   └── BaseInput.vue
├── mock/                  # mock 数据与拦截
│   └── index.ts
├── types/                 # 全局类型
│   └── index.ts
├── main.ts                # 应用入口
└── App.vue                # 根组件
```

## 数据流

```
pages → store (Pinia) → services (业务逻辑) → apis (axios) → mock/后端
```

## 命令

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器（默认开启 mock）
npm run build      # 构建
npm run type-check # 类型检查
npm run test:run   # 运行测试
```

## 环境变量

- `VITE_API_BASE` — API 前缀（默认 `/api`）
- `VITE_USE_MOCK` — 是否启用 mock（默认 `true`）
