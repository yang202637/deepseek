"""授权辅助纯函数：数据范围判定 + 权限码聚合。

供 auth service、user service、业务模块复用，便于单元测试。
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.modules.user.model import User


def get_user_data_scope(user: "User") -> str:
    """判定用户数据范围，优先级（PROJECT_SPEC_V2 §5.2.2）：

    1. is_superuser 为真 -> "all"
    2. 任一角色 data_scope == "all" -> "all"
    3. 否则 -> "self"
    """
    if getattr(user, "is_superuser", False):
        return "all"
    for role in getattr(user, "roles", []) or []:
        if getattr(role, "data_scope", None) == "all":
            return "all"
    return "self"


def get_user_permissions(user: "User") -> list[str]:
    """聚合用户所有角色下的权限码（去重，保持顺序）。"""
    codes: list[str] = []
    seen: set[str] = set()
    for role in getattr(user, "roles", []) or []:
        for perm in getattr(role, "permissions", []) or []:
            code = getattr(perm, "code", None)
            if code and code not in seen:
                seen.add(code)
                codes.append(code)
    return codes


def has_any_permission(user: "User", codes: set[str]) -> bool:
    """判断用户是否拥有 codes 中任一权限码（OR 语义）。"""
    if getattr(user, "is_superuser", False):
        return True
    return bool(set(get_user_permissions(user)) & codes)
