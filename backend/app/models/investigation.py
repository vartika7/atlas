"""Domain model for an Investigation.

Responsibility
--------------
Describes what an Investigation *is* inside our system, independent of HTTP
(see `app/schemas/investigation.py`) and independent of storage.

An Investigation is one strategic question a PM asks Atlas — "why is activation
dropping for self-serve signups?" — which the orchestrator will later break into
research steps and answer with evidence.

Sprint 1 uses a plain dataclass so nothing depends on a database yet. When the
persistence sprint lands, this module becomes the SQLAlchemy mapping (same field
names, so the service layer and schemas are unaffected):

    class Investigation(Base):
        __tablename__ = "investigations"
        id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
        ...
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4


class InvestigationStatus(str, Enum):
    """Lifecycle of an investigation.

    `str` mixin so the value serialises to a plain string in JSON and can be
    stored as a DB enum/varchar without conversion.
    """

    PENDING = "pending"  # accepted, not yet picked up
    RUNNING = "running"  # orchestrator is working through the steps
    COMPLETED = "completed"  # finished, results available
    FAILED = "failed"  # terminated with an error
    CANCELLED = "cancelled"  # stopped on user request


def _utcnow() -> datetime:
    """Timezone-aware UTC now. Never use naive datetimes in this codebase."""
    return datetime.now(timezone.utc)


@dataclass
class Investigation:
    """A single strategic investigation and its current state."""

    # --- Identity ---------------------------------------------------------
    id: UUID = field(default_factory=uuid4)

    # --- Input (what the PM asked) -----------------------------------------
    title: str = ""
    question: str = ""
    context: str | None = None
    tags: list[str] = field(default_factory=list)

    # --- Execution state --------------------------------------------------
    status: InvestigationStatus = InvestigationStatus.PENDING
    error: str | None = None

    # --- Output (populated by the orchestrator in a later sprint) ---------
    summary: str | None = None
    findings: list[str] = field(default_factory=list)

    # --- Auditing ---------------------------------------------------------
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)

    def touch(self) -> None:
        """Mark the record as modified. Called on every state transition."""
        self.updated_at = _utcnow()
