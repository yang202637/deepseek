# 工具管理 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 为工具补齐数据权限（`created_by` 升级外键 + 查询过滤 + 写入归属）与功能权限（接口挂载 `tool:*` 权限码）。

**架构：** 将 `tools.created_by` 升级为外键；查询按当前用户数据范围过滤，创建自动写归属；接口按 `tool:view/create/update/delete/test` 挂载 `require_permission`。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Alembic。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.1.5 挂载矩阵、§5.2.4 过滤与写入规则、§6.2 created_by 迁移）

## 全局约束

- `created_by` 升级为外键指向 `users.id`；旧数据按 `users.username` 回填，无法匹配置空。
- `self` 范围仅见自己创建的工具；`all` 范围不过滤。
- 接口权限码：`tool:view` / `tool:create` / `tool:update` / `tool:delete` / `tool:test`。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/tool/model.py` | `created_by` 改为外键 |
| 新建 | `alembic/versions/xxxx_tool_created_by_fk.py` | 迁移 |
| 修改 | `src/modules/tool/repository.py` | 查询过滤 + 写入归属 |
| 修改 | `src/modules/tool/service.py` | 数据范围透传 |
| 修改 | `src/modules/tool/api.py` | 挂载权限码 + 注入当前用户 |
| Test | `test/test_tool.py` | 数据范围测试 |

## 任务分解

### Task 1: `created_by` 升级外键 + 迁移

- [ ] 修改 `Tool.created_by` 为 `BigInteger, ForeignKey("users.id", ondelete="SET NULL")`
- [ ] 生成迁移并补回填逻辑
- [ ] `alembic upgrade head`
- [ ] 提交

### Task 2: 数据范围过滤与写入归属

- [ ] 编写失败测试：`self` 仅见自己工具，`all` 见全部
- [ ] 实现 `owner_id` 过滤 + 创建写 `created_by`
- [ ] 运行确认通过
- [ ] 提交

### Task 3: 接口挂载功能权限

- [ ] `GET` → `tool:view`；`POST` → `tool:create`；`PUT` → `tool:update`；`DELETE` → `tool:delete`；测试接口 → `tool:test`
- [ ] 注入 `current_user` 供过滤；越权详情返回 403
- [ ] 提交

## 评审要点（Review Focus）

1. 越权详情 403 不泄露存在性——Task 3 覆盖。
2. 超管/`all` 范围不过滤——Task 2 覆盖。
3. 工具测试接口应走 `tool:test` 权限，而非 `tool:update`——Task 3 覆盖。

## 验收标准

- [ ] `self` 用户仅见自己创建的工具。
- [ ] 无对应权限码访问返回 403。
