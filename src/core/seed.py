"""引导数据：43 个权限码、初始超管、初始角色（幂等）。

由 start.bat 或应用启动时调用。
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.permission.model import Permission
from src.modules.role.model import Role
from src.modules.user.model import User
from src.utils.password_utils import hash_password

# 43 个权限码清单（模块:操作），严格对应 PROJECT_SPEC_V2 §5.1.3
PERMISSION_CODES: list[tuple[str, str]] = [
    # 用户 user (5)
    ("user:view", "查看用户"),
    ("user:create", "创建用户"),
    ("user:update", "编辑用户"),
    ("user:delete", "删除用户"),
    ("user:assign-role", "分配用户角色"),
    # 角色 role (5)
    ("role:view", "查看角色"),
    ("role:create", "创建角色"),
    ("role:update", "编辑角色"),
    ("role:delete", "删除角色"),
    ("role:assign-permission", "分配角色权限"),
    # 权限 permission (4)
    ("permission:view", "查看权限"),
    ("permission:create", "创建权限"),
    ("permission:update", "编辑权限"),
    ("permission:delete", "删除权限"),
    # Agent (5)
    ("agent:view", "查看 Agent"),
    ("agent:create", "创建 Agent"),
    ("agent:update", "编辑 Agent"),
    ("agent:delete", "删除 Agent"),
    ("agent:publish", "发布 Agent"),
    # 模型 model (5)
    ("model:view", "查看模型"),
    ("model:create", "创建模型"),
    ("model:update", "编辑模型"),
    ("model:delete", "删除模型"),
    ("model:test", "模型连接测试"),
    # 供应商 provider (5)
    ("provider:view", "查看供应商"),
    ("provider:create", "创建供应商"),
    ("provider:update", "编辑供应商"),
    ("provider:delete", "删除供应商"),
    ("provider:test", "供应商连接测试"),
    # Prompt (5)
    ("prompt:view", "查看 Prompt"),
    ("prompt:create", "创建 Prompt"),
    ("prompt:update", "编辑 Prompt"),
    ("prompt:delete", "删除 Prompt"),
    ("prompt:publish", "发布 Prompt"),
    # 知识库 knowledge (5)
    ("knowledge:view", "查看知识库"),
    ("knowledge:create", "创建知识库"),
    ("knowledge:update", "编辑知识库"),
    ("knowledge:delete", "删除知识库"),
    ("knowledge:document-manage", "管理知识库文档"),
    # 工具 tool (5)
    ("tool:view", "查看工具"),
    ("tool:create", "创建工具"),
    ("tool:update", "编辑工具"),
    ("tool:delete", "删除工具"),
    ("tool:test", "工具测试"),
]


async def seed_data(db: AsyncSession) -> None:
    """幂等写入：权限码、超管、超管角色、普通用户角色。"""
    # 1. 权限码
    existing = (await db.execute(select(Permission.code))).scalars().all()
    existing_set = set(existing)
    for code, name in PERMISSION_CODES:
        if code not in existing_set:
            db.add(Permission(code=code, name=name, description=name))

    # 2. 超管角色（data_scope=all，锁定的系统角色）
    super_role = (await db.execute(select(Role).where(Role.code == "super_admin"))).scalar_one_or_none()
    if not super_role:
        super_role = Role(code="super_admin", name="超管", description="系统超级管理员", data_scope="all")
        db.add(super_role)
        await db.flush()

    # 3. 普通用户角色（data_scope=self）
    normal_role = (await db.execute(select(Role).where(Role.code == "user"))).scalar_one_or_none()
    if not normal_role:
        normal_role = Role(code="user", name="普通用户", description="仅可查看自己创建的资源", data_scope="self")
        db.add(normal_role)
        await db.flush()

    # 4. 初始超管 admin（is_superuser=True）
    admin = (await db.execute(select(User).where(User.username == "admin"))).scalar_one_or_none()
    if not admin:
        admin = User(
            username="admin",
            email="admin@chenguang.ai",
            hashed_password=hash_password("123456"),
            is_active=True,
            is_superuser=True,
        )
        admin.roles = [super_role]
        db.add(admin)
        await db.flush()

    # 5. 给超管角色绑定全量权限码（重新查询以触发 selectin 立即加载，避免懒加载）
    super_role = (await db.execute(select(Role).where(Role.code == "super_admin"))).scalar_one()
    all_perms = (await db.execute(select(Permission))).scalars().all()
    super_role.permissions = all_perms

    await db.commit()
