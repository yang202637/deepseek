from src.core.deps import PageParams, require_superuser
from src.modules.role.schema import RoleRead
from src.modules.user.model import User
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.infra.database import get_db
from src.core.base_schema import ResponseSchema, PageResult
from src.modules.user.schema import UserCreate, UserRead, UserAssignRoles, UserWithRolesRead, UserAuthRead
from src.modules.user.service import UserService
from src.core.deps import get_current_user

router = APIRouter(prefix="/users", tags=["User"])

# 依赖注入 UserService
def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)


# POST /users
@router.post("", response_model=ResponseSchema[UserRead], summary="创建用户")
async def create_user(
    data: UserCreate,
    svc: UserService = Depends(get_user_service),
    _current_user: User = Depends(require_superuser),
):
    # 由于返回的是 ORM 模型对象
    user = await svc.create_user(data)

    return ResponseSchema(data=UserRead.model_validate(user))

@router.get("/search", response_model=ResponseSchema[PageResult[UserRead]], summary="分页搜索用户")
async def list_search_results(svc: UserService = Depends(get_user_service),
                              params: PageParams = Depends(),
                              _current_user: User = Depends(require_superuser)):
    """分页搜索权限"""
    users, total_count = await svc.search_page(params.offset, params.page_size, params.keyword)

    # 列表推导式
    users = [UserRead.model_validate(p) for p in users]
    page_result =  PageResult(
        items=users,
        total=total_count,
        page=params.page,
        page_size=params.page_size,
    )
    return ResponseSchema(data=page_result)

@router.get("/me", response_model=ResponseSchema[UserAuthRead], summary="获取当前登录用户授权信息")
async def get_current_user_auth(
    current_user: User = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    """返回当前用户身份、角色、权限码、数据范围"""
    auth = await svc.get_user_authorization(current_user)
    return ResponseSchema(data=auth)

@router.get("/{user_id}", response_model=ResponseSchema[UserWithRolesRead])
async def get_user(
    user_id: int,
    svc: UserService = Depends(get_user_service),
    _current_user: User = Depends(require_superuser),
):
    user = await svc.get_user(user_id)
    return ResponseSchema(data=UserWithRolesRead.model_validate(user))


@router.get("", response_model=ResponseSchema[list[UserRead]])
async def list_users(
    offset: int = 0,
    limit: int = 100,
    svc: UserService = Depends(get_user_service),
    _current_user: User = Depends(require_superuser),
):
    users = await svc.list_users(offset, limit)
    return ResponseSchema(data=[UserRead.model_validate(u) for u in users])

# PUT	/api/v1/users/{user_id}/roles	给用户分配角色
@router.put("/{user_id}/roles", response_model=ResponseSchema[UserWithRolesRead])
async def user_assign_roles(
    user_id: int,
    roles: UserAssignRoles,
    svc: UserService = Depends(get_user_service),
    _current_user: User = Depends(require_superuser),
):
    user = await svc.assign_roles(user_id, roles.role_ids)
    return ResponseSchema(data=UserWithRolesRead.model_validate(user))


# GET	/api/v1/users/{user_id}/roles	查看用户的角色列表
@router.get("/{user_id}/roles",response_model=ResponseSchema[list[RoleRead]])
async def get_user_roles_list(
    user_id: int,
    svc: UserService = Depends(get_user_service),
    _current_user: User = Depends(require_superuser),
):
    user = await svc.get_user_with_roles(user_id)
    if user.roles:
        return ResponseSchema(data=[RoleRead.model_validate(r) for r in user.roles])
    return ResponseSchema(data=[])


@router.delete("/{user_id}", response_model=ResponseSchema[bool])
async def delete_user(
    user_id: int,
    svc: UserService = Depends(get_user_service),
    _current_user: User = Depends(require_superuser),
):
    user = await svc.delete_user(user_id)
    return ResponseSchema()
