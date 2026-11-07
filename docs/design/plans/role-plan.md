# 角色管理 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 为角色增加 `data_scope` 数据范围字段（两档 `all`/`self`），并将角色/权限管理接口整体挂载超管专属授权，使数据范围"挂在角色上"。

**架构：** 在 `roles` 表新增 `data_scope` 字段（`String(20)`，默认 `self`，非空），通过 Alembic 迁移落库；超管角色锁定为 `all` 不可改。角色 CRUD、分配权限等全部接口挂载 `require_superuser`。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Alembic。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.2 数据权限、§6 数据模型变更、§7 接口变更）

## 全局约束

- `data_scope` 枚举 `all` / `self`，默认 `self`，非空。
- 超管角色锁定 `all`，不可修改。
- 角色管理接口（`/roles/*`）整体挂 `require_superuser`，超管专属。
- 既有角色迁移时 `data_scope` 默认回填 `self`；超管绑定角色回填 `all`。
- 通用响应格式 `{code, message, data}` 不变。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/role/model.py` | `Role` 新增 `data_scope` 字段 |
| 新建 | `alembic/versions/xxxx_add_role_data_scope.py` | 迁移脚本：加字段 + 回填 |
| 修改 | `src/modules/role/schema.py` | `RoleCreate`/`RoleUpdate`/`RoleRead` 增加 `data_scope` |
| 修改 | `src/modules/role/service.py` | 创建/更新时写入 `data_scope`，超管角色保护 |
| 修改 | `src/modules/role/api.py` | 挂载 `require_superuser` |
| Test | `test/test_role.py` | 角色 data_scope 相关测试 |

## 任务分解

### Task 1: `Role` 模型新增 `data_scope` 字段

**Files:**
- Modify: `src/modules/role/model.py`
- Test: `test/test_role.py`

**Interfaces:**
- Produces: `Role.data_scope: Mapped[str]`（`String(20)`，默认 `"self"`，非空）

- [ ] **Step 1: 编写失败测试**

```python
def test_role_data_scope_defaults_to_self():
    role = Role(code="user", name="普通用户")
    assert role.data_scope == "self"

def test_role_data_scope_all():
    role = Role(code="admin", name="超管", data_scope="all")
    assert role.data_scope == "all"
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_role.py -v`
Expected: FAIL（`Role` 无 `data_scope` 属性）

- [ ] **Step 3: 在 `Role` 模型新增字段**

`data_scope: Mapped[str] = mapped_column(String(20), default="self", comment="数据范围: all/self")`，非空。

- [ ] **Step 4: 运行测试确认通过**

Run: `pytest test/test_role.py -v`
Expected: PASS

- [ ] **Step 5: 生成迁移脚本**

Run: `alembic revision --autogenerate -m "add role data_scope"`
再手动补充回填逻辑（既有角色 `data_scope` 默认 `self`）。提交模型与迁移。

### Task 2: Schema 与 Service 支持 `data_scope`

**Files:**
- Modify: `src/modules/role/schema.py`
- Modify: `src/modules/role/service.py`

**Interfaces:**
- Consumes: `RoleCreate`、`RoleUpdate`、`RoleRead`
- Produces: 三者均含 `data_scope: str`；`service.update_role` 保护超管角色

- [ ] **Step 1: 编写失败测试**

```python
def test_role_create_schema_has_data_scope():
    r = RoleCreate(code="op", name="运营", data_scope="all")
    assert r.data_scope == "all"

def test_role_read_schema_exposes_data_scope():
    r = RoleRead(id=1, code="op", name="运营", data_scope="all")
    assert r.data_scope == "all"
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_role.py -v`
Expected: FAIL（schema 缺少字段）

- [ ] **Step 3: 在三个 schema 增加 `data_scope` 字段**

`RoleCreate.data_scope: str = "self"`；`RoleUpdate.data_scope: str | None = None`；`RoleRead.data_scope: str`。

- [ ] **Step 4: service 写入 data_scope 并保护超管**

`create_role` 写入 `data_scope`；`update_role` 对 `code=="super_admin"` 或 `data_scope` 被锁定的角色拒绝修改 `data_scope`。

- [ ] **Step 5: 通过后提交**

```bash
git add src/modules/role/schema.py src/modules/role/service.py test/test_role.py
git commit -m "feat: 角色支持 data_scope 字段"
```

### Task 3: 角色接口挂载超管授权

**Files:**
- Modify: `src/modules/role/api.py`
- Test: `test/test_role.py`

**Interfaces:**
- Consumes: `require_superuser`（来自 rbac-authorization-plan Task 1）

- [ ] **Step 1: 编写失败测试**

```python
# 验证每个角色路由都注入了 require_superuser 依赖
def test_role_routes_require_superuser():
    from src.modules.role.api import router
    guarded = [r for r in router.routes if getattr(r, "dependant", None)]
    assert len(guarded) >= 6  # search/create/get/list/update/delete/permissions
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_role.py -v`
Expected: FAIL（路由未注入依赖）

- [ ] **Step 3: 在所有角色路由注入 `Depends(require_superuser)`**

每个路由函数增加参数 `current_user: User = Depends(require_superuser)`。

- [ ] **Step 4-5: 通过后提交**

```bash
git add src/modules/role/api.py test/test_role.py
git commit -m "feat: 角色管理接口挂载超管授权"
```

## 评审要点（Review Focus）

1. **超管角色锁定**：对 `super_admin` 角色尝试修改 `data_scope` 或删除应被拒绝——Task 2 测试覆盖。
2. **data_scope 非法值**：写入非 `all`/`self` 的值应被拒绝或忽略——Task 1/2 校验覆盖。
3. **无权限访问角色接口**：非超管调用 `/roles/*` 返回 403——Task 3 测试覆盖。
4. **既有数据迁移**：迁移后既有角色 `data_scope` 非空，超管角色为 `all`——Task 1 迁移覆盖。

## 验收标准

- [ ] `roles` 表有 `data_scope` 字段，默认 `self`，非空。
- [ ] 超管角色 `data_scope=all` 且不可修改/删除。
- [ ] 角色 CRUD 与分配权限接口仅超管可访问。
- [ ] 角色创建/编辑/详情响应均包含 `data_scope`。
