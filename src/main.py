from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from src.infra.minio_client import ensure_bucket_exists
from src.core.config import get_settings
from src.middlewares.logging import LoggingMiddleware
from src.core.exceptions import register_exception_handlers
from src.core.logger import setup_logger
from src.core.seed import seed_data
from src.infra.database import engine, AsyncSessionLocal
from src.modules.user.api import router as user_router
from src.modules.captcha.api import router as captcha_router
from src.modules.auth.api import router as auth_router
from src.modules.permission.api import router as permission_router
from src.modules.role.api import router as role_router
from src.modules.provider.api import router as provider_router
from src.modules.model.api import router as model_router
from src.modules.prompt.api import router as prompt_router
from src.modules.knowledge.api import router as knowledge_router
from src.modules.tool.api import router as tool_router
from src.modules.agent.api import router as agent_router
from loguru import logger



# 使用上下文管理器感知项目的生命周期
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logger() # 配置日志组件
    settings = get_settings()
    logger.info(f"{settings.APP_NAME} 启动.. | 使用环境： {settings.APP_ENV}")
    # 应用启动时执行
    # 确保 MinIO 桶的存在
    try:
        ensure_bucket_exists()
    except Exception as e:
        logger.error(f"minio 桶创建失败，文件上传功能将无法使用：{e}")

    # 写入 RBAC 引导数据（权限码、超管、角色，幂等）
    try:
        async with AsyncSessionLocal() as db:
            await seed_data(db)
    except Exception as e:
        logger.error(f"RBAC 引导数据写入失败：{e}")

    yield
    # 应用关闭时执行
    # 关闭数据库连接池
    await engine.dispose()
    logger.info(f"{settings.APP_NAME} 关闭.. ")


def create_app() -> FastAPI:
    settings = get_settings()

    # 创建应用
    # 注册生命周期管理器
    app = FastAPI(title=settings.APP_NAME, 
                  version="1.0.0",
                  debug=settings.APP_DEBUG,
                  lifespan=lifespan,
                  )


    # 注册中间件
    app.add_middleware(LoggingMiddleware)
    # 注册跨域中间件
    app.add_middleware(CORSMiddleware,
                       allow_origins=["http://localhost:3000","http://localhost:5173"],
                       allow_credentials=True,
                       allow_methods=["*"],
                       allow_headers=["*"])



    # 注册异常处理器
    register_exception_handlers(app)

    # 注册路由
    app.include_router(user_router, prefix="/api/v1")
    app.include_router(captcha_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(permission_router, prefix="/api/v1")
    app.include_router(role_router, prefix="/api/v1")

    app.include_router(provider_router, prefix="/api/v1")
    app.include_router(model_router, prefix="/api/v1")
    app.include_router(prompt_router, prefix="/api/v1")
    app.include_router(knowledge_router, prefix="/api/v1")
    app.include_router(tool_router, prefix="/api/v1")
    app.include_router(agent_router, prefix="/api/v1")

    return app

# 创建fastapi 应用
app = create_app()

# 健康检查路由； 能访问通，就代表应用启动
@app.get("/health")
async def root():
    # prometheus 规范约束，返回的 status 必须是 ok，代表健康
    return {"status": "ok"}