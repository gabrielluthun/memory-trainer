# memory-trainer

Personal memory trainer, based on IAM and Memory League events.

Train the Memory League disciplines, keep a full history of every attempt, analyse mistakes and link them to the images of your own mnemonic systems (PAO, major system). One user, the developer, on computer, phone and tablet. *(maybe open to public one day)*

**Live:** <https://memory-trainer-34d.pages.dev>

## Status

**Version 0.1.0 is in production: foundation and Numbers.** What changes from one version to the next is in the [changelog](CHANGELOG.md). (in French)

| Batch | Content | Status |
|---|---|---|
| 0.1 | Foundation and Numbers, offline and sync | In production; acceptance in progress |
| 0.2 | Cards, Images, Words | Next |
| 0.3 to 1.0 | Names, statistics and errors, mnemonic systems, exercises, IAM points | Planned |
| 1.1 to 1.4 | Desktop app, IAM events, Spoken Numbers | After 1.0 |

See the [scope](docs/02-projet/perimetre.md) for the details of each batch.

## Features (0.1.0)

- **Numbers** in the Memory League format: 80 digits in 1 minute, recall in 4 minutes, score and time to the hundredth of a second.
- **Preparation pauses** before memorisation and recall, keyboard navigation, display pattern (« 2 2 », « 2 3 »…), recall input with insert and delete.
- **Custom mode**: number of digits and memorisation time; the last settings are offered again, on every device.
- **Abandon** with three choices; a trial interrupted by an outside incident is offered again at the next opening.
- **Result and history** with the corrected copy, digit by digit; finished trials can never be changed.
- **Offline**: the app opens and a trial runs without network; trials are sent when the network comes back, once.
- **Sync** across devices, after signing in with a passkey.
- **Updates** offered outside a trial, never during one; installation reminder on iPhone and iPad.
- **French and English** interface.

## Tech stack

| Layer | Choice | Decision |
|---|---|---|
| Front end | SvelteKit 3 (Svelte 5, TypeScript, SPA mode), layered architecture | [ADR 0001](docs/04-specifications/adr/0001-framework-front-svelte.md), [0007](docs/04-specifications/adr/0007-sveltekit-mode-spa.md), [0019](docs/04-specifications/adr/0019-architecture-en-couches.md) |
| Offline | Dexie.js (IndexedDB) with an upload queue; service worker by `@vite-pwa/sveltekit` | [ADR 0004](docs/04-specifications/adr/0004-hors-ligne-sur-mesure-dexie.md), [0008](docs/04-specifications/adr/0008-service-worker-vite-plugin-pwa.md) |
| Database and API | Neon: PostgreSQL, Data API with row-level security, client `@neondatabase/postgrest-js` | [ADR 0002](docs/04-specifications/adr/0002-backend-neon.md), [0018](docs/04-specifications/adr/0018-roles-et-regles-acces.md), [0031](docs/04-specifications/adr/0031-client-data-api-postgrest.md) |
| Authentication | Hanko Cloud, passkeys, `@teamhanko/hanko-elements` | [ADR 0003](docs/04-specifications/adr/0003-connexion-hanko.md), [0030](docs/04-specifications/adr/0030-connexion-hanko-elements.md) |
| Translations | Paraglide JS | [ADR 0026](docs/04-specifications/adr/0026-traduction-paraglide.md), [0029](docs/04-specifications/adr/0029-langue-reactive.md) |
| Hosting | Cloudflare Pages, with security headers (HSTS, CSP) written at build time | [ADR 0005](docs/04-specifications/adr/0005-hebergement-cloudflare-pages.md), [front-end security](docs/05-securite/front.md) |
| Backups | Cloudflare Worker, daily at 02:00 UTC, to a private R2 bucket | [ADR 0009](docs/04-specifications/adr/0009-sauvegarde-cloudflare-worker-r2.md), [0032](docs/04-specifications/adr/0032-worker-de-sauvegarde.md) |
| Migrations | dbmate (plain SQL), applied by the CI only | [ADR 0022](docs/04-specifications/adr/0022-migrations-dbmate.md) |
| Tests | Vitest (unit, infrastructure, database on PGlite, backup Worker), Playwright | [ADR 0021](docs/04-specifications/adr/0021-outils-de-test.md) |
| Code quality | ESLint, Prettier, svelte-check, gitleaks, Dependabot | [Deployment](docs/06-qualite-deploiement/deploiement.md), [maintenance](docs/06-qualite-deploiement/maintenance.md) |

All services run on free plans, except R2, which requires a payment method (but limited to 0.01$, see more on[ADR 0024](docs/04-specifications/adr/0024-moyen-de-paiement-cloudflare-r2.md)). 

The full comparison is in the [technology benchmark](docs/04-specifications/benchmark.md).

## Repository layout

| Folder | Content |
|---|---|
| `src/lib/domain` | Business rules: trials as state machines, disciplines, scores (no framework) |
| `src/lib/application` | Use cases: trial session, history, settings, sync, updates, installation |
| `src/lib/infrastructure` | Dexie.js, Data API, Hanko, service worker and browser adapters |
| `src/lib/presentation`, `src/routes` | Screens and components |
| `messages/` | French and English texts |
| `db/migrations`, `db/scripts` | dbmate migrations, authorised account script |
| `workers/backup` | Daily backup Worker |
| `scripts/` | Build scripts: security headers |
| `tests/` | End-to-end tests, database tests, test doubles |

## Getting started

### Prerequisites

- Node.js 26 (see `.nvmrc`)
- [gitleaks](https://github.com/gitleaks/gitleaks) and [dbmate](https://github.com/amacneil/dbmate) (`brew install gitleaks dbmate`)
- Playwright browsers, for the end-to-end tests: `npx playwright install`

### Install

```sh
npm install
```

`npm install` also points git to the versioned hooks (`.githooks/`): every commit is scanned for secrets by gitleaks.

### Local environment

Copy `.env.example` to `.env` (ignored by git) and fill it with the values of the Neon **dev** branch and the public Hanko URL. Production is only reached by the CI.

The only Hanko project is the production one, which accepts the production address only: signing in does not work on `localhost`. Use « Continuer hors connexion »; trials stay on the device. Sync is covered by simulated services in the end-to-end tests, and checked in production at acceptance.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server on <http://localhost:5173> |
| `npm run build` / `npm run preview` | Production build in `build/`, with `build/_headers` / preview it |
| `npm run test` | Unit, integration, database and Worker tests, in watch mode |
| `npm run test:coverage` | All Vitest tests once, with the domain coverage threshold |
| `npm run test:e2e` | End-to-end tests (Playwright) on the built app |
| `npm run lint` / `npm run format` | Check / apply formatting and lint rules |
| `npm run check` | Type checking |
| `npm run db:up` / `npm run db:status` | Apply / list migrations on the dev branch (`DATABASE_URL` in `.env`) |
| `npm run db:new <name>` | Create a new migration in `db/migrations/` |

## Deployment

Production is deployed **only by the CI**, after a pull request from a `release/`* or `hotfix/`* branch is merged into `main`:

1. build, with the security headers;
2. full export of the database to R2, retried up to 3 times;
3. database migrations;
4. authorised account;
5. publication on Cloudflare Pages;
6. backup Worker and its database secret.

Then the release is tagged (`vX.Y.Z`, signed), `main` is merged back into `develop`, and a GitHub release is created from the [changelog](CHANGELOG.md).

The `production` environment of GitHub holds the secrets (`MIGRATION_DATABASE_URL`, `BACKUP_DATABASE_URL`, `AUTHORIZED_ACCOUNT_ID`, R2 and Cloudflare keys) and, as **variables**, the two public addresses of the build (`PUBLIC_HANKO_API_URL`, `PUBLIC_DATA_API_URL`). Outside the repository, the Hanko session token carries a static claim `role: "authenticated"`: without it, the Neon Data API serves requests as `anonymous`, and sync fails with HTTP 403.

The step-by-step procedure is in the [deployment guide](docs/06-qualite-deploiement/deploiement.md) (in French).

## Operations

- **Backups**: one file a day in R2 (`daily/…json`), plus a full export before each migration. Cloudflare sends no alert when the Worker fails: check its run history at each batch.
- **Restore**: tested at each batch; in production, through a CI task ([maintenance](docs/06-qualite-deploiement/maintenance.md)).
- **Dependencies**: weekly Dependabot pull requests to `develop`, merged locally after review; TypeScript 7 is ignored until the tooling supports it.

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
