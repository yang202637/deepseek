# 模块实施计划索引

> 本目录存放基于 `docs/PROJECT_SPEC.md`（V1）与 `docs/spec/PROJECT_SPEC_V2.md`（V2 RBAC 授权）拆分的模块实施计划。
> 每个计划独立产出可测试、可运行的软件单元；但多数模块依赖 RBAC 授权核心，需按依赖顺序实施。

## 计划清单

| 计划文件 | 模块 | 核心内容 |
|----------|------|----------|
| [rbac-authorization-plan.md](rbac-authorization-plan.md) | RBAC 授权核心 | `require_permission`/`require_superuser`、43 权限码 seed、登录/`/me` 返回授权、前端权限上下文 |
| [role-plan.md](role-plan.md) | 角色管理 | `data_scope` 字段 + 迁移 + 超管锁定 + 接口授权 |
| [user-plan.md](user-plan.md) | 用户管理 | `/me` 授权信息 + 超管保护 |
| [permission-plan.md](permission-plan.md) | 权限管理 | 接口超管保护 |
| [agent-plan.md](agent-plan.md) | Agent 管理 | `created_by` 外键 + 数据范围 + `agent:*` 权限 |
| [knowledge-plan.md](knowledge-plan.md) | 知识库管理 | `created_by` 外键 + 数据范围 + `knowledge:*` 权限 |
| [prompt-plan.md](prompt-plan.md) | Prompt 管理 | `created_by` 外键 + 数据范围 + `prompt:*` 权限 |
| [tool-plan.md](tool-plan.md) | 工具管理 | `created_by` 外键 + 数据范围 + `tool:*` 权限 |
| [model-provider-plan.md](model-provider-plan.md) | 模型与供应商 | `model:*` / `provider:*` 权限（共享资源，无数据范围） |

## 依赖关系与实施顺序

```
rbac-authorization-plan (Task 1: require_permission/require_superuser)
        │
        ├──> role-plan ──────────────┐
        ├──> user-plan ──────────────┤（都依赖 require_superuser）
        ├──> permission-plan ────────┘
        │
        └──> agent-plan ─────────────┐
             knowledge-plan ─────────┤（都依赖 require_permission + data_scope 判定）
             prompt-plan ────────────┤
             tool-plan ──────────────┤
             model-provider-plan ────┘
```

**关键依赖：**
1. 所有模块的接口授权都消费 `rbac-authorization-plan` Task 1 产出的 `require_permission` / `require_superuser`。
2. 数据范围判定逻辑（`data_scope` 优先级）在 `rbac-authorization-plan` Task 3 / `user-plan` Task 1 中定义，`agent/knowledge/prompt/tool` 四个模块复用。
3. `role-plan` 的 `data_scope` 字段是数据范围判定（`Role.data_scope`）的数据基础，应在业务模块过滤前完成。

## 建议实施批次

- **第一批（基础）**：rbac-authorization-plan（全部）、role-plan
- **第二批（系统管理授权）**：user-plan、permission-plan
- **第三批（业务数据权限）**：agent-plan、knowledge-plan、prompt-plan、tool-plan、model-provider-plan

每批内部各模块可并行实施（由不同子代理执行），跨批之间存在先后依赖。
