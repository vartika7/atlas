"""Investigation orchestration service.

Responsibility
--------------
The application layer: owns all investigation business rules and is the only
place that will talk to persistence and to the AI stack. It knows nothing about
HTTP — no `Request`, no `HTTPException`, no status codes. That keeps it unit
testable and reusable from a worker, CLI or scheduled job later.

Eventually this class will:
  * persist investigations via SQLAlchemy / Supabase,
  * compile the question into a LangGraph plan,
  * execute that plan against models served through OpenRouter,
  * stream progress back to the API layer.

Sprint 1 scope: method signatures + an in-memory store, so the endpoints are
walkable in Swagger. Every method body below is a placeholder.
"""

from uuid import UUID

from app.models.investigation import Investigation, InvestigationStatus
from app.schemas.investigation import InvestigationCreate, InvestigationUpdate


class InvestigationNotFoundError(Exception):
    """Raised when an investigation id does not exist.

    A domain-level error on purpose: the API layer translates it into a 404 so
    this module stays transport agnostic.
    """

    def __init__(self, investigation_id: UUID) -> None:
        self.investigation_id = investigation_id
        super().__init__(f"Investigation {investigation_id} not found")


class InvestigationOrchestrator:
    """Coordinates the lifecycle of investigations."""

    def __init__(self) -> None:
        # PLACEHOLDER STORE — process-local and lost on restart.
        # Replaced by a repository/session dependency in the persistence sprint.
        self._store: dict[UUID, Investigation] = {}

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------
    async def create(self, payload: InvestigationCreate) -> Investigation:
        """Accept a new investigation and queue it for execution.

        TODO(sprint-2): persist the row, then hand off to the LangGraph runner
        as a background task and return immediately (202-style semantics).
        """
        investigation = Investigation(
            title=payload.title,
            question=payload.question,
            context=payload.context,
            tags=list(payload.tags),
            status=InvestigationStatus.PENDING,
        )
        self._store[investigation.id] = investigation
        return investigation

    async def update(self, investigation_id: UUID, payload: InvestigationUpdate) -> Investigation:
        """Patch the editable fields of an existing investigation.

        TODO(sprint-2): reject edits once the run has started, and persist.
        """
        investigation = await self.get(investigation_id)
        for field_name, value in payload.model_dump(exclude_unset=True).items():
            setattr(investigation, field_name, value)
        investigation.touch()
        return investigation

    async def cancel(self, investigation_id: UUID) -> Investigation:
        """Request cancellation of a running investigation.

        TODO(sprint-2): signal the LangGraph run to stop and release resources.
        """
        investigation = await self.get(investigation_id)
        investigation.status = InvestigationStatus.CANCELLED
        investigation.touch()
        return investigation

    async def delete(self, investigation_id: UUID) -> None:
        """Remove an investigation.

        TODO(sprint-2): soft-delete instead, so history is auditable.
        """
        await self.get(investigation_id)  # raises if missing
        self._store.pop(investigation_id, None)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    async def get(self, investigation_id: UUID) -> Investigation:
        """Return one investigation or raise `InvestigationNotFoundError`."""
        investigation = self._store.get(investigation_id)
        if investigation is None:
            raise InvestigationNotFoundError(investigation_id)
        return investigation

    async def list(
        self,
        *,
        status: InvestigationStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Investigation], int]:
        """Return a page of investigations plus the total match count.

        TODO(sprint-2): push filtering, ordering and counting into SQL.
        """
        rows = list(self._store.values())
        if status is not None:
            rows = [row for row in rows if row.status is status]
        rows.sort(key=lambda row: row.created_at, reverse=True)
        return rows[offset : offset + limit], len(rows)


# ----------------------------------------------------------------------
# Dependency wiring
# ----------------------------------------------------------------------
# One instance per process, which is what makes the placeholder in-memory store
# behave consistently across requests. Once persistence lands, this becomes a
# per-request factory that receives a DB session.
_orchestrator = InvestigationOrchestrator()


def get_orchestrator() -> InvestigationOrchestrator:
    """FastAPI dependency provider — override this in tests."""
    return _orchestrator
