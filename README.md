# PM Atlas

An AI Product Strategy Platform. A PM asks a strategic question — _"why did
activation drop for self-serve signups in Q2?"_ — and Atlas breaks it into
research steps, runs them, and returns findings backed by evidence.

> **Status: early.** The backend Investigation API is scaffolded and running.
> Orchestration and persistence are deliberate placeholders — see
> [Roadmap](#roadmap).

## Repository layout

```
atlas/
├── backend/     FastAPI service — the Investigation API
└── frontend/    React app (not yet committed)
```

## Getting started

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Swagger UI — http://localhost:8000/docs
- Health — http://localhost:8000/health

Full setup, architecture notes and the endpoint reference live in
[backend/README.md](backend/README.md).

## Architecture

The backend is layered so the AI stack can drop in without reshaping the API
contract. Dependencies point inward — inner layers don't know the outer ones
exist.

```
HTTP → api/        routers: validate, delegate, map errors to status codes
       schemas/    Pydantic request/response contracts (the public API)
       services/   business logic + orchestration (no HTTP awareness)
       models/     domain entities (becomes the SQLAlchemy mapping)
       core/       config and other cross-cutting concerns
```

Two rules worth keeping: **schemas are not models** (the API contract is
declared separately from internal shape, so a new DB column can't become an
accidental breaking change), and **services never import from `api/`** (domain
errors are translated to HTTP in the router, so the service stays callable from
a worker or CLI).

## API

All endpoints are mounted under `/api/v1`.

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

## What is not built yet

Worth stating plainly so nobody mistakes the scaffold for a working product:

- **State is in-memory** and lost on restart.
- **No auth.** Every endpoint is public.
- **No real orchestration.** `POST` stores the question at `pending`; nothing
  advances it, and `summary`/`findings` stay empty.
- **No frontend in this repo yet.**

## Roadmap

| Sprint | Work                                                                   | Status  |
| ------ | ---------------------------------------------------------------------- | ------- |
| 1      | Investigation API scaffold — layered structure, 6 endpoints, tests     | ✅ Done |
| 2      | SQLAlchemy models + Alembic; swap the in-memory store for a repository | Next    |
| 3      | Supabase auth; scope investigations to a user/workspace                | Planned |
| 4      | LangGraph plan execution via OpenRouter; progress streaming            | Planned |

## Tech stack

Python · FastAPI · Pydantic · SQLAlchemy · Supabase · LangGraph · OpenRouter · React

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```
