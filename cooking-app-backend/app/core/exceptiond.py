import uuid
import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def generate_error_id() -> str:
    return str(uuid.uuid4())[:8]


async def sqlalchemy_exception_handler(
    request: Request,
    exc: SQLAlchemyError,
):
    error_id = generate_error_id()

    logger.exception(
        "Database error [%s] - %s %s",
        error_id,
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": (
                "We couldn't complete your request right now. "
                "Please try again later."
            ),
            "error_id": error_id,
        },
    )


async def unexpected_exception_handler(
    request: Request,
    exc: Exception,
):
    error_id = generate_error_id()

    logger.exception(
        "Unexpected error [%s] - %s %s",
        error_id,
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": (
                "Something went wrong on our side. "
                "Please try again later."
            ),
            "error_id": error_id,
        },
    )