"""Investigation HTTP endpoints.

Responsibility
--------------
The transport layer for the Investigation resource. It only:
  1. validates input via the schemas,
  2. delegates to `InvestigationOrchestrator`,
  3. maps domain errors onto HTTP status codes.

No business logic lives here. If a handler grows past a few lines, the logic
belongs in the service.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.investigation import InvestigationStatus
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationList,
    InvestigationRead,
    InvestigationUpdate,
)
from app.services.orchestrator import (
    InvestigationNotFoundError,
    InvestigationOrchestrator,
    get_orchestrator,
)

router = APIRouter(prefix="/investigations", tags=["investigations"])

# Reused so the 404 shape is identical on every path that can raise it.
_NOT_FOUND_RESPONSE = {status.HTTP_404_NOT_FOUND: {"description": "Investigation not found"}}


@router.post(
    "",
    response_model=InvestigationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new investigation",
)
async def create_investigation(
    payload: InvestigationCreate,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> InvestigationRead:
    """Accept a strategic question and queue it for investigation."""
    investigation = await orchestrator.create(payload)
    return InvestigationRead.model_validate(investigation)


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
) -> InvestigationList:
    """Return a page of investigations, newest first."""
    rows, total = await orchestrator.list(status=status_filter, limit=limit, offset=offset)
    return InvestigationList(
        items=[InvestigationRead.model_validate(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{investigation_id}",
    response_model=InvestigationRead,
    responses=_NOT_FOUND_RESPONSE,
    summary="Get one investigation",
)
async def get_investigation(
    investigation_id: UUID,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> InvestigationRead:
    """Fetch a single investigation, including status and any results."""
    try:
        investigation = await orchestrator.get(investigation_id)
    except InvestigationNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return InvestigationRead.model_validate(investigation)


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
) -> InvestigationRead:
    """Patch the editable fields of an investigation."""
    try:
        investigation = await orchestrator.update(investigation_id, payload)
    except InvestigationNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return InvestigationRead.model_validate(investigation)


@router.post(
    "/{investigation_id}/cancel",
    response_model=InvestigationRead,
    responses=_NOT_FOUND_RESPONSE,
    summary="Cancel an investigation",
)
async def cancel_investigation(
    investigation_id: UUID,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator),
) -> InvestigationRead:
    """Stop a pending or running investigation."""
    try:
        investigation = await orchestrator.cancel(investigation_id)
    except InvestigationNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return InvestigationRead.model_validate(investigation)


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
    try:
        await orchestrator.delete(investigation_id)
    except InvestigationNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
