# 用户管理 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 将用户管理接口挂载超管专属授权，并提供当前用户授权信息接口（角色、权限码、数据范围），补齐前端权限刷新链路。

**架构：** 用户 CRUD、分配角色等接口整体挂 `require_superuser`；`/users/me` 返回 `UserAuthRead`（含 `is_superuser`、角色、权限码、`data_scope`）。用户数据范围由角色推导（见 rbac-authorization-plan）。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Pydantic v2。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.3.1 权限获取、§7 接口变更）

## 全局约束

- 用户管理接口（`/users/*`）整体挂 `require_superuser`，超管专属。
- `/users/me` 需返回 `is_superuser`、角色、权限码、数据范围（供前端刷新权限）。
- 数据范围判定优先级：`is_superuser` → `all`；任一角色 `data_scope=="all"` → `all`；否则 `self`。
- 通用响应格式不变；403 与 401 区分。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/user/schema.py` | 新增 `UserAuthRead` |
| 修改 | `src/modules/user/api.py` | 挂载 `require_superuser`；`/users/me` 返回授权信息 |
| 修改 | `src/modules/user/service.py` | 提取 `get_user_authorization(user)` 公共逻辑 |
| Test | `test/test_user.py` | 授权信息与超管保护测试 |

## 任务分解

### Task 1: `UserAuthRead` 与授权信息聚合

**Files:**
- Modify: `src/modules/user/schema.py`
- Modify: `src/modules/user/service.py`
- Test: `test/test_user.py`

**Interfaces:**
- Consumes: `User.roles[*].permissions[*].code`、`Role.data_scope`
- Produces:
  - `UserAuthRead(id, username, email, is_active, is_superuser, roles: list[RoleRead], permissions: list[str], data_scope: str)`
  - `def get_user_authorization(user: User) -> dict`（返回权限码列表 + data_scope）

- [ ] **Step 1: 编写失败测试**

```python
def test_get_user_authorization_scope_by_role():
    from src.modules.user.service import get_user_authorization
    perm = Permission(code="agent:view")
    role = Role(data_scope="all", permissions=[perm])
    user = User(is_superuser=False, roles=[role])
    auth = get_user_authorization(user)
    assert auth["data_scope"] == "all"
    assert "agent:view" in auth["permissions"]

def test_get_user_authorization_superuser_priority():
    user = User(is_superuser=True, roles=[Role(data_scope="self")])
    assert get_user_authorization(user)["data_scope"] == "all"
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_user.py -v`
Expected: FAIL（函数未定义）

- [ ] **Step 3: 实现 `get_user_authorization`**

按优先级判定 data_scope；`permissions` 为去重后的权限码列表（超管可返回全部 43 个或特殊标记）。

- [ ] **Step 4: 运行测试确认通过**

Run: `pytest test/test_user.py -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/modules/user/schema.py src/modules/user/service.py test/test_user.py
git commit -m "feat: 新增用户授权信息聚合逻辑"
```

### Task 2: `/users/me` 返回授权信息

**Files:**
- Modify: `src/modules/user/api.py`

**Interfaces:**
- Consumes: `get_user_authorization`、`get_current_user`
- Produces: `GET /users/me -> ResponseSchema[UserAuthRead]`

- [ ] **Step 1: 修改 `/users/me` 返回 `UserAuthRead`**

复用 `get_current_user` 获取用户，调用 `get_user_authorization` 填充权限码与数据范围。

- [ ] **Step 2: 验证响应结构**

Run: `pytest test/test_user.py -v`（扩展断言 `UserAuthRead` 字段）
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/modules/user/api.py test/test_user.py
git commit -m "feat: /users/me 返回当前用户授权信息"
```

### Task 3: 用户管理接口挂载超管授权

**Files:**
- Modify: `src/modules/user/api.py`
- Test: `test/test_user.py`

**Interfaces:**
- Consumes: `require_superuser`（来自 rbac-authorization-plan Task 1）

- [ ] **Step 1: 编写失败测试**

```python
def test_user_management_routes_require_superuser():
    from src.modules.user.api import router
    guarded = [r for r in router.routes if getattr(r, "dependant", None)]
    assert len(guarded) >= 6  # create/search/get/list/delete/assign_roles
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_user.py -v`
Expected: FAIL

- [ ] **Step 3: 除 `/users/me` 外全部用户管理路由注入 `require_superuser`**

`/users/me` 保留 `get_current_user`（登录用户可访问自己）；其余路由注入 `Depends(require_superuser)`。

- [ ] **Step 4-5: 通过后提交**

```bash
git add src/modules/user/api.py test/test_user.py
git commit -m "feat: 用户管理接口挂载超管授权"
```

## 评审要点（Review Focus）

1. **超管权限码返回**：超管的 `permissions` 应完整或明确标记全量，前端不得因空权限码误判无权限——Task 1 测试覆盖。
2. **数据范围优先级**：`is_superuser` 必须优先于角色 `data_scope`——Task 1 测试覆盖。
3. **`/users/me` 不挂超管**：普通用户访问 `/users/me` 不应 403——Task 3 验证覆盖。
4. **权限码去重**：多角色同权限码不应重复出现——Task 1 测试覆盖。

## 验收标准

- [ ] `/users/me` 返回角色、权限码、数据范围。
- [ ] 用户管理接口（除 `/users/me`）仅超管可访问。
- [ ] 数据范围判定符合优先级规则。
