from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from functools import wraps

def handle_endpoint_errors():
    """
    Decorator for FastAPI endpoints that:
    - preserves HTTPExceptions
    - converts unexpected errors into HTTPExceptions
    - rolls back DB session when available
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            db = kwargs.get("db")  # AsyncSession (if injected via Depends)

            try:
                return await func(*args, **kwargs)

            except HTTPException:
                # Preserve FastAPI HTTPExceptions
                if db:
                    await db.rollback()
                raise

            except SQLAlchemyError as e:
                # Database-level errors
                if db:
                    await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erreur base de données : {str(e)}",
                )

            except Exception as e:
                # Any other unexpected error
                if db:
                    await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"{str(e)}",
                )

        return wrapper

    return decorator
