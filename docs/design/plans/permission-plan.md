# 权限管理 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 将权限管理接口挂载超管专属授权，确保权限码定义（43 个）只可被超管维护。

**架构：** 权限 CRUD、搜索等接口整体挂 `require_superuser`。权限码遵循 `模块:操作` 规范，`code` 唯一且创建后不可改。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Pydantic v2。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.1.3 权限码清单、§7 接口变更）

## 全局约束

- 权限管理接口（`/permissions/*`）整体挂 `require_superuser`，超管专属。
- 权限码格式 `模块:操作`，全小写，`code` 唯一，创建后不可改。
- 通用响应格式不变。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/permission/api.py` | 挂载 `require_superuser` |
| Test | `test/test_permission.py` | 超管保护测试 |

## 任务分解

### Task 1: 权限管理接口挂载超管授权

**Files:**
- Modify: `src/modules/permission/api.py`
- Test: `test/test_permission.py`

**Interfaces:**
- Consumes: `require_superuser`（来自 rbac-authorization-plan Task 1）

- [ ] **Step 1: 编写失败测试**

```python
def test_permission_routes_require_superuser():
    from src.modules.permission.api import router
    guarded = [r for r in router.routes if getattr(r, "dependant", None)]
    assert len(guarded) >= 5  # search/get/list/create/update/delete
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pytest test/test_permission.py -v`
Expected: FAIL

- [ ] **Step 3: 在所有权限路由注入 `Depends(require_superuser)`**

- [ ] **Step 4: 运行测试确认通过**

Run: `pytest test/test_permission.py -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/modules/permission/api.py test/test_permission.py
git commit -m "feat: 权限管理接口挂载超管授权"
```

## 评审要点（Review Focus）

1. **权限码唯一性**：重复 code 创建应被拒绝——已有 `unique=True` 约束，测试覆盖。
2. **权限码不可改**：更新接口应锁定 code 不可变，只允许改 name/description——现有 schema 已按此设计，测试覆盖。
3. **非超管访问**：普通用户访问 `/permissions/*` 返回 403——Task 1 测试覆盖。

## 验收标准

- [ ] 权限管理接口仅超管可访问。
- [ ] 权限码创建后不可修改。
