# Agent 管理 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 为 Agent 补齐数据权限（`created_by` 升级外键 + 查询过滤 + 写入归属）与功能权限（接口挂载 `agent:*` 权限码），使普通用户只能看到/操作自己创建的 Agent。

**架构：** 将 `agents.created_by` 从 `String(100)` 升级为指向 `users.id` 的外键；查询/详情/搜索时按当前用户数据范围追加"创建者=当前用户"过滤（`self` 范围），创建时自动写入创建者；接口按 `agent:view/create/update/delete/publish` 挂载 `require_permission`。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Alembic。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.1.5 挂载矩阵、§5.2.4 过滤与写入规则、§6.2 created_by 迁移）

## 全局约束

- `created_by` 升级为外键指向 `users.id`，旧字符串数据按 `users.username` 回填，无法匹配的置空。
- `self` 范围用户仅见自己创建的 Agent；`all` 范围不过滤；超管不过滤。
- 写入归属：创建时自动写 `created_by = 当前用户 id`。
- 越权访问他人创建的 Agent 详情返回 403（或"资源不存在"语义）。
- 接口权限码：`agent:view` / `agent:create` / `agent:update` / `agent:delete` / `agent:publish`。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/agent/model.py` | `created_by` 改为外键 |
| 新建 | `alembic/versions/xxxx_agent_created_by_fk.py` | 迁移：列类型变更 + 数据回填 |
| 修改 | `src/modules/agent/repository.py` | 查询过滤 + 写入归属 |
| 修改 | `src/modules/agent/service.py` | 数据范围判定与过滤参数透传 |
| 修改 | `src/modules/agent/api.py` | 挂载 `require_permission` + 注入当前用户 |
| Test | `test/test_agent.py` | 数据范围过滤与权限测试 |

## 任务分解

### Task 1: `created_by` 升级为外键

**Files:**
- Modify: `src/modules/agent/model.py`
- Create: `alembic/versions/xxxx_agent_created_by_fk.py`

**Interfaces:**
- Produces: `Agent.created_by: Mapped[int | None]`（`ForeignKey("users.id", ondelete="SET NULL")`）

- [ ] **Step 1: 修改模型**

`created_by` 由 `String(100)` 改为 `BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True`。

- [ ] **Step 2: 生成迁移并补回填**

Run: `alembic revision --autogenerate -m "agent created_by to FK"`
手动补充：按旧字符串匹配 `users.username` 回填新外键，无法匹配置空。

- [ ] **Step 3: 应用迁移**

Run: `alembic upgrade head`
Expected: 迁移成功，无报错

- [ ] **Step 4: 提交**

```bash
git add src/modules/agent/model.py alembic/versions/xxxx_agent_created_by_fk.py
git commit -m "feat: agent.created_by 升级为外键"
```

### Task 2: 查询过滤与写入归属

**Files:**
- Modify: `src/modules/agent/repository.py`
- Modify: `src/modules/agent/service.py`

**Interfaces:**
- Consumes: `get_current_user`（含 `is_superuser`、`roles[*].data_scope`）
- Produces: 列表/搜索/详情查询接受可选 `owner_id` 过滤；创建时写 `created_by`

- [ ] **Step 1: 编写失败测试**

```python
@pytest.mark.asyncio
async def test_self_scope_filters_agents_by_owner(db_session):
    # 准备两个用户各自一个 agent，data_scope=self 的用户只能查到自己的
    ...
    assert len(own_agents) == 1
    assert own_agents[0].created_by == user_self.id

@pytest.mark.asyncio
async def test_all_scope_sees_all_agents(db_session):
    ...
    assert len(all_agents) == 2
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_agent.py -v`
Expected: FAIL

- [ ] **Step 3: 实现数据范围过滤**

在 repository/service 层增加 `owner_id` 过滤参数：`self` 范围时传当前用户 id，`all` 范围传 `None`（不过滤）。创建时写 `created_by`。

- [ ] **Step 4: 运行测试确认通过**

Run: `pytest test/test_agent.py -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/modules/agent/repository.py src/modules/agent/service.py test/test_agent.py
git commit -m "feat: agent 数据范围过滤与写入归属"
```

### Task 3: 接口挂载功能权限 + 注入当前用户

**Files:**
- Modify: `src/modules/agent/api.py`

**Interfaces:**
- Consumes: `require_permission`、`get_current_user`
- Produces: 各路由挂载对应 `agent:*` 权限码，并注入 `current_user` 供过滤

- [ ] **Step 1: 按矩阵挂载权限码**

`GET` → `require_permission("agent:view")`；`POST` → `agent:create`；`PUT` → `agent:update`；`DELETE` → `agent:delete`；发布/版本接口 → `agent:publish`。路由注入 `current_user: User = Depends(get_current_user)` 传给 service 做数据范围过滤。

- [ ] **Step 2: 越权详情返回 403**

详情查询到他人创建的 Agent 且当前用户为 `self` 范围时，返回 403。

- [ ] **Step 3: 提交**

```bash
git add src/modules/agent/api.py
git commit -m "feat: agent 接口挂载功能权限与数据范围"
```

## 评审要点（Review Focus）

1. **旧数据回填**：`created_by` 字符串无法匹配用户时置空，置空资源仅 `all` 范围可见——Task 1 迁移覆盖。
2. **越权详情访问**：`self` 用户访问他人 Agent 详情返回 403，不泄露存在性——Task 3 测试覆盖。
3. **超管不过滤**：`is_superuser` 或 `data_scope=all` 角色看到全部 Agent——Task 2 测试覆盖。
4. **写入归属正确**：创建 Agent 后 `created_by` 为当前用户 id——Task 2 测试覆盖。

## 验收标准

- [ ] `self` 用户查询 Agent 列表仅见自己创建的数据。
- [ ] `self` 用户访问他人 Agent 详情返回 403。
- [ ] `all` 角色（非超管）查询返回全部数据。
- [ ] 无对应权限码的用户访问对应接口返回 403。
