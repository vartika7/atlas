# PM Atlas — Frontend

The React client for PM Atlas. A PM enters a company, and the UI presents
prioritised, explainable product opportunities.

> **The interface runs entirely on mock data.** It makes no calls to the
> FastAPI backend — see [Data layer](#data-layer).

## Tech stack

| Concern         | Choice                                                    |
| --------------- | --------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) 1.168 (SSR)  |
| Routing         | TanStack Router 1.170 — file-based                        |
| Server state    | TanStack Query 5.101 (provided, unused)                   |
| UI              | React 19.2                                                |
| Build tool      | Vite 8.1                                                  |
| Styling         | Tailwind CSS 4.2 via `@tailwindcss/vite` (no config file) |
| Components      | shadcn/ui on Radix primitives                             |
| Icons / charts  | lucide-react · recharts                                   |
| Forms           | react-hook-form + zod                                     |
| Language        | TypeScript 5.8 (strict)                                   |
| Server runtime  | nitro — Cloudflare Workers is the default build target    |
| Package manager | **Bun** (`bun.lock`)                                      |
| Quality         | ESLint 9 + Prettier                                       |

This is **not** a plain Vite SPA. TanStack Start renders on the server, so
there is no `index.html` — the HTML shell is generated at request time.

## Architecture

```
Request
  │
  ├─ src/server.ts        Worker entry — wraps SSR, catches render errors
  ├─ src/start.ts         Start instance: error middleware + CSRF middleware
  ├─ src/router.tsx       Builds the router, creates the QueryClient
  ├─ src/routeTree.gen.ts GENERATED route tree — never edit by hand
  │
  └─ src/routes/
       __root.tsx         Root layout; supplies queryClient via router context
       index.tsx          /            landing page
       investigate.tsx    /investigate 4-step investigation wizard
       overview.tsx       /overview    opportunity dashboard
```

Three things worth knowing:

1. **`routeTree.gen.ts` is generated** by `@tanstack/router-plugin` from the
   files in `src/routes/`. Add a route by adding a file; don't hand-edit it.
2. **`QueryClient` is wired** into router context in
   [src/router.tsx](src/router.tsx) and typed on the root route, but nothing
   uses it yet.
3. **`src/start.ts` re-adds CSRF protection explicitly.** Start installs it
   automatically only when that file is absent; defining the file opts out, so
   it is re-registered by hand. Leave it in place.

The Vite config is deliberately thin — it delegates to
`@lovable.dev/vite-tanstack-config`, which bundles the TanStack Start, React,
Tailwind, tsconfig-paths and nitro plugins. **Do not add those plugins
manually**; duplicates will break the build.

## Folder structure

```
frontend/
├── public/                  static assets (favicon, robots.txt)
├── src/
│   ├── components/
│   │   ├── atlas/           product-specific components
│   │   │   ├── data/        investigation.ts — ALL mock data lives here
│   │   │   ├── wizard/      StepCompany · StepUploads · StepProgress · StepReview
│   │   │   ├── InvestigationMockup.tsx
│   │   │   └── OpportunityDrawer.tsx
│   │   └── ui/              shadcn/ui primitives (~50 components)
│   ├── hooks/               use-mobile.tsx
│   ├── lib/                 utils.ts, error capture + error page helpers
│   ├── routes/              file-based routes (see Architecture)
│   ├── router.tsx           router + QueryClient construction
│   ├── server.ts            SSR/worker entry
│   ├── start.ts             middleware registration
│   ├── routeTree.gen.ts     generated
│   └── styles.css           Tailwind entry + design tokens
├── components.json          shadcn/ui config
├── eslint.config.js         ESLint flat config
├── vite.config.ts           delegates to the Lovable preset
├── tsconfig.json            strict; `@/*` → `./src/*`
├── bunfig.toml              Bun install policy (24h supply-chain guard)
└── package.json
```

## Install

```bash
cd frontend
bun install
```

Bun is the project's package manager — `bun.lock` is the committed lockfile.
`npm install` will resolve, but it ignores `bun.lock` and generates a competing
`package-lock.json`, so prefer Bun for reproducible installs.

`bunfig.toml` sets `minimumReleaseAge = 86400`, refusing any package published
in the last 24 hours as a supply-chain guard. `@lovable.dev/*` packages are
explicitly excluded from that rule.

## Run locally

```bash
bun run dev
```

→ **http://localhost:8080** (not Vite's usual 5173 — the Lovable preset sets
the port). The backend runs on `:8000`, so the two don't collide.

## Build for production

```bash
bun run build      # → .output/
bun run preview    # serve the production build locally
```

The build emits a nitro server bundle in `.output/`, targeting **Cloudflare
Workers** by default, and generates `wrangler.json` alongside it. Deploy with
`npx nitro deploy --prebuilt`.

### Scripts

| Script      | Does                               |
| ----------- | ---------------------------------- |
| `dev`       | Dev server with HMR on :8080       |
| `build`     | Production build to `.output/`     |
| `build:dev` | Production build, development mode |
| `preview`   | Serve the built output             |
| `lint`      | ESLint across the project          |
| `format`    | Prettier write                     |

## Environment variables

**None.** There is no `.env` file, and no `import.meta.env` or `process.env`
usage anywhere in `src/`. Both the dev server and the build run on defaults.

## Data layer

Every screen renders from
[src/components/atlas/data/investigation.ts](src/components/atlas/data/investigation.ts)
— 559 lines of typed mock data exporting `InternalSource`, `ExternalSource`,
`Finding`, `Quote`, `Opportunity`, `artifacts` and `workflowStages`.

It has exactly two consumers:

| File                                         | Uses                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/routes/overview.tsx`                    | `internalSources`, `externalSources`, `findings`, `opportunities`, `artifacts`, `workflowStages` |
| `src/components/atlas/OpportunityDrawer.tsx` | `Opportunity` (type only)                                                                        |

No API client, no fetch calls. The only `fetch` in the codebase is the
Cloudflare Worker handler signature in `src/server.ts`.

Three specifics that are easy to misread:

- **The wizard persists nothing.** `investigate.tsx` holds company, files and
  step in local `useState`; navigating away discards it.
- **`StepProgress` is a timer.** It animates a hardcoded 14.6-second stage list
  via `setInterval` and derives its metrics as `progress × constant`.
- **Uploads capture filenames only.** `UploadState` is
  `Record<string, string[]>`, and `dropFiles` stores `f.name` — the file bytes
  are discarded.

### Divergence from the backend

The backend in [../backend](../backend) exposes six investigation endpoints
under `/api/v1`, and two incompatibilities exist today:

- This app serves `http://localhost:8080`, which is absent from the backend's
  `cors_origins` (`http://localhost:5173`, `http://localhost:3000`).
- The backend's `InvestigationCreate` requires `title`, `question`, `context`
  and `tags`. The wizard collects a company name and filenames; there is no
  `question` field in the UI.

## Design language

The UI is built to these rules: dark-mode first, generous whitespace, rounded
cards, minimal palette, subtle animation. Inspired by Linear, Vercel, Stripe,
Notion and Raycast. Explicitly avoided: gradients, glow effects, glassmorphism,
and chat interfaces — Atlas is a decision tool, not a chatbot.

## Known warnings

Neither blocks the build:

- `vite-tsconfig-paths` prints a deprecation notice — Vite 8 resolves tsconfig
  paths natively. It comes from the Lovable preset.
- `bun run lint` reports 44 issues: 35 `prettier/prettier` formatting errors
  (auto-fixable with `bun run lint -- --fix`) and 9
  `react-refresh/only-export-components` warnings from the shadcn/ui pattern of
  exporting a component alongside its variants.

## Origin

Generated with [Lovable](https://lovable.dev) ·
[live app](https://pmatlas.lovable.app) ·
[project](https://lovable.dev/projects/7d0c1833-99ac-4b72-b15b-2c476472562a)
