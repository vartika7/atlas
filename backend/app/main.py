"""FastAPI application entrypoint.

Responsibility
--------------
Composition root. Builds the ASGI app, applies middleware, registers routers and
exposes health checks. It contains no business logic — everything is delegated
to the layers it wires together.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import investigations
from app.core.config import Settings, get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown hook.

    TODO(sprint-2): open the DB engine + Supabase client here on startup and
    dispose of them on shutdown, so connections are shared per process.
    """
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    """Application factory.

    A factory (rather than a module-level `app = FastAPI()`) lets tests build an
    isolated app with overridden settings and dependencies.
    """
    settings = settings or get_settings()

    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.version,
        lifespan=lifespan,
        # Hide interactive docs in production.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
    )

    # The React frontend is served from a different origin in development.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Every resource router is mounted under the versioned prefix.
    app.include_router(investigations.router, prefix=settings.api_v1_prefix)

    @app.get("/health", tags=["system"], summary="Liveness probe")
    async def health() -> dict[str, str]:
        """Cheap unauthenticated check for load balancers and local sanity."""
        return {
            "status": "ok",
            "service": settings.app_name,
            "version": settings.version,
            "environment": settings.environment,
        }

    return app


# ASGI entrypoint referenced by uvicorn/gunicorn as `app.main:app`.
app = create_app()
