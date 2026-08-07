# PM Atlas — Backend

FastAPI backend for PM Atlas, an AI Product Strategy Platform.

The Investigation API is scaffolded and routable. Handlers, schemas and the
service interface are real; the orchestration and persistence bodies are
placeholders backed by a process-local dict.

## Quickstart

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt          # add -r requirements-dev.txt for tests
cp env.example .env                      # optional; defaults work as-is

uvicorn app.main:app --reload --port 8000
```

- Swagger UI — http://localhost:8000/docs
- Health — http://localhost:8000/health

## Architecture

Requests flow in one direction. Each layer only knows about the one below it.

```
HTTP  ->  app/api/         routers: validate, delegate, map errors to status codes
          app/schemas/     Pydantic request/response contracts (the public API)
          app/services/    business logic + orchestration (no HTTP awareness)
          app/models/      domain entities (becomes the SQLAlchemy mapping)
          app/core/        config and other cross-cutting concerns
```

| File                           | Responsibility                                                |
| ------------------------------ | ------------------------------------------------------------- |
| `app/main.py`                  | Composition root: builds the app, CORS, routers, health check |
| `app/core/config.py`           | Typed settings from env/`.env`, cached singleton              |
| `app/api/investigations.py`    | Investigation endpoints; no business logic                    |
| `app/schemas/investigation.py` | Request/response contract for the frontend                    |
| `app/services/orchestrator.py` | Investigation lifecycle                                       |
| `app/models/investigation.py`  | `Investigation` entity + `InvestigationStatus`                |

Two rules worth keeping:

1. **Schemas are not models.** The API contract lives in `schemas/`, the internal
   shape in `models/`. Changing one shouldn't silently change the other.
2. **Services never import from `api/`.** Domain errors such as
   `InvestigationNotFoundError` are raised by the service and translated to HTTP
   in the router, so the service stays reusable from a worker or CLI.

## Endpoints

All mounted under `/api/v1`.

| Method   | Path                          | Purpose                         |
| -------- | ----------------------------- | ------------------------------- |
| `POST`   | `/investigations`             | Start a new investigation (201) |
| `GET`    | `/investigations`             | List, `?status=&limit=&offset=` |
| `GET`    | `/investigations/{id}`        | Fetch one                       |
| `PATCH`  | `/investigations/{id}`        | Update editable fields          |
| `POST`   | `/investigations/{id}/cancel` | Cancel a run                    |
| `DELETE` | `/investigations/{id}`        | Delete (204)                    |

### Request contract

The request models the product: a PM names a company and may attach evidence.
`company` is the only required field.

```bash
curl -X POST http://localhost:8000/api/v1/investigations \
  -H 'Content-Type: application/json' \
  -d '{"company":"Linear",
       "uploaded_sources":{"funnel":["q2-funnel.csv"]},
       "context":"Activation dipped after the Q2 pricing change."}'
```

`uploaded_sources` is metadata only — filenames keyed by source id. File
contents are not uploaded.

The orchestration layer reasons about a titled question, so the service derives
`title`, `question` and `tags` from the company. They are returned on the
response but cannot be set by a client:

```json
{
  "id": "ce7a88f7-…",
  "company": "Linear",
  "title": "Linear product investigation",
  "question": "What should Linear build next, and why?",
  "tags": ["company:linear"],
  "status": "pending",
  "progress": 0,
  "current_stage": null
}
```

### Polling

`POST` returns 201 immediately at `pending`; the run proceeds in a background
task. Poll `GET /investigations/{id}` until `status` is terminal
(`completed`, `failed` or `cancelled`), reading `progress` (0–100) and
`current_stage` as it advances:

```
pending → running → completed
          discovering_sources → analyzing_evidence → generating_findings
          → prioritizing_opportunities → generating_strategy_report
```

On completion, `evidence_sources`, `key_findings`, `product_opportunities` and
`strategy_report` are populated. Stage cadence is `stage_duration_seconds`
(default 2.5s, so ~12.5s end to end).

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Known placeholders

- **State is in-memory** (`orchestrator.py::_store`) — lost on restart, so a
  `--reload` restart kills in-flight runs. Running uvicorn with multiple workers
  breaks polling outright: a poll may reach a worker whose store lacks that id.
- **No auth.** Every endpoint is public.
- **Results are deterministic placeholders**, not analysis. The lifecycle is
  real — stages, progress and failure handling all work — but no evidence is
  gathered and no model is called. `_apply_results()` is where that lands.
- **`cancel()` and `update()` skip state-transition rules** — you can currently
  cancel an already-completed investigation.
- **Uploads are metadata only.** `uploaded_sources` records filenames; no file
  content is transferred or stored.
