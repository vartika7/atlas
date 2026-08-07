"""Domain error → HTTP response mapping.

Responsibility
--------------
The single place where domain exceptions become HTTP responses. Registering
handlers here means the services keep raising plain domain errors and the
routers keep no error-translation code at all — previously every handler that
could 404 repeated the same four-line `try/except`.

Adding a new domain error = raise it in the service, map it here once.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.services.orchestrator import InvestigationNotFoundError


async def handle_investigation_not_found(_request: Request, exc: Exception) -> JSONResponse:
    """Render a missing investigation as a 404.

    The body is `{"detail": ...}` to match FastAPI's own `HTTPException` shape,
    so clients see one error format across the API.
    """
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Wire domain errors to responses. Called once from the app factory."""
    app.add_exception_handler(InvestigationNotFoundError, handle_investigation_not_found)
