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

```bash
curl -X POST http://localhost:8000/api/v1/investigations \
  -H 'Content-Type: application/json' \
  -d '{"title":"Self-serve activation drop",
       "question":"Why did activation drop for self-serve signups in Q2?",
       "tags":["activation","growth"]}'
```

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Known placeholders

- **State is in-memory** (`orchestrator.py::_store`) — lost on restart.
- **No auth.** Every endpoint is public.
- **No real orchestration.** `create()` stores the request at `pending`; nothing
  advances it. `summary` and `findings` stay empty.
- **`cancel()` and `update()` skip state-transition rules** — you can currently
  cancel an already-completed investigation.
