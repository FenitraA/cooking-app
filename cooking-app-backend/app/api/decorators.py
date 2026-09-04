import logging

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from functools import wraps

logger = logging.getLogger(__name__)


def handle_endpoint_errors():
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            db = kwargs.get("db")
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                if db:
                    await db.rollback()
                raise
            except SQLAlchemyError as e:
                logger.exception("Database error")
                if db:
                    await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error",
                )
            except Exception:
                logger.exception("Unexpected error")
                if db:
                    await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Internal server error",
                )
        return wrapper
    return decorator