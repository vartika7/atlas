# PM Atlas

An AI Product Strategy Platform. A PM asks a strategic question — _"why did
activation drop for self-serve signups in Q2?"_ — and Atlas breaks it into
research steps, runs them, and returns findings backed by evidence.

## Repository layout

```
atlas/
├── backend/     FastAPI service — the Investigation API
└── frontend/    React app (not yet committed)
```

Setup, endpoints, architecture and tests for the service live in
**[backend/README.md](backend/README.md)** — start there to run anything.

## Status

Early. Sprint 1 built the Investigation API's structure; the intelligence
behind it is not wired up yet.

- ✅ Six investigation endpoints, layered architecture, 13 tests
- ❌ No persistence — state is in-memory and lost on restart
- ❌ No auth — every endpoint is public
- ❌ No orchestration — a question is stored as `pending` and never progresses

Read that as a scaffold, not a product.

## Roadmap

| Sprint | Work                                                             | Status  |
| ------ | ---------------------------------------------------------------- | ------- |
| 1      | Investigation API scaffold — layered structure, endpoints, tests | ✅ Done |
| 2      | SQLAlchemy models + Alembic; swap the in-memory store for a repo | Next    |
| 3      | Supabase auth; scope investigations to a user/workspace          | Planned |
| 4      | LangGraph plan execution via OpenRouter; progress streaming      | Planned |

## Tech stack

Python · FastAPI · Pydantic · SQLAlchemy · Supabase · LangGraph · OpenRouter · React
