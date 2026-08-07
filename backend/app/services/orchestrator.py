"""Investigation orchestration service.

Responsibility
--------------
The application layer: owns all investigation business rules and is the only
place that will talk to persistence and to the AI stack. It knows nothing about
HTTP — no `Request`, no `HTTPException`, no status codes. That keeps it unit
testable and reusable from a worker, CLI or scheduled job later.

`run()` executes the investigation lifecycle. It walks the stages in
`STAGE_ORDER`, publishing `status`, `progress` and `current_stage` as it goes so
clients can poll a live view, then writes deterministic results. There are no
AI calls and no external services — the stage timings simulate the shape of a
real run, and the results are derived from the investigation itself.
"""

import asyncio
from functools import lru_cache
from uuid import UUID

from app.core.config import get_settings
from app.models.investigation import (
    STAGE_ORDER,
    EvidenceSource,
    Investigation,
    InvestigationStage,
    InvestigationStatus,
    KeyFinding,
    ProductOpportunity,
)
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

    def __init__(self, stage_duration_seconds: float = 2.5) -> None:
        # In-memory repository. Process-local and lost on restart, which is a
        # deliberate constraint for now — see the README.
        self._store: dict[UUID, Investigation] = {}
        # Injected rather than read from global config inside `run()`: a hidden
        # settings lookup would make the lifecycle untestable without either
        # patching globals or waiting out the real cadence.
        self._stage_duration_seconds = stage_duration_seconds

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------
    async def create(self, payload: InvestigationCreate) -> Investigation:
        """Accept a new investigation and queue it for execution.

        Returns immediately at `PENDING`. The caller is responsible for
        scheduling `run()`, which keeps this method synchronous in effect and
        the endpoint's 201 fast.
        """
        company = payload.company.strip()
        investigation = Investigation(
            company=company,
            uploaded_sources=dict(payload.uploaded_sources),
            context=payload.context,
            status=InvestigationStatus.PENDING,
            **self._frame(company),
        )
        self._store[investigation.id] = investigation
        return investigation

    @staticmethod
    def _frame(company: str) -> dict[str, object]:
        """Derive the internal framing the orchestration layer reasons about.

        The product asks for a company; the stages need a titled question. That
        translation is business logic, so it lives here rather than being
        pushed onto clients as required request fields.
        """
        return {
            "title": f"{company} product investigation",
            "question": f"What should {company} build next, and why?",
            "tags": [f"company:{company.lower().replace(' ', '-')}"],
        }

    async def run(self, investigation_id: UUID) -> None:
        """Execute the investigation, publishing progress as it goes.

        Runs as a background task, so it must never raise: an unhandled error
        here would be swallowed by the event loop with nothing recorded. Any
        exception is captured onto the record as `FAILED` instead.

        Safe to lose a race — if the record was deleted or already cancelled,
        this returns quietly rather than resurrecting it.
        """
        investigation = self._store.get(investigation_id)
        if investigation is None:
            return

        # Already cancelled (or otherwise finished) before the task was picked
        # up. Starting would resurrect a terminal record.
        if investigation.status.is_terminal:
            return

        stage_seconds = self._stage_duration_seconds

        try:
            investigation.status = InvestigationStatus.RUNNING
            investigation.progress = 0
            investigation.touch()

            total = len(STAGE_ORDER)
            for index, stage in enumerate(STAGE_ORDER):
                # Re-read: the record may have been cancelled or deleted while
                # the previous stage was sleeping.
                current = self._store.get(investigation_id)
                if current is None or current.status is InvestigationStatus.CANCELLED:
                    return

                current.current_stage = stage
                current.touch()

                await asyncio.sleep(stage_seconds)

                # Progress reflects *completed* stages, so it reaches 100 only
                # once the final stage finishes.
                current.progress = round((index + 1) / total * 100)
                current.touch()

            final = self._store.get(investigation_id)
            if final is None or final.status is InvestigationStatus.CANCELLED:
                return

            self._apply_results(final)
            final.status = InvestigationStatus.COMPLETED
            final.progress = 100
            final.current_stage = None
            final.touch()

        except Exception as exc:  # noqa: BLE001 — background task must not escape
            failed = self._store.get(investigation_id)
            if failed is None:
                return
            failed.status = InvestigationStatus.FAILED
            failed.error = str(exc) or exc.__class__.__name__
            failed.current_stage = None
            failed.touch()

    async def update(self, investigation_id: UUID, payload: InvestigationUpdate) -> Investigation:
        """Patch the editable fields of an existing investigation.

        Renaming the company re-derives the framing, so `title` and `question`
        can never drift out of sync with the company they describe.
        """
        investigation = await self.get(investigation_id)

        changes = payload.model_dump(exclude_unset=True)
        if (company := changes.get("company")) is not None:
            changes["company"] = company = company.strip()
            changes.update(self._frame(company))

        for field_name, value in changes.items():
            setattr(investigation, field_name, value)
        investigation.touch()
        return investigation

    async def cancel(self, investigation_id: UUID) -> Investigation:
        """Request cancellation of a pending or running investigation.

        `run()` checks for this between stages and stops without writing
        results, so cancellation takes effect within one stage duration.
        """
        investigation = await self.get(investigation_id)
        investigation.status = InvestigationStatus.CANCELLED
        investigation.current_stage = None
        investigation.touch()
        return investigation

    async def delete(self, investigation_id: UUID) -> None:
        """Remove an investigation."""
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
        """Return a page of investigations plus the total match count."""
        rows = list(self._store.values())
        if status is not None:
            rows = [row for row in rows if row.status is status]
        rows.sort(key=lambda row: row.created_at, reverse=True)
        return rows[offset : offset + limit], len(rows)

    # ------------------------------------------------------------------
    # Result generation
    # ------------------------------------------------------------------
    @staticmethod
    def _apply_results(investigation: Investigation) -> None:
        """Write deterministic placeholder results onto a finished run.

        Deterministic on purpose: the same investigation always yields the same
        output, so tests can assert on it and the UI has stable data. This is
        where real analysis output will be written once orchestration exists.
        """
        subject = investigation.title

        investigation.evidence_sources = [
            EvidenceSource(name="Official website", kind="public", record_count=48),
            EvidenceSource(name="Pricing page", kind="public", record_count=12),
            EvidenceSource(name="Changelog", kind="public", record_count=126),
            EvidenceSource(name="G2 reviews", kind="public", record_count=418),
            EvidenceSource(name="Reddit discussions", kind="public", record_count=274),
            EvidenceSource(name="Competitor products", kind="public", record_count=7),
        ]

        investigation.key_findings = [
            KeyFinding(
                title="Onboarding drop-off concentrates before first value",
                detail=("Most abandonment happens between signup and the first " "meaningful action, not during signup itself."),
                confidence="high",
            ),
            KeyFinding(
                title="Pricing is the most cited objection in public reviews",
                detail=("Reviewers repeatedly describe the entry tier as poor value " "for small teams."),
                confidence="medium",
            ),
            KeyFinding(
                title="Integration gaps drive evaluation losses",
                detail=("Competitor comparisons consistently cite missing " "integrations as the deciding factor."),
                confidence="medium",
            ),
        ]

        investigation.product_opportunities = [
            ProductOpportunity(
                title="Guided onboarding to first value",
                rationale=("Addresses the largest measured drop-off with a change " "scoped to the activation path."),
                impact="high",
                confidence="high",
            ),
            ProductOpportunity(
                title="Usage-based entry tier",
                rationale=("Directly answers the most frequent pricing objection " "without discounting existing plans."),
                impact="high",
                confidence="medium",
            ),
            ProductOpportunity(
                title="Close the top three integration gaps",
                rationale=("Removes the most commonly cited reason for choosing a " "competitor during evaluation."),
                impact="medium",
                confidence="medium",
            ),
        ]

        investigation.strategy_report = (
            f"## {subject}\n\n"
            f"{investigation.question}\n\n"
            "Evidence points to activation, not acquisition, as the binding "
            "constraint. Guided onboarding and a usage-based entry tier address "
            "the two highest-confidence findings and are recommended for the "
            "next planning cycle. Integration coverage is a slower, lower-"
            "confidence bet worth sequencing behind them."
        )


# ----------------------------------------------------------------------
# Dependency wiring
# ----------------------------------------------------------------------
# One instance per process, which is what makes the in-memory store behave
# consistently across requests. Once persistence lands, this becomes a
# per-request factory that receives a DB session.
@lru_cache
def get_orchestrator() -> InvestigationOrchestrator:
    """FastAPI dependency provider — override this in tests."""
    return InvestigationOrchestrator(stage_duration_seconds=get_settings().stage_duration_seconds)
