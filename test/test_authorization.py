"""RBAC 授权核心逻辑单元测试（纯函数，无需数据库）。"""
import pytest

from src.core.authorization import (
    get_user_data_scope,
    get_user_permissions,
    has_any_permission,
)
from src.core.deps import require_permission, require_superuser
from src.core.exceptions import BizException


class _Perm:
    def __init__(self, code: str):
        self.code = code


class _Role:
    def __init__(self, data_scope: str = "self", permissions=None):
        self.data_scope = data_scope
        self.permissions = permissions or []


class _User:
    def __init__(self, is_superuser: bool = False, roles=None):
        self.is_superuser = is_superuser
        self.roles = roles or []


def test_superuser_data_scope_is_all():
    u = _User(is_superuser=True, roles=[])
    assert get_user_data_scope(u) == "all"


def test_role_all_scope_wins():
    u = _User(roles=[_Role("self", [_Perm("agent:view")]), _Role("all", [])])
    assert get_user_data_scope(u) == "all"


def test_default_scope_is_self():
    u = _User(roles=[_Role("self", [])])
    assert get_user_data_scope(u) == "self"


def test_empty_roles_scope_self():
    u = _User()
    assert get_user_data_scope(u) == "self"


def test_get_user_permissions_aggregates_and_dedupes():
    u = _User(roles=[
        _Role(permissions=[_Perm("agent:view"), _Perm("agent:create")]),
        _Role(permissions=[_Perm("agent:view"), _Perm("knowledge:view")]),
    ])
    perms = get_user_permissions(u)
    assert perms == ["agent:view", "agent:create", "knowledge:view"]


def test_has_any_permission_superuser_always_true():
    u = _User(is_superuser=True, roles=[])
    assert has_any_permission(u, {"anything"}) is True


def test_has_any_permission_or_semantics():
    u = _User(roles=[_Role(permissions=[_Perm("agent:view")])])
    assert has_any_permission(u, {"agent:view", "agent:create"}) is True
    assert has_any_permission(u, {"agent:create"}) is False


def test_require_permission_superuser_bypasses():
    u = _User(is_superuser=True, roles=[])
    dep = require_permission("agent:create")
    assert dep(u) is u


def test_require_permission_with_permission_passes():
    u = _User(roles=[_Role(permissions=[_Perm("agent:create")])])
    dep = require_permission("agent:create")
    assert dep(u) is u


def test_require_permission_without_permission_raises_403():
    u = _User(roles=[_Role(permissions=[_Perm("agent:view")])])
    dep = require_permission("agent:create")
    with pytest.raises(BizException) as e:
        dep(u)
    assert e.value.code == 403


@pytest.mark.asyncio
async def test_require_superuser_rejects_non_superuser():
    u = _User(roles=[_Role("all", [_Perm("agent:view")])])
    with pytest.raises(BizException) as e:
        await require_superuser(u)
    assert e.value.code == 403


@pytest.mark.asyncio
async def test_require_superuser_accepts_superuser():
    u = _User(is_superuser=True)
    assert await require_superuser(u) is u
