from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.base_repository import BaseRepository
from src.modules.agent.model import Agent, AgentVersion


class AgentRepository(BaseRepository[Agent]):
    """搜索字段：按名称或描述搜索"""
    SEARCH_FIELDS = ["name", "description"]

    def __init__(self, db: AsyncSession):
        super().__init__(Agent, db)

    async def get_by_status(self, status: str) -> list[Agent]:
        stmt = select(Agent).where(Agent.status == status)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def search_page(
        self, offset: int, limit: int, keyword: str | None,
        owner_id: int | None = None,
    ) -> tuple[list[Agent], int]:
        """分页 + 搜索 + 可选归属过滤（数据范围 self 时传入当前用户 id）。"""
        from sqlalchemy import func, or_
        stmt = select(Agent)
        conditions = []
        if keyword and self.SEARCH_FIELDS:
            kw_conditions = []
            for field_name in self.SEARCH_FIELDS:
                column = getattr(Agent, field_name, None)
                if column is not None:
                    kw_conditions.append(column.like(f"%{keyword}%"))
            if kw_conditions:
                conditions.append(or_(*kw_conditions))
        if owner_id is not None:
            conditions.append(Agent.created_by_id == owner_id)
        if conditions:
            stmt = stmt.where(*conditions)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = stmt.offset(offset).limit(limit).order_by(Agent.id.asc())
        items = list((await self.db.execute(stmt)).scalars().all())
        return items, total


class AgentVersionRepository(BaseRepository[AgentVersion]):
    def __init__(self, db: AsyncSession):
        super().__init__(AgentVersion, db)

    async def get_versions_by_agent(self, agent_id: int) -> list[AgentVersion]:
        stmt = (
            select(AgentVersion)
            .where(AgentVersion.agent_id == agent_id)
            .order_by(AgentVersion.id.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def clear_current(self, agent_id: int) -> None:
        stmt = (
            update(AgentVersion)
            .where(AgentVersion.agent_id == agent_id)
            .values(is_current=False)
        )
        await self.db.execute(stmt)