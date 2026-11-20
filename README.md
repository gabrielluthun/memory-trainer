# memory-trainer

Personal memory trainer, based on IAM and Memory League events.

Train the six Memory League disciplines (Numbers, Cards, Images, Words, Names, International Names), keep a full history of every attempt, analyse mistakes and link them to the images of your own mnemonic systems (PAO, major system).

## Status

**Design phase.** No application code yet.

| Part | Status |
|---|---|
| 0–2 · Scoping, requirements, project management | Validated |
| 3 · Security and GDPR analysis | Validated |
| 4 · Functional and technical specifications | In progress (technology benchmark done) |
| 5–6 · Detailed security, quality and deployment | To do |

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
| Front end | Svelte (TypeScript), installable PWA | [ADR 0001](docs/04-specifications/adr/0001-framework-front-svelte.md) |
| Database and API | Neon (PostgreSQL, Data API with row-level security) | [ADR 0002](docs/04-specifications/adr/0002-backend-neon.md) |
| Authentication | Hanko Cloud (passkeys) | [ADR 0003](docs/04-specifications/adr/0003-connexion-hanko.md) |
| Offline and sync | Dexie.js (IndexedDB) with a custom upload queue | [ADR 0004](docs/04-specifications/adr/0004-hors-ligne-sur-mesure-dexie.md) |
| Hosting | Cloudflare Pages | [ADR 0005](docs/04-specifications/adr/0005-hebergement-cloudflare-pages.md) |
| Desktop | Installed PWA | [ADR 0006](docs/04-specifications/adr/0006-bureau-pwa-installee.md) |

All services run on free plans. The full comparison is in the [technology benchmark](docs/04-specifications/benchmark.md).

## Documentation

Design documents are in [`docs/`](docs/) (in French). Start with the [PRD](docs/PRD.md).

| Folder | Content |
|---|---|
| [`00-cadrage`](docs/00-cadrage/) | Project profile |
| [`01-besoin`](docs/01-besoin/) | Needs, requirements, business rules, user stories |
| [`02-projet`](docs/02-projet/) | Objectives, scope, priorities, planning, risks, conventions |
| [`03-analyse-securite`](docs/03-analyse-securite/) | GDPR status, threats, security requirements |
| [`04-specifications`](docs/04-specifications/) | Benchmark, architecture decisions (ADR) |

## Contributing

Git Flow with signed Conventional Commits. See the [conventions](docs/02-projet/conventions.md).
