"""Tests for the Investigation API.

Two layers here:

* **API tests** drive the app through `TestClient`. Starlette runs background
  tasks synchronously after the response is returned, so by the time
  `client.post(...)` hands back a response the investigation has already run to
  completion. That makes the full lifecycle observable without sleeping — as
  long as `stage_duration_seconds` is 0.
* **Service tests** call `InvestigationOrchestrator` directly to observe states
  the API can't easily catch mid-flight, and to exercise failure handling.

Each test builds a fresh app *and* a fresh orchestrator, so the in-memory store
can't leak between tests.
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import create_app
from app.models.investigation import STAGE_ORDER, InvestigationStatus
from app.schemas.investigation import InvestigationCreate
import app.services.orchestrator as orchestrator_module
from app.services.orchestrator import (
    InvestigationNotFoundError,
    InvestigationOrchestrator,
    get_orchestrator,
)

VALID_PAYLOAD = {"company": "Linear"}

MISSING_ID = "00000000-0000-0000-0000-000000000000"


@pytest.fixture
def instant_settings() -> Settings:
    """Settings with zero-length stages so a run completes immediately."""
    return Settings(stage_duration_seconds=0.0)


@pytest.fixture
def client(instant_settings: Settings) -> TestClient:
    app = create_app(instant_settings)
    # One orchestrator per test, shared across that test's requests: the
    # override must return the *same* instance, otherwise each request gets a
    # fresh store and nothing appears to persist.
    orchestrator = InvestigationOrchestrator(stage_duration_seconds=0.0)
    app.dependency_overrides[get_orchestrator] = lambda: orchestrator
    app.dependency_overrides[get_settings] = lambda: instant_settings
    return TestClient(app)


# ----------------------------------------------------------------------
# Health and wiring
# ----------------------------------------------------------------------
def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_is_generated(client: TestClient) -> None:
    """Catches schema/annotation mistakes that only surface at spec build time."""
    assert client.get("/openapi.json").status_code == 200


# ----------------------------------------------------------------------
# Creation
# ----------------------------------------------------------------------
def test_create_returns_201(client: TestClient) -> None:
    response = client.post("/api/v1/investigations", json=VALID_PAYLOAD)
    assert response.status_code == 201

    body = response.json()
    assert body["company"] == "Linear"
    assert body["progress"] == 0
    assert body["current_stage"] is None
    assert body["error"] is None
    # Results are unpopulated at creation time.
    assert body["evidence_sources"] == []
    assert body["key_findings"] == []
    assert body["product_opportunities"] == []
    assert body["strategy_report"] is None


def test_create_requires_company(client: TestClient) -> None:
    assert client.post("/api/v1/investigations", json={}).status_code == 422
    assert (
        client.post("/api/v1/investigations", json={"company": ""}).status_code == 422
    )


def test_create_derives_title_and_question_from_company(client: TestClient) -> None:
    """The product collects a company; the service supplies the framing."""
    body = client.post("/api/v1/investigations", json={"company": "Linear"}).json()

    assert body["title"] == "Linear product investigation"
    assert body["question"] == "What should Linear build next, and why?"
    assert body["tags"] == ["company:linear"]


def test_create_accepts_uploaded_sources_and_context(client: TestClient) -> None:
    """Optional evidence metadata round-trips; file contents are not uploaded."""
    payload = {
        "company": "Linear",
        "uploaded_sources": {"funnel": ["q2-funnel.csv"]},
        "context": "Activation dipped after the Q2 pricing change.",
    }
    body = client.post("/api/v1/investigations", json=payload).json()

    assert body["uploaded_sources"] == {"funnel": ["q2-funnel.csv"]}
    assert body["context"] == payload["context"]


def test_create_rejects_client_supplied_framing(client: TestClient) -> None:
    """title/question are not part of the public request contract."""
    body = client.post(
        "/api/v1/investigations",
        json={"company": "Linear", "title": "hand-written", "question": "ignored?"},
    ).json()

    assert body["title"] == "Linear product investigation"


# ----------------------------------------------------------------------
# Background lifecycle (via the API)
# ----------------------------------------------------------------------
def test_background_task_runs_to_completion(client: TestClient) -> None:
    """Starlette flushes background tasks before the response context exits."""
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()

    polled = client.get(f"/api/v1/investigations/{created['id']}").json()
    assert polled["status"] == InvestigationStatus.COMPLETED.value
    assert polled["progress"] == 100
    assert polled["current_stage"] is None


def test_completed_investigation_has_results(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    body = client.get(f"/api/v1/investigations/{created['id']}").json()

    assert len(body["evidence_sources"]) == 6
    assert len(body["key_findings"]) == 3
    assert len(body["product_opportunities"]) == 3
    assert "Linear product investigation" in body["strategy_report"]

    # Result shapes match the documented contract.
    assert set(body["evidence_sources"][0]) == {"name", "kind", "record_count"}
    assert set(body["key_findings"][0]) == {"title", "detail", "confidence"}
    assert set(body["product_opportunities"][0]) == {
        "title",
        "rationale",
        "impact",
        "confidence",
    }


def test_results_are_deterministic(client: TestClient) -> None:
    """Same input, same output — no randomness in the placeholder results."""
    first = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    second = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()

    a = client.get(f"/api/v1/investigations/{first['id']}").json()
    b = client.get(f"/api/v1/investigations/{second['id']}").json()

    assert a["key_findings"] == b["key_findings"]
    assert a["product_opportunities"] == b["product_opportunities"]
    assert a["strategy_report"] == b["strategy_report"]


def test_polling_endpoint_reflects_terminal_state(client: TestClient) -> None:
    """The shape a polling client depends on."""
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    body = client.get(f"/api/v1/investigations/{created['id']}").json()

    assert body["id"] == created["id"]
    assert InvestigationStatus(body["status"]).is_terminal
    assert body["updated_at"] >= created["updated_at"]


# ----------------------------------------------------------------------
# Background lifecycle (via the service, for mid-flight states)
# ----------------------------------------------------------------------
@pytest.mark.asyncio
async def test_progress_advances_through_every_stage(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Observe state at each stage boundary.

    Replacing the sleep with a recorder gives one deterministic observation per
    stage. Racing a real task with `asyncio.sleep(0)` would depend on event-loop
    scheduling and produce a flaky assertion.
    """
    orchestrator = InvestigationOrchestrator(stage_duration_seconds=0.0)
    investigation = await orchestrator.create(InvestigationCreate(**VALID_PAYLOAD))

    observed: list[tuple[str | None, int]] = []

    async def recording_sleep(_seconds: float) -> None:
        stage = investigation.current_stage
        observed.append((stage.value if stage else None, investigation.progress))

    monkeypatch.setattr(orchestrator_module.asyncio, "sleep", recording_sleep)

    await orchestrator.run(investigation.id)

    # Every stage is entered, in order.
    assert [stage for stage, _ in observed] == [s.value for s in STAGE_ORDER]
    # Progress on entering each stage reflects the stages already finished.
    assert [progress for _, progress in observed] == [0, 20, 40, 60, 80]
    assert investigation.status is InvestigationStatus.COMPLETED
    assert investigation.progress == 100


@pytest.mark.asyncio
async def test_run_sets_failed_on_exception(monkeypatch: pytest.MonkeyPatch) -> None:
    """A crash mid-run is recorded on the record, not swallowed."""
    orchestrator = InvestigationOrchestrator(stage_duration_seconds=0.0)
    investigation = await orchestrator.create(InvestigationCreate(**VALID_PAYLOAD))

    def explode(_: object) -> None:
        raise RuntimeError("stage engine unavailable")

    monkeypatch.setattr(InvestigationOrchestrator, "_apply_results", staticmethod(explode))

    await orchestrator.run(investigation.id)

    assert investigation.status is InvestigationStatus.FAILED
    assert investigation.error == "stage engine unavailable"
    assert investigation.current_stage is None


@pytest.mark.asyncio
async def test_run_on_missing_id_is_a_noop() -> None:
    """Losing a race with delete must not raise inside a background task."""
    orchestrator = InvestigationOrchestrator(stage_duration_seconds=0.0)
    await orchestrator.run(uuid4())  # must not raise


@pytest.mark.asyncio
async def test_cancel_stops_the_run_before_results() -> None:
    orchestrator = InvestigationOrchestrator(stage_duration_seconds=0.0)
    investigation = await orchestrator.create(InvestigationCreate(**VALID_PAYLOAD))

    await orchestrator.cancel(investigation.id)
    await orchestrator.run(investigation.id)

    assert investigation.status is InvestigationStatus.CANCELLED
    assert investigation.strategy_report is None
    assert investigation.product_opportunities == []


# ----------------------------------------------------------------------
# CRUD surface
# ----------------------------------------------------------------------
def test_create_then_get_roundtrip(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    fetched = client.get(f"/api/v1/investigations/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]


def test_list_filters_by_status(client: TestClient) -> None:
    client.post("/api/v1/investigations", json=VALID_PAYLOAD)

    assert client.get("/api/v1/investigations").json()["total"] == 1
    # The run finished during the POST, so it is completed rather than pending.
    assert client.get("/api/v1/investigations?status=completed").json()["total"] == 1
    assert client.get("/api/v1/investigations?status=pending").json()["total"] == 0


def test_patch_updates_only_supplied_fields(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()

    patched = client.patch(
        f"/api/v1/investigations/{created['id']}",
        json={"company": "Vercel"},
    )
    assert patched.status_code == 200
    assert patched.json()["company"] == "Vercel"
    # Framing is re-derived so it cannot drift from the company it describes.
    assert patched.json()["title"] == "Vercel product investigation"
    assert patched.json()["context"] == created["context"]


def test_cancel_moves_to_cancelled(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    response = client.post(f"/api/v1/investigations/{created['id']}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == InvestigationStatus.CANCELLED.value


def test_delete_then_missing(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    assert client.delete(f"/api/v1/investigations/{created['id']}").status_code == 204
    assert client.delete(f"/api/v1/investigations/{created['id']}").status_code == 404


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", f"/api/v1/investigations/{MISSING_ID}"),
        ("patch", f"/api/v1/investigations/{MISSING_ID}"),
        ("post", f"/api/v1/investigations/{MISSING_ID}/cancel"),
        ("delete", f"/api/v1/investigations/{MISSING_ID}"),
    ],
)
def test_unknown_id_returns_404(client: TestClient, method: str, path: str) -> None:
    kwargs = {"json": {}} if method == "patch" else {}
    assert getattr(client, method)(path, **kwargs).status_code == 404


@pytest.mark.asyncio
async def test_get_raises_domain_error_for_unknown_id() -> None:
    """The service raises a domain error; only the router knows about 404."""
    orchestrator = InvestigationOrchestrator(stage_duration_seconds=0.0)
    with pytest.raises(InvestigationNotFoundError):
        await orchestrator.get(uuid4())
