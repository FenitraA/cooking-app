from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.seller import Seller
from app.schemas.seller import SellerRead


class SellerCRUD:
    async def select_search(
        self,
        db: AsyncSession,
        name: str | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> list[SellerRead]:
        query = select(Seller).where(Seller.state > 0)

        # Filters
        if name:
            pattern = f"%{name}%"
            query = query.where(Seller.name.ilike(pattern))

        # Order
        query = query.order_by(Seller.name)

        # Pagination
        query = query.offset(offset).limit(limit)

        # Execute
        result = await db.execute(query)
        items = result.scalars().all()

        return items


seller_crud_instance = SellerCRUD()
