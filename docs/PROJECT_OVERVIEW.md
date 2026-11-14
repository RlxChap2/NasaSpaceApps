# Project overview

**Crew State Health**, by team **0xE90**, is a browser prototype for logging and reviewing fictional crew measurements. The public slide export and the site title agree on the project name. The challenge is [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

## Implemented

| User path | What it does |
| --- | --- |
| `/` | Introduces the Moon and the five spaceflight hazards through an interactive story. |
| `/crew-health` | Shows a 3D anatomy explorer, educational organ scenarios, a crew/mission-day log and a separate example trend with session-only input. The daily log loads API records when available and uses a fixed JSON copy on failure. |
| `/dashboard/check-in` | Accepts fictional readings for four crew IDs, saves them through FastAPI and returns a status and rule details when triggered. |
| `/dashboard`, `/dashboard/trends` | The overview combines browser-only trend cards with API-backed crew summaries when available. The Trends screen charts the separate browser history and labels manual and simulated rows. |
| `/dashboard/body`, `/dashboard/crew` | Show anatomy context and crew profiles. Some views mix a browser-only C001 series with API or archive data for other crew. |
| `/dashboard/research` | Links research and shows an API-backed reference table and study-file catalog when the service responds. |
| `/credits` | Lists team members. Compare its display names with the final deck and NASA roster. |

The verified save journey uses Daily Health Check-in followed by Crew Daily Log. See [Testing](TESTING.md). The rule output is for simulation and has no clinical validation.

## Planned

`CrewSignals.tsx` describes future sensor connections. The deck mentions hydration tracking, hazard risk scoring, circadian guidance, action checklists and recovery verification. Those claims should be removed from the current demo unless the team can identify and verify a newer release that implements them.

## Unverified

Public frontend and API, offline operation, live wearables, authenticated access, clinical calibration and full visual coverage across devices. The project has a local follow-up checkbox, descriptive trends and illustrative prompts. The audited UI has no workflow that verifies recovery.

## Repository inventory

- `full/` contains the Next.js App Router site, npm manifest and lockfile, ESLint, TypeScript and Next.js configuration, frontend source, and local 3D assets, textures, fonts, animations and videos. `scripts/split-eye-frames.mjs` is an asset preparation script. The package declares dev, build, start and lint scripts. It declares no frontend test runner.
- `api/` contains the FastAPI entry point, six routers, Pydantic schemas, SQLite schema, seed/import and rule code, three CSV inputs, fallback fixtures and tests in `tests/test_api.py`, `tests/test_engine.py` and `tests/test_seed.py`. No raw OSDR files are checked in.
- `docs/README.md` was the sole existing project Markdown file under `docs/`. `api/README.md` provides an API quick start. No root README, repository-wide license, checked-in CI workflow or deployment manifest was found in the audited checkout.
- `dashboard-auth.ts` contains password/cookie helpers with no route consumers. `CrewDemoStats.tsx` contains example values. The checkout includes illustrative artwork and prototype sprite sources, including a ZIP under `full/public/`. Those files are eligible to be served as static content, so review what ships.
- The review used local `feat/backend` at `b05d2c0`. Local `main` and its tracking ref were at `ffee74b`. The authenticated GitHub API reported private remote `main` at `0a5dfdf`, a merge whose tree contains the API and frontend client. No remote changes were made.
- Local generated files include ignored `full/.next/`, `full/node_modules/`, `full/next-env.d.ts`, `api/.venv/`, Python caches and `api/data/astronaut_health.db`. The pre-existing lockfile modification had no diff with `git diff --ignore-space-at-eol` and was preserved. A targeted scan of current source and config for common credential literals/private-key markers found no matches. A whole-history and asset review is still needed before publication.

The brief lists 0xM7md (integration and submission), rio (frontend), Devon (API and tests), Gamz (research and data), and Simon009 (visuals and slides). These roles come from the team brief. The slide deck spells out five names. Confirm the public spellings against the team's roster.
