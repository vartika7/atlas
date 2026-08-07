# PM Atlas

An AI Product Strategy Platform. A PM asks _"what should we build next, and
why?"_ — Atlas gathers evidence from internal product data and the open web,
investigates the signals, and returns prioritised, explainable opportunities.

Not a chatbot. A decision tool that shows its working.

> **Current state:** the frontend and backend are developed independently. The
> frontend renders entirely from mock data, while the backend exposes an
> Investigation API with placeholder business logic. **No frontend requests
> reach the backend.** See [Implementation status](#implementation-status).

## Repository structure

```
atlas/
├── frontend/    TanStack Start + React 19 client  → frontend/README.md
└── backend/     FastAPI Investigation API         → backend/README.md
```

Each package has its own README with setup, commands and detail. This file
covers the project as a whole.

## Frontend architecture

A server-rendered React app, not a plain SPA.

```
src/server.ts     worker entry — wraps SSR, catches render errors
src/start.ts      error + CSRF middleware
src/router.tsx    router construction; creates the QueryClient
src/routes/       file-based routes → routeTree.gen.ts (generated)
  index.tsx       /            landing
  investigate.tsx /investigate 4-step wizard
  overview.tsx    /overview    opportunity dashboard
```

**Stack:** TanStack Start (SSR) · TanStack Router · TanStack Query · React 19 ·
Vite 8 · Tailwind CSS 4 · shadcn/ui + Radix · TypeScript strict · Bun · nitro
(Cloudflare Workers target).

Every screen renders from typed mock data in
`src/components/atlas/data/investigation.ts`. `QueryClient` is created and
provided at the root, but no `useQuery` or `useMutation` call exists.

Detail: **[frontend/README.md](frontend/README.md)**

## Backend architecture

Layered, with dependencies pointing inward — inner layers don't know the outer
ones exist.

```
HTTP → api/       routers: validate, delegate, map errors to status codes
       schemas/   Pydantic request/response contracts (the public API)
       services/  business logic + orchestration (no HTTP awareness)
       models/    domain entities
       core/      config and other cross-cutting concerns
```

**Stack:** Python 3.10+ · FastAPI · Pydantic v2 · pytest.

Two rules hold the structure together:

1. **Schemas are not models.** The API contract lives in `schemas/`, internal
   shape in `models/`, so a change to one doesn't silently change the other.
2. **Services never import from `api/`.** Domain errors like
   `InvestigationNotFoundError` are raised by the service and translated to HTTP
   in the router, keeping the service callable from a worker or CLI.

Six endpoints are live under `/api/v1` (create, list, get, patch, cancel,
delete). Business logic is unimplemented.

Detail: **[backend/README.md](backend/README.md)**

## Local development

Two services, two terminals.

```bash
# Terminal 1 — backend  → http://localhost:8000
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend → http://localhost:8080
cd frontend
bun install
bun run dev
```

| Service    | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:8080        |
| Backend    | http://localhost:8000        |
| Swagger UI | http://localhost:8000/docs   |
| Health     | http://localhost:8000/health |

Requires Python 3.10+ and [Bun](https://bun.sh). No environment variables are
needed — both services run on defaults.

Tests: `cd backend && pytest` (13 pass). The frontend has no test suite.

## Implementation status

| Area                    | State                                                          |
| ----------------------- | -------------------------------------------------------------- |
| Frontend UI             | ✅ Landing, wizard and dashboard built                         |
| Frontend data           | ⚠️ Mock only — no API calls anywhere                           |
| Backend API surface     | ✅ 6 endpoints, validation, error mapping, 13 tests            |
| Backend persistence     | ❌ In-memory dict; state lost on restart                       |
| Auth                    | ❌ None — every endpoint is public                             |
| AI orchestration        | ❌ None — an investigation is stored `pending` and never moves |
| Frontend ↔ backend link | ❌ Not connected                                               |

## Known gaps between the two halves

Both were built independently, and two concrete incompatibilities exist today:

- **CORS.** The frontend dev server serves `http://localhost:8080`. The
  backend's `cors_origins` in `backend/app/core/config.py` lists only
  `http://localhost:5173` and `http://localhost:3000`, so browser calls from the
  running frontend would be rejected.
- **Contract mismatch.** The backend's `InvestigationCreate` requires `title`,
  `question`, `context` and `tags`. The wizard collects a company name and a
  list of filenames, and no `question` field exists in the UI.

## Tech stack

**Frontend** — TanStack Start · React 19 · Vite 8 · Tailwind CSS 4 · shadcn/ui ·
TypeScript · Bun

**Backend** — Python · FastAPI · Pydantic · pytest
