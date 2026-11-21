# memory-trainer

Personal memory trainer, based on IAM and Memory League events.

Train the six Memory League disciplines (Numbers, Cards, Images, Words, Names, International Names), keep a full history of every attempt, analyse mistakes and link them to the images of your own mnemonic systems (PAO, major system).

## Status

**Sprint 0 (foundation) done.** The app is an empty page, deployed end to end at <https://memory-trainer-34d.pages.dev>. Next step: batch 0.1 (Numbers).

| Part | Status |
|---|---|
| 0–2 · Scoping, requirements, project management | Validated |
| 3 · Security and GDPR analysis | Validated |
| 4 · Functional and technical specifications | Validated (batch 0.1) |
| 5 · Detailed security | Validated |
| 6 · Quality and deployment | Test strategy, acceptance and CI/CD written; documentation and maintenance finalised in production |

## Planned features

- Memory League formats and scores, plus a custom mode (duration and number of items).
- Works **offline**, synced across computer, phone and tablet.
- Progress charts, error analysis, IAM point equivalents.
- Mnemonic systems linked to errors.
- French and English interface.
- Installable as a desktop app (after v1.0).

Delivered in batches: 0.1 (foundation and Numbers) → 1.0 (IAM points), then 1.1 (desktop app). See the [scope](docs/02-projet/perimetre.md).

## Tech stack

| Layer | Choice | Decision |
|---|---|---|
| Front end | SvelteKit (TypeScript, SPA mode), installable PWA | [ADR 0001](docs/04-specifications/adr/0001-framework-front-svelte.md), [ADR 0007](docs/04-specifications/adr/0007-sveltekit-mode-spa.md) |
| Database and API | Neon (PostgreSQL, Data API with row-level security) | [ADR 0002](docs/04-specifications/adr/0002-backend-neon.md) |
| Authentication | Hanko Cloud (passkeys) | [ADR 0003](docs/04-specifications/adr/0003-connexion-hanko.md) |
| Offline and sync | Dexie.js (IndexedDB) with a custom upload queue | [ADR 0004](docs/04-specifications/adr/0004-hors-ligne-sur-mesure-dexie.md) |
| Hosting | Cloudflare Pages | [ADR 0005](docs/04-specifications/adr/0005-hebergement-cloudflare-pages.md) |
| Backups | Cloudflare Worker to R2, daily and incremental | [ADR 0009](docs/04-specifications/adr/0009-sauvegarde-cloudflare-worker-r2.md) |
| Desktop | Installed PWA | [ADR 0006](docs/04-specifications/adr/0006-bureau-pwa-installee.md) |
| Tests | Vitest, Playwright, PGlite | [ADR 0021](docs/04-specifications/adr/0021-outils-de-test.md) |
| Migrations | dbmate (plain SQL) | [ADR 0022](docs/04-specifications/adr/0022-migrations-dbmate.md) |
| Code quality | ESLint, Prettier, svelte-check, gitleaks | [Deployment](docs/06-qualite-deploiement/deploiement.md) |

All services run on free plans. The full comparison is in the [technology benchmark](docs/04-specifications/benchmark.md).

## Getting started

### Prerequisites

- Node.js 26 (see `.nvmrc`)
- [gitleaks](https://github.com/gitleaks/gitleaks) and [dbmate](https://github.com/amacneil/dbmate) (`brew install gitleaks dbmate`)

### Install

```sh
npm install
```

`npm install` also points git to the versioned hooks (`.githooks/`): every commit is scanned for secrets by gitleaks.

### Local environment

Copy `.env.example` to `.env` (ignored by git) and fill it with the values of the Neon **dev** branch and the public Hanko URL. Never put production credentials on this machine: production is only reached by the CI.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server on <http://localhost:5173> |
| `npm run test` | Unit, integration and database tests, in watch mode |
| `npm run test:coverage` | All Vitest tests once, with the domain coverage threshold |
| `npm run test:e2e` | End-to-end tests (Playwright) on the built app |
| `npm run lint` / `npm run format` | Check / apply formatting and lint rules |
| `npm run check` | Type checking |
| `npm run db:up` / `npm run db:status` | Apply / list migrations on the dev branch (`DATABASE_URL` in `.env`) |
| `npm run db:new <name>` | Create a new migration in `db/migrations/` |

## Deployment

Production is deployed **only by the CI**, after a pull request from a `release/*` or `hotfix/*` branch is merged into `main`: full backup to R2, database migrations, then publication on Cloudflare Pages. The step-by-step procedure is in the [deployment guide](docs/06-qualite-deploiement/deploiement.md) (in French).

## Documentation

Design documents are in [`docs/`](docs/) (in French). Start with the [PRD](docs/PRD.md).

| Folder | Content |
|---|---|
| [`00-cadrage`](docs/00-cadrage/) | Project profile |
| [`01-besoin`](docs/01-besoin/) | Needs, requirements, business rules, user stories |
| [`02-projet`](docs/02-projet/) | Objectives, scope, priorities, planning, risks, conventions |
| [`03-analyse-securite`](docs/03-analyse-securite/) | GDPR status, threats, security requirements |
| [`04-specifications`](docs/04-specifications/) | Benchmark, architecture, UML, data model, access rules, mock-ups, decisions (ADR) |
| [`05-securite`](docs/05-securite/) | Defence in depth, attack surface, database, front-end and back-end security |
| [`06-qualite-deploiement`](docs/06-qualite-deploiement/) | Test strategy, acceptance, deployment, maintenance |

## Contributing

Git Flow with signed Conventional Commits. See the [conventions](docs/02-projet/conventions.md).
