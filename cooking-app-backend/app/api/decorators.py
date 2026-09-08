import logging

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from functools import wraps

logger = logging.getLogger(__name__)


import uuid
from functools import wraps

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError


def handle_endpoint_errors():
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            db = kwargs.get("db")
            error_id = str(uuid.uuid4())[:8]

            try:
                return await func(*args, **kwargs)

            except HTTPException:
                if db:
                    await db.rollback()
                raise

            except SQLAlchemyError:
                if db:
                    await db.rollback()

                logger.exception(
                    "Database error [%s]",
                    error_id,
                )

                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "message": "We couldn't complete your request right now. "
                        "Please try again later.",
                        "error_id": error_id,
                    },
                )

            except Exception:
                if db:
                    await db.rollback()

                logger.exception(
                    "Unexpected error [%s]",
                    error_id,
                )

                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "message": "Something went wrong on our side. "
                        "Please try again later.",
                        "error_id": error_id,
                    },
                )

        return wrapper

    return decorator
