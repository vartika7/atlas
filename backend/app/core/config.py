"""Application configuration.

Responsibility
--------------
Single source of truth for every runtime setting. Values are read from the
environment (or a local `.env`), validated by Pydantic, and exposed through the
cached `get_settings()` accessor so the rest of the codebase never touches
`os.environ` directly.

Adding a setting = add a typed field here, document it in `env.example`.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed, validated runtime settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        # Ignore unrelated vars so a shared shell profile can't crash boot.
        extra="ignore",
    )

    # --- Application metadata ---------------------------------------------
    app_name: str = "PM Atlas API"
    app_description: str = "AI Product Strategy Platform — backend API"
    version: str = "0.1.0"

    # Mounted under a version prefix from day one so v2 can coexist later.
    api_v1_prefix: str = "/api/v1"

    # --- Environment ------------------------------------------------------
    environment: Literal["local", "dev", "staging", "production"] = "local"
    debug: bool = True

    # --- CORS -------------------------------------------------------------
    # The React frontend's origins. :8080 is what the TanStack Start dev server
    # actually serves on; the other two are conventional Vite/Next defaults.
    cors_origins: list[str] = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # --- Investigation lifecycle ------------------------------------------
    # Wall-clock seconds spent on each stage of a simulated investigation run.
    # Settable so tests can drive a full lifecycle to completion instantly
    # instead of waiting out the real cadence.
    stage_duration_seconds: float = Field(default=2.5, ge=0.0)

    # --- Placeholders for later sprints -----------------------------------
    # Left as Optional so the app boots with none of them configured.
    database_url: str | None = None
    supabase_url: str | None = None
    supabase_service_key: str | None = None
    openrouter_api_key: str | None = None

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings singleton.

    Cached so the `.env` file is parsed once. Usable as a FastAPI dependency:
    `settings: Settings = Depends(get_settings)`.
    """
    return Settings()
