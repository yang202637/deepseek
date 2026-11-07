from fastapi import Depends
from fastapi.params import Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.infra.database import get_db
from src.core.exceptions import BizException
from src.utils.jwt_utils import verify_jwt, oauth2_scheme
from src.modules.user.model import User
from src.core.authorization import get_user_permissions


# oauth2_scheme  是  fastapi 自带的功能，从 Authorization 头中提取 bearer 开头的 token
# 以后前端发送请求；
# GET xxx
# Authorization: Bearer <你的令牌>

# 根据 token 的用户id ，查询用户的详细信息（未来包含角色、权限等）
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """从 JWT token 中解析当前登录用户，用于保护接口"""
    try:
        print(f"前端传递的token: {token}")
        payload = verify_jwt(token)
        user_id = int(payload.get("sub"))
    except Exception as e:
        print(f"token 校验失败: {token} 异常信息: {e}")
        raise BizException(code=401, message="未登录或 token 已过期")

    user = await db.get(User, user_id)
    if not user:
        raise BizException(code=401, message="用户不存在")
    if not user.is_active:
        raise BizException(code=401, message="账号已被禁用")

    return user


def require_permission(*codes: str):
    """依赖工厂：校验当前用户是否拥有任一权限码（OR 语义），超管直接放行。

    用法：
        @router.get("")
        async def list_agents(current_user: User = Depends(require_permission("agent:view"))):
            ...
    """
    def _require_permission(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.is_superuser:
            return current_user
        owned = set(get_user_permissions(current_user))
        if not owned.intersection(codes):
            raise BizException(code=403, message="无权限")
        return current_user

    return _require_permission


async def require_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """依赖：仅超管可访问，否则抛 403。"""
    if not current_user.is_superuser:
        raise BizException(code=403, message="无权限")
    return current_user

# api/v1/users?page=1&page_size=10&keyword=张三
# select * from users where name like '%张三%' limit 20,10
class PageParams:
    """通用分页参数，通过 Depends 注入到接口中"""
    def __init__(
        self,
        page: int = Query(1, ge=1, description="页码，从1开始"),
        page_size: int = Query(10, ge=1, le=100, description="每页条数"),
        keyword: str | None = Query(None, description="搜索关键词"),
    ):
        self.page = page
        self.page_size = page_size
        self.keyword = keyword

    # 动态计算 offset 值，用于 SQL 查询中的 LIMIT 子句
    @property
    def offset(self) -> int:
        """计算 SQL OFFSET"""
        return (self.page - 1) * self.page_size