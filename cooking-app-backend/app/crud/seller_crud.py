from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.general_crud import smart_search
from app.models import Recipe
from app.models.seller import Seller


class SellerCRUD:
    async def select_search(
            self,
            db: AsyncSession,
            name: str | None = None,
            offset: int = 0,
            limit: int = 10,
    ) -> list[Seller]:
        query = select(Seller).where(Seller.state > 0)

        # Filters
        if name and name.strip():
            search_filter, ranking = smart_search(
                Recipe.name,
                name,
            )

            query = (
                query
                .where(search_filter)
                .order_by(
                    ranking.desc(),
                    Recipe.name.asc(),
                )
            )
        else:
            query = query.order_by(Recipe.name.asc())

        # Pagination
        query = query.offset(offset).limit(limit)

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)

        return list(result.scalars().all())


seller_crud_instance = SellerCRUD()
