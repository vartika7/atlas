"""Domain models for an Investigation.

Responsibility
--------------
Describes what an Investigation *is* inside our system, independent of HTTP
(see `app/schemas/investigation.py`) and independent of storage.

An Investigation is one strategic question a PM asks Atlas — "why is activation
dropping for self-serve signups?" — which the orchestrator works through in
stages, publishing progress as it goes.

These are plain dataclasses so nothing depends on a database. The field names
are chosen to survive being mapped onto SQLAlchemy later without touching the
service layer or the schemas.
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
    RUNNING = "running"  # orchestrator is working through the stages
    COMPLETED = "completed"  # finished, results available
    FAILED = "failed"  # terminated with an error
    CANCELLED = "cancelled"  # stopped on user request

    @property
    def is_terminal(self) -> bool:
        """True once the investigation can no longer change state.

        Clients poll until this is true, so it belongs to the domain rather
        than being re-derived by every caller.
        """
        return self in _TERMINAL_STATUSES


_TERMINAL_STATUSES = frozenset(
    {
        InvestigationStatus.COMPLETED,
        InvestigationStatus.FAILED,
        InvestigationStatus.CANCELLED,
    }
)


class InvestigationStage(str, Enum):
    """The ordered steps an investigation works through while `RUNNING`.

    Values are stable identifiers, not display copy — clients map them to their
    own labels and icons, so wording can change without an API change.
    """

    DISCOVERING_SOURCES = "discovering_sources"
    ANALYZING_EVIDENCE = "analyzing_evidence"
    GENERATING_FINDINGS = "generating_findings"
    PRIORITIZING_OPPORTUNITIES = "prioritizing_opportunities"
    GENERATING_STRATEGY_REPORT = "generating_strategy_report"


# Execution order. The orchestrator walks this list; progress is derived from
# the index, so adding a stage automatically rescales the percentages.
STAGE_ORDER: tuple[InvestigationStage, ...] = (
    InvestigationStage.DISCOVERING_SOURCES,
    InvestigationStage.ANALYZING_EVIDENCE,
    InvestigationStage.GENERATING_FINDINGS,
    InvestigationStage.PRIORITIZING_OPPORTUNITIES,
    InvestigationStage.GENERATING_STRATEGY_REPORT,
)


@dataclass
class EvidenceSource:
    """One place Atlas gathered evidence from."""

    name: str
    kind: str  # "public" | "internal"
    record_count: int


@dataclass
class KeyFinding:
    """An observation supported by the collected evidence."""

    title: str
    detail: str
    confidence: str  # "high" | "medium" | "low"


@dataclass
class ProductOpportunity:
    """A prioritised recommendation derived from the findings."""

    title: str
    rationale: str
    impact: str  # "high" | "medium" | "low"
    confidence: str  # "high" | "medium" | "low"


def _utcnow() -> datetime:
    """Timezone-aware UTC now. Never use naive datetimes in this codebase."""
    return datetime.now(timezone.utc)


@dataclass
class Investigation:
    """A single strategic investigation and its current state."""

    # --- Identity ---------------------------------------------------------
    id: UUID = field(default_factory=uuid4)

    # --- Input (what the product collects) --------------------------------
    company: str = ""
    uploaded_sources: dict[str, list[str]] = field(default_factory=dict)
    context: str | None = None

    # --- Derived framing (set by the service, never by a client) ----------
    # The orchestration layer reasons in terms of a titled question, but that
    # is an implementation detail: clients supply a company and read these back.
    title: str = ""
    question: str = ""
    tags: list[str] = field(default_factory=list)

    # --- Execution state --------------------------------------------------
    status: InvestigationStatus = InvestigationStatus.PENDING
    progress: int = 0  # 0–100
    current_stage: InvestigationStage | None = None
    error: str | None = None

    # --- Output (populated when the run completes) ------------------------
    evidence_sources: list[EvidenceSource] = field(default_factory=list)
    key_findings: list[KeyFinding] = field(default_factory=list)
    product_opportunities: list[ProductOpportunity] = field(default_factory=list)
    strategy_report: str | None = None

    # --- Auditing ---------------------------------------------------------
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)

    def touch(self) -> None:
        """Mark the record as modified. Called on every state transition."""
        self.updated_at = _utcnow()
