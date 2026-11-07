from fastapi import  APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.base_schema import PageResult
from src.core.deps import PageParams, require_superuser
from src.modules.user.model import User
from src.modules.permission.schema import PermissionCreate, PermissionUpdate
from src.infra.database import get_db
from src.core.base_schema import ResponseSchema
from src.modules.permission.service import PermissionService
from src.modules.permission.schema import PermissionRead

router = APIRouter(prefix="/permissions", tags=["权限"])

def get_permission_service(db: AsyncSession = Depends(get_db)) -> PermissionService:
    return PermissionService(db)
@router.get("/search", response_model=ResponseSchema[PageResult[PermissionRead]], summary="分页搜索权限")
async def list_search_results(svc: PermissionService = Depends(get_permission_service),
                              params: PageParams = Depends(),
                              _current_user: User = Depends(require_superuser)):
    """分页搜索权限"""
    perms, total_count = await svc.search_page(params.offset, params.page_size, params.keyword)

    # 列表推导式
    perms = [PermissionRead.model_validate(p) for p in perms]


    return ResponseSchema(data=PageResult(
        items=perms,
        total=total_count,
        page=params.page,
        page_size=params.page_size,
    ))

# GET	/api/v1/permissions/{permission_id}	权限详情
@router.get("/{permission_id}", response_model=ResponseSchema[PermissionRead],summary="获取权限详情")
async def get_permission(permission_id: int,
                         svc: PermissionService = Depends(get_permission_service),
                         _current_user: User = Depends(require_superuser)):
    # 查到数据库的 permission； api 调用 service
    perm = await svc.get_permission(permission_id)


    # api 封装返回值； 把 entity 转成 vo(value object)
    return ResponseSchema(data=PermissionRead.model_validate(perm))

@router.get("/", response_model=ResponseSchema[list[PermissionRead]], summary="获取所有权限列表")
async def list_permissions(service: PermissionService = Depends(get_permission_service),
                           _current_user: User = Depends(require_superuser)):
    """获取所有权限"""
    permissions = await service.list_permissions()

    # 列表推导式
    perms = [PermissionRead.model_validate(p) for p in permissions]

    return ResponseSchema(data=perms)

# POST	/api/v1/permissions	创建权限
@router.post("",response_model= ResponseSchema[PermissionRead],summary="创建权限")
async def create_permission(data: PermissionCreate,
                            svc: PermissionService = Depends(get_permission_service),
                            _current_user: User = Depends(require_superuser)):
    perm = await svc.create_permission(data)
    return ResponseSchema(data=PermissionRead.model_validate(perm))

# PUT	/api/v1/permissions/{permission_id}	更新权限
@router.put("/{permission_id}",response_model=ResponseSchema[PermissionRead],summary="更新权限")
async def update_permission(
                            permission_id: int,
                            data: PermissionUpdate,  # 前端提交的数据
                            svc: PermissionService = Depends(get_permission_service),
                            _current_user: User = Depends(require_superuser)):
    perm = await svc.update_permission(permission_id, data)
    return ResponseSchema(data=PermissionRead.model_validate(perm))


# DELETE	/api/v1/permissions/{permission_id}	删除权限
@router.delete("/{permission_id}",response_model=ResponseSchema,summary="删除权限")
async def delete_permission(permission_id: int,
                            svc: PermissionService = Depends(get_permission_service),
                            _current_user: User = Depends(require_superuser)):
    await svc.delete_permission(permission_id)
    return ResponseSchema(message="permission 删除成功")


# GET	/api/v1/permissions/search	分页搜索权限

