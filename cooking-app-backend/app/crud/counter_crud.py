from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.counter import Counter

class CounterCRUD:
    async def create(self, db: AsyncSession, name: str) -> Counter:
        new_counter = Counter(name=name)
        db.add(new_counter)
        await db.flush()
        await db.refresh(new_counter)
        return new_counter
    
    async def get_next_counter(self, db: AsyncSession, counter_name: str) -> int:
            
        result = await db.execute(
            select(Counter)
            .where(Counter.name == counter_name)
            .with_for_update()
        )
        counter = result.scalar_one_or_none()

        if counter is None:
            counter = Counter(name=counter_name, current_value=1)
            db.add(counter)
            await db.flush()
            return 1

        counter.current_value += 1
        await db.flush()
        return counter.current_value



counter_crud_instance = CounterCRUD()
