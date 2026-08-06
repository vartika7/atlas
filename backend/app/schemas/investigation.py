"""API schemas for the Investigation resource.

Responsibility
--------------
Defines the *public contract* between the React frontend and the backend:
what a request must look like, what a response is guaranteed to contain.

Kept separate from `app/models/investigation.py` on purpose — the domain model
can change (new columns, internal fields) without silently changing the API, and
internal fields never leak to clients by accident.

Naming convention:
    *Create  -> request body for POST
    *Update  -> request body for PATCH
    *Read    -> single-object response
    *List    -> paginated collection response
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.investigation import InvestigationStatus


class InvestigationBase(BaseModel):
    """Fields a client supplies and may read back."""

    title: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Short human label for the investigation.",
        examples=["Self-serve activation drop"],
    )
    question: str = Field(
        ...,
        min_length=10,
        max_length=2_000,
        description="The strategic question Atlas should investigate.",
        examples=["Why did activation drop for self-serve signups in Q2?"],
    )
    context: str | None = Field(
        default=None,
        max_length=10_000,
        description="Optional background: metrics, prior decisions, constraints.",
    )
    tags: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="Free-form labels used for filtering.",
    )


class InvestigationCreate(InvestigationBase):
    """POST /investigations request body."""


class InvestigationUpdate(BaseModel):
    """PATCH /investigations/{id} request body — every field optional."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    question: str | None = Field(default=None, min_length=10, max_length=2_000)
    context: str | None = Field(default=None, max_length=10_000)
    tags: list[str] | None = Field(default=None, max_length=20)


class InvestigationRead(InvestigationBase):
    """Single investigation as returned by the API."""

    # `from_attributes` lets us build this straight from the domain object
    # (dataclass now, SQLAlchemy row later) via `model_validate(obj)`.
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: InvestigationStatus
    error: str | None = None
    summary: str | None = Field(
        default=None,
        description="Executive summary. Null until the investigation completes.",
    )
    findings: list[str] = Field(
        default_factory=list,
        description="Evidence-backed findings. Empty until the run completes.",
    )
    created_at: datetime
    updated_at: datetime


class InvestigationList(BaseModel):
    """Paginated collection response.

    Envelope rather than a bare array so pagination metadata can grow without
    breaking existing clients.
    """

    items: list[InvestigationRead]
    total: int = Field(..., description="Total matching records, ignoring paging.")
    limit: int
    offset: int
