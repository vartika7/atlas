"""Smoke tests for the Investigation API scaffold.

These assert the wiring, not behaviour: the app boots, routes are mounted, the
schemas validate, and domain errors surface as the right status codes. Real
behavioural tests arrive with the orchestration logic.

Each test builds a fresh app *and* a fresh orchestrator, so the placeholder
in-memory store can't leak state between tests.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.services.orchestrator import InvestigationOrchestrator, get_orchestrator

VALID_PAYLOAD = {
    "title": "Self-serve activation drop",
    "question": "Why did activation drop for self-serve signups in Q2?",
    "tags": ["activation", "growth"],
}

MISSING_ID = "00000000-0000-0000-0000-000000000000"


@pytest.fixture
def client() -> TestClient:
    app = create_app()
    # One orchestrator per test, shared across that test's requests: the
    # override must return the *same* instance, otherwise each request gets a
    # fresh placeholder store and nothing appears to persist.
    orchestrator = InvestigationOrchestrator()
    app.dependency_overrides[get_orchestrator] = lambda: orchestrator
    return TestClient(app)


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_is_generated(client: TestClient) -> None:
    """Catches schema/annotation mistakes that only surface at spec build time."""
    assert client.get("/openapi.json").status_code == 200


def test_create_returns_201_and_pending_status(client: TestClient) -> None:
    response = client.post("/api/v1/investigations", json=VALID_PAYLOAD)
    assert response.status_code == 201

    body = response.json()
    assert body["status"] == "pending"
    assert body["title"] == VALID_PAYLOAD["title"]
    # Results are unpopulated until the orchestrator runs.
    assert body["summary"] is None
    assert body["findings"] == []


def test_create_rejects_short_question(client: TestClient) -> None:
    response = client.post(
        "/api/v1/investigations",
        json={"title": "abc", "question": "too short"},
    )
    assert response.status_code == 422


def test_create_then_get_roundtrip(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    fetched = client.get(f"/api/v1/investigations/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == created


def test_list_filters_by_status(client: TestClient) -> None:
    client.post("/api/v1/investigations", json=VALID_PAYLOAD)

    assert client.get("/api/v1/investigations").json()["total"] == 1
    assert client.get("/api/v1/investigations?status=pending").json()["total"] == 1
    assert client.get("/api/v1/investigations?status=failed").json()["total"] == 0


def test_patch_updates_only_supplied_fields(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()

    patched = client.patch(
        f"/api/v1/investigations/{created['id']}",
        json={"title": "Activation drop Q2"},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Activation drop Q2"
    assert patched.json()["question"] == created["question"]


def test_cancel_moves_to_cancelled(client: TestClient) -> None:
    created = client.post("/api/v1/investigations", json=VALID_PAYLOAD).json()
    response = client.post(f"/api/v1/investigations/{created['id']}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


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
