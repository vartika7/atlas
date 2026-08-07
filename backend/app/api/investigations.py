"""Investigation HTTP endpoints.

Responsibility
--------------
The transport layer for the Investigation resource. It only:
  1. validates input via the schemas,
  2. delegates to `InvestigationOrchestrator`,
  3. declares the response shape.

No business logic lives here. If a handler grows past a few lines, the logic
belongs in the service.

Two conventions keep these handlers to one or two lines each:

* **Handlers return domain objects, not schemas.** `response_model` performs
  the mapping — `InvestigationRead` sets `from_attributes=True`, so FastAPI
  converts the dataclass on the way out. One declared boundary per route
  instead of a `model_validate` call repeated in every handler.
* **Domain errors are not caught here.** `InvestigationNotFoundError` is
  translated to a 404 by the handler registered in `app/api/errors.py`.

Every endpoint that returns a body returns the same `InvestigationRead` shape —
including the lifecycle fields (`status`, `progress`, `current_stage`) — so a
client can poll any of them and parse the result identically.
"""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

from app.models.investigation import Investigation, InvestigationStatus
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationList,
    InvestigationRead,
    InvestigationUpdate,
)
from app.services.orchestrator import InvestigationOrchestrator, get_orchestrator

router = APIRouter(prefix="/investigations", tags=["investigations"])

# Documents the 404 that `app/api/errors.py` produces, so it appears in OpenAPI
# even though no handler raises it explicitly.
_NOT_FOUND_RESPONSE = {status.HTTP_404_NOT_FOUND: {"description": "Investigation not found"}}


@router.post(
    "",
    response_model=InvestigationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new investigation",
)
async def create_investigation(
    payload: InvestigationCreate,
    background_tasks: BackgroundTasks,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> Investigation:
    """Accept a strategic question and start investigating it.

    Returns 201 immediately at `pending`; the run proceeds in the background
    once the response has been sent. Clients poll
    `GET /investigations/{id}` for `status`, `progress` and `current_stage`.
    """
    investigation = await orchestrator.create(payload)
    background_tasks.add_task(orchestrator.run, investigation.id)
    return investigation


@router.get(
    "",
    response_model=InvestigationList,
    summary="List investigations",
)
async def list_investigations(
    status_filter: InvestigationStatus
    | None = Query(
        default=None,
        alias="status",
        description="Return only investigations in this state.",
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> dict[str, object]:
    """Return a page of investigations, newest first.

    `items` are domain objects; `response_model` maps each one through
    `InvestigationRead`, exactly as the single-object routes do.
    """
    rows, total = await orchestrator.list(status=status_filter, limit=limit, offset=offset)
    return {"items": rows, "total": total, "limit": limit, "offset": offset}


@router.get(
    "/{investigation_id}",
    response_model=InvestigationRead,
    responses=_NOT_FOUND_RESPONSE,
    summary="Get one investigation",
)
async def get_investigation(
    investigation_id: UUID,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> Investigation:
    """Fetch a single investigation, including lifecycle state and results.

    This is the polling endpoint: clients call it until `status` is terminal.
    """
    return await orchestrator.get(investigation_id)


@router.patch(
    "/{investigation_id}",
    response_model=InvestigationRead,
    responses=_NOT_FOUND_RESPONSE,
    summary="Update an investigation",
)
async def update_investigation(
    investigation_id: UUID,
    payload: InvestigationUpdate,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> Investigation:
    """Patch the editable fields of an investigation."""
    return await orchestrator.update(investigation_id, payload)


@router.post(
    "/{investigation_id}/cancel",
    response_model=InvestigationRead,
    responses=_NOT_FOUND_RESPONSE,
    summary="Cancel an investigation",
)
async def cancel_investigation(
    investigation_id: UUID,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> Investigation:
    """Stop a pending or running investigation."""
    return await orchestrator.cancel(investigation_id)


@router.delete(
    "/{investigation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_NOT_FOUND_RESPONSE,
    summary="Delete an investigation",
)
async def delete_investigation(
    investigation_id: UUID,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> None:
    """Remove an investigation. Returns 204 with no body."""
    await orchestrator.delete(investigation_id)
