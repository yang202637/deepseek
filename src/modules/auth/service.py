from redis.asyncio.client import Redis
from src.modules.captcha.service import CaptchaService
from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.auth.schema import LoginRequest, TokenResponse
from src.modules.captcha.schema import CaptchaVerifyRequest
from src.modules.user.repository import UserRepository
from src.core.exceptions import BizException
from src.core.authorization import get_user_permissions, get_user_data_scope
from src.utils.password_utils import verify_password
from src.utils.jwt_utils import encode_jwt
from datetime import datetime, timezone
from loguru import logger


# 未来推荐，每个svc 注入 db: AsyncSession 和 redis: Redis

class AuthService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.captcha_svc = CaptchaService(redis)
        self.user_repo = UserRepository(db)
    
    async def login(self, data: LoginRequest) -> TokenResponse:
        # 1. 校验验证码
        captcha_verify_req = CaptchaVerifyRequest(
            key=data.captcha_key,
            code=data.captcha_code,
        )
        await self.captcha_svc.verify_captcha(captcha_verify_req)
        
        # 2. 走到这里说明校验通过。 查询用户信息
        user = await self.user_repo.get_by_username(data.username)
        if not user:
            raise BizException(code=10002, message="用户不存在")
        
        if not user.is_active:
            raise BizException(code=10004, message="用户已被禁用")

        # 3. 校验密码.
        if not verify_password(data.password, user.hashed_password):
            raise BizException(code=10003, message="密码错误")
        # 5. 更新最后一次登录时间
        user.last_login = datetime.now()
        await self.user_repo.update(user)

        # 4. 生成token: 强制必须 sub 是str
        payload = {"sub": str(user.id), "username": user.username, "email": user.email}

        token = encode_jwt(payload)
        logger.info(f"生成token: {token}")

        return TokenResponse(
            access_token=token,
            permissions=get_user_permissions(user),
            data_scope=get_user_data_scope(user),
        )
