# AGENTS.md

> **Read `docs/PRD.md` first.** It is the authoritative spec (in Portuguese). This file only captures what is easy to miss or non-obvious.

## Current status

Pre-implementation. Only `docs/PRD.md` exists. Phase 1 (Foundation) is the first deliverable: folder selection → scanner → SQLite → count → first gallery. No AI, face recognition, trip detection, deletion, physical reorganization, or Android in v1.

## Core invariant

**Never move, rename, delete, or reorganize original files during indexing.** The app builds a logical catalog over existing files. Physical filesystem changes are Phase 8+ and always require explicit user confirmation.

## Stack (exact versions)

- **Angular 22** (renderer) + **Electron 44+** (main) + **Node.js 24** + **TypeScript 6.x**
- **SQLite** via `better-sqlite3`
- **Tailwind CSS 4.x** + **Optimus UI V2** + **PrimeIcons**
- Target: **portable Windows 11** app — no global Node.js dependency

## Source layout (planned, per PRD §8 & Appendix B)

```
src/
├── main/          # Electron main process
│   ├── core/  catalog/  ingestion/  analysis/
│   ├── thumbnails/  search/  review/  trash/
│   └── filesystem/  desktop/
├── preload/       # Electron preload scripts
└── renderer/      # Angular app
    └── app/
        ├── core/
        ├── features/   # library, timeline, albums, events, people,
        │               # favorites, organize, review, search, settings
        └── shared/
```

## Abstractions that must exist from day one

- `MediaSource` interface (PRD §36) — enables future Android/network sources without refactoring.
- `VisionAnalyzer` interface (PRD §30) — catalog must not depend on a specific AI model.

## Data model

- SQLite stores the **catalog only** — never original files. DB lives at `data/library.db`.
- Store **relative paths** from the library root (e.g. `backup/2024/IMG_1234.jpg`) so the library works when the drive is moved to another computer.
- Migrations must be versioned.

## UI constraints

- **PrimeIcons only** — Lucide, Font Awesome, and other icon sets are forbidden without explicit architectural decision.
- Prefer existing **Optimus UI V2** components; use Tailwind for layout and customization.
- Angular: standalone components, signals, OnPush change detection, lazy-loaded routes.

## Branching & commits

- `main` (production) · `develop` (development) · `feature/*` · `fix/*` · `hotfix/*`
- Conventional Commits; small, frequent commits.

## Definition of done (per PRD §41)

A feature is only done when: it compiles, tests pass, error handling exists, long operations don't block the UI, progress + cancel are present where applicable, originals remain intact, migrations are versioned, logs exist, UI uses Optimus UI V2 + PrimeIcons + Tailwind, behavior is validated with real files, and corrupt files don't halt the library-wide scan.
