# 模型与供应商 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 为模型与供应商补齐功能权限（接口挂载 `model:*` / `provider:*` 权限码）。二者为组织级共享资源，不做数据范围隔离（无 `created_by`）。

**架构：** 模型/供应商接口按权限码挂载 `require_permission`，不注入数据范围过滤。模型与供应商是共享基础设施，有 `view` 权限即全员可见。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.1.5 挂载矩阵、§5.2.3 资源边界）

## 全局约束

- 模型/供应商为组织级共享资源，不受数据范围约束（不做 `created_by` 过滤）。
- 接口权限码：`model:view/create/update/delete/test`、`provider:view/create/update/delete/test`。
- 连接测试接口走独立权限码（`model:test` / `provider:test`）。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/model/api.py` | 挂载 `model:*` 权限码 |
| 修改 | `src/modules/provider/api.py` | 挂载 `provider:*` 权限码 |
| Test | `test/test_model.py`、`test/test_provider.py` | 权限测试 |

## 任务分解

### Task 1: 模型接口挂载功能权限

- [ ] `GET` → `model:view`；`POST` → `model:create`；`PUT` → `model:update`；`DELETE` → `model:delete`；连接测试 → `model:test`
- [ ] 编写测试确认路由已注入依赖
- [ ] 提交

### Task 2: 供应商接口挂载功能权限

- [ ] `GET` → `provider:view`；`POST` → `provider:create`；`PUT` → `provider:update`；`DELETE` → `provider:delete`；连接测试 → `provider:test`
- [ ] 编写测试确认路由已注入依赖
- [ ] 提交

## 评审要点（Review Focus）

1. 连接测试权限独立：测试接口走 `*:test` 而非 `*:update`——Task 1/2 覆盖。
2. 共享资源不过滤：有 `view` 权限即全员可见，不做数据范围过滤——架构约束。
3. 供应商与模型权限码不混淆——Task 1/2 各自测试覆盖。

## 验收标准

- [ ] 模型/供应商接口按对应权限码校验，无权限返回 403。
- [ ] 模型/供应商列表不受数据范围影响，有 `view` 权限即全员可见。
