# RBAC 授权核心 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 建立接口级授权基础设施（`require_permission` / `require_superuser`）、43 个权限码清单、引导数据 seed 与前端授权上下文，使"角色权限真正拦得住接口"。

**架构：** 在 `src/core/deps.py` 新增两个 FastAPI 依赖工厂，复用现有 `get_current_user` 完成认证后，基于 `user.roles[*].permissions[*].code` 做 OR 语义交集判定，超管（`is_superuser=True`）直接放行。权限码遵循 `模块:操作` 规范，由 seed 幂等写入 `permissions` 表。前端登录后缓存权限码与数据范围，驱动菜单/按钮显隐。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Pydantic v2；前端 React 19 + TypeScript + Vite。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.1 功能权限、§5.3 前端授权、§5.4 引导数据、§7 接口变更）

## 全局约束

- 权限码格式 `模块:操作`，全小写，英文冒号分隔（如 `agent:view`）。
- 超管（`is_superuser=True`）跳过一切功能权限校验。
- 未登录由 `get_current_user` 兜底返回 401；已登录但无权限返回业务错误码 `403`（`BizException(code=403, message="无权限")`），与 401 区分。
- 通用响应格式 `{code, message, data}` 不变；`data` 为 `null` 时无权限。
- seed 引导数据须幂等，重复执行不产生重复数据，且不影响既有数据。
- 前端 403 提示"无权限"且不跳转登录（与 401 区分）。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/core/deps.py` | 新增 `require_permission`、`require_superuser` 依赖工厂 |
| 新建 | `src/core/seed.py` | 引导数据：初始超管 + 初始角色 + 全量权限码（幂等） |
| 修改 | `src/main.py` | 在 lifespan 或启动钩子中调用 seed |
| 修改 | `src/modules/auth/schema.py` | `TokenResponse` 增加 `permissions`、`data_scope` 字段 |
| 修改 | `src/modules/auth/service.py` | 登录时查询并返回权限码列表 + 数据范围 |
| 修改 | `src/modules/user/schema.py` | 新增当前用户授权信息响应模型 |
| 修改 | `src/modules/user/api.py` | `/users/me` 返回角色、权限码、数据范围 |
| 修改 | `app/src/services/api/auth.ts` | 登录响应类型增加权限字段 |
| 新建 | `app/src/context/PermissionContext.tsx` | 前端权限上下文（权限码 + 数据范围 + 判断能力） |
| 修改 | `app/src/layouts/DashboardLayout.tsx` | 侧边栏菜单按权限码显隐 |
| 修改 | `app/src/App.tsx` | 包裹权限上下文 Provider |
| 修改 | `app/src/services/api/client.ts` | 403 与 401 错误区分处理 |

## 任务分解

### Task 1: 授权依赖工厂 `require_permission` / `require_superuser`

**Files:**
- Modify: `src/core/deps.py`
- Test: `test/test_authorization.py`

**Interfaces:**
- Consumes: `get_current_user(db) -> User`（已有）；`User.roles[*].permissions[*].code`
- Produces:
  - `require_permission(*codes: str) -> Callable[..., User]`（FastAPI 依赖工厂，校验通过返回当前用户）
  - `require_superuser(user: User = Depends(get_current_user)) -> User`

- [ ] **Step 1: 编写失败测试**

```python
# test/test_authorization.py
import pytest
from src.core.deps import require_permission, require_superuser
from src.core.exceptions import BizException

@pytest.mark.asyncio
async def test_superuser_bypasses_permission_check():
    user = User(is_superuser=True, roles=[])
    result = await require_permission("agent:create")(user)  # 超管直接放行
    assert result is user

@pytest.mark.asyncio
async def test_user_with_permission_passes():
    perm = Permission(code="agent:create")
    role = Role(permissions=[perm])
    user = User(is_superuser=False, roles=[role])
    result = await require_permission("agent:create")(user)
    assert result is user

@pytest.mark.asyncio
async def test_user_without_permission_raises_403():
    user = User(is_superuser=False, roles=[Role(permissions=[Permission(code="agent:view")])])
    with pytest.raises(BizException) as e:
        await require_permission("agent:create")(user)
    assert e.value.code == 403
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_authorization.py -v`
Expected: FAIL（`require_permission` 未定义）

- [ ] **Step 3: 在 `src/core/deps.py` 实现两个依赖**

实现 `require_permission(*codes)`：若 `user.is_superuser` 为真返回 user；否则汇总 `user.roles[*].permissions[*].code` 与 `codes` 求交集，交集为空则 `raise BizException(code=403, message="无权限")`。实现 `require_superuser`：非超管抛 `BizException(code=403, message="无权限")`。

- [ ] **Step 4: 运行测试确认通过**

Run: `pytest test/test_authorization.py -v`
Expected: PASS（3 项通过）

- [ ] **Step 5: 提交**

```bash
git add src/core/deps.py test/test_authorization.py
git commit -m "feat: 新增 require_permission/require_superuser 授权依赖"
```

### Task 2: 权限码清单与引导数据 seed

**Files:**
- Create: `src/core/seed.py`
- Modify: `src/main.py`
- Test: `test/test_seed.py`

**Interfaces:**
- Consumes: `Permission(code, name, description)`、`Role(code, name, description, data_scope, permissions)`、`User(username, email, hashed_password, is_superuser)`
- Produces: `async def seed_data(db: AsyncSession) -> None`（幂等）

- [ ] **Step 1: 编写失败测试**

```python
# test/test_seed.py
import pytest
from src.core.seed import seed_data, PERMISSION_CODES

def test_permission_codes_count_is_43():
    assert len(PERMISSION_CODES) == 43

@pytest.mark.asyncio
async def test_seed_is_idempotent(db_session):
    await seed_data(db_session)
    count_first = await db_session.scalar(select(func.count()).select_from(Permission))
    await seed_data(db_session)  # 再次执行不产生重复
    count_second = await db_session.scalar(select(func.count()).select_from(Permission))
    assert count_first == count_second == 43
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_seed.py -v`
Expected: FAIL（`seed_data` 未定义）

- [ ] **Step 3: 实现 `seed_data` 与 `PERMISSION_CODES`**

`PERMISSION_CODES` 为 43 个 `(code, name)` 元组，严格按 V2 §5.1.3 清单：user 5 个、role 5 个、permission 4 个、agent 5 个、model 5 个、provider 5 个、prompt 5 个、knowledge 5 个、tool 5 个。`seed_data` 按 code 存在性判断，存在则跳过；创建初始超管 `admin`（`is_superuser=True`）、「超管」角色（`data_scope="all"`，锁定，绑全量权限）、「普通用户」角色（`data_scope="self"`，绑查看类权限）。

- [ ] **Step 4: 运行测试确认通过**

Run: `pytest test/test_seed.py -v`
Expected: PASS

- [ ] **Step 5: 在 `main.py` lifespan 中调用 seed 并提交**

`lifespan` 启动时获取 db session 调用 `await seed_data(db)`，用 try/except 包裹避免启动失败。提交 `src/core/seed.py src/main.py test/test_seed.py`。

### Task 3: 登录响应返回权限码与数据范围

**Files:**
- Modify: `src/modules/auth/schema.py`
- Modify: `src/modules/auth/service.py`
- Test: `test/test_auth.py`

**Interfaces:**
- Consumes: `UserRepository`、`User.roles`、`Role.permissions`、`Role.data_scope`
- Produces: `TokenResponse(access_token: str, permissions: list[str], data_scope: str)`

- [ ] **Step 1: 编写失败测试**

```python
def test_token_response_contains_permissions_and_scope():
    t = TokenResponse(access_token="x", permissions=["agent:view"], data_scope="self")
    assert t.permissions == ["agent:view"]
    assert t.data_scope == "self"
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_auth.py -v`
Expected: FAIL（`TokenResponse` 缺少字段）

- [ ] **Step 3: 扩展 `TokenResponse` 并在 `login` 中填充**

`data_scope` 按 V2 §5.2.2 判定：`is_superuser` → `all`；任一角色 `data_scope=="all"` → `all`；否则 `self`。`permissions` 为去重后的权限码列表。

- [ ] **Step 4-5: 运行测试通过后提交**

```bash
git add src/modules/auth/schema.py src/modules/auth/service.py test/test_auth.py
git commit -m "feat: 登录响应返回权限码与数据范围"
```

### Task 4: `/users/me` 返回当前用户授权信息

**Files:**
- Modify: `src/modules/user/schema.py`
- Modify: `src/modules/user/api.py`

**Interfaces:**
- Consumes: `get_current_user`
- Produces: `UserAuthRead(id, username, email, is_active, is_superuser, roles: list[RoleRead], permissions: list[str], data_scope: str)`

- [ ] **Step 1: 编写失败测试**

```python
def test_user_auth_read_schema():
    u = UserAuthRead(id=1, username="admin", email="a@b.c", is_active=True,
                     is_superuser=True, roles=[], permissions=["agent:view"], data_scope="all")
    assert u.data_scope == "all"
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_user.py -v`（或指定测试文件）
Expected: FAIL

- [ ] **Step 3: 实现 `/users/me` 返回 `UserAuthRead`**

复用 Task 3 的 `data_scope` 判定逻辑（可抽公共函数避免重复），`permissions` 从用户角色汇总。

- [ ] **Step 4-5: 通过后提交**

```bash
git add src/modules/user/schema.py src/modules/user/api.py test/test_user.py
git commit -m "feat: /users/me 返回当前用户权限与数据范围"
```

### Task 5: 前端权限上下文与菜单/按钮显隐

**Files:**
- Create: `app/src/context/PermissionContext.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/layouts/DashboardLayout.tsx`
- Modify: `app/src/services/api/auth.ts`
- Modify: `app/src/services/api/client.ts`

**Interfaces:**
- Consumes: `authService.login()` 返回的 `permissions`、`data_scope`
- Produces: `usePermission()` → `{ permissions: string[], dataScope: string, hasPermission(code: string): boolean }`

- [ ] **Step 1: 定义权限上下文与 `hasPermission` 钩子**

`PermissionContext` 存储 `permissions`（权限码集合）与 `dataScope`；`hasPermission(code)` 返回权限码集合是否包含该 code。

- [ ] **Step 2: 登录后写入权限上下文**

`auth.ts` 的 `TokenResponse` 类型增加 `permissions`、`data_scope`；登录成功后把二者写入 `PermissionContext`（配合 `tokenStorage` 持久化）。

- [ ] **Step 3: 侧边栏菜单按权限码显隐**

`DashboardLayout` 菜单项通过 `hasPermission` 判断渲染（如系统管理菜单需超管或对应权限码）；无权限菜单不渲染。

- [ ] **Step 4: `client.ts` 区分 403 与 401**

401 → 清除 token 跳 `/login`；403 → 抛出带"无权限"提示的错误，不跳转。

- [ ] **Step 5: 前端构建验证**

Run: `cd app && npm run build`
Expected: 无 TS 错误，构建通过

- [ ] **Step 6: 提交**

```bash
git add app/src/context/PermissionContext.tsx app/src/App.tsx app/src/layouts/DashboardLayout.tsx app/src/services/api/auth.ts app/src/services/api/client.ts
git commit -m "feat: 前端权限上下文与菜单按钮动态显隐"
```

## 评审要点（Review Focus）

1. **无角色用户**：`is_superuser=False` 且 `roles=[]` 时，`require_permission` 应拒绝（交集为空），不因空列表异常——Task 1 测试覆盖。
2. **角色含 None 权限**：某角色 `permissions` 为空列表时，汇总不应抛异常——Task 1 测试覆盖。
3. **数据范围优先级**：`is_superuser=True` 必须优先于角色 `data_scope` 判定——Task 3 测试覆盖。
4. **seed 幂等**：重复执行 seed 不产生重复权限/角色/超管——Task 2 测试覆盖。
5. **403 与 401 混淆**：前端须把无权限（403）与未登录（401）区分，否则无权限用户会被反复踢回登录页——Task 5 验证覆盖。

## 验收标准

- [ ] 超管访问任意受保护接口放行；无权限用户访问返回 403。
- [ ] 登录响应含 `permissions` 与 `data_scope`。
- [ ] `/users/me` 返回角色、权限码、数据范围。
- [ ] seed 执行后存在 `admin` 超管、「超管」「普通用户」角色、43 个权限码；重复执行无重复。
- [ ] 前端菜单按权限显隐；403 提示"无权限"且不跳登录。
