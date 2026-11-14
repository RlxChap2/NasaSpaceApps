# Architecture

## Stack and run configuration

Next.js 16.2.9 with React 19.2.4 and TypeScript serves the web UI. Three.js handles 3D scenes and Recharts draws dashboard charts. The audited production build prerenders frontend routes. Browser requests reach FastAPI directly through [api.ts](../full/src/lib/api.ts). The public client base URL is `NEXT_PUBLIC_API_URL` or `http://localhost:8000`. Next.js inlines the configured public value at build time.

[requirements.txt](../api/requirements.txt) declares FastAPI `>=0.115.0,<1.0.0`, Uvicorn `>=0.32.0,<1.0.0`, Pydantic `>=2.9.0,<3.0.0` and openpyxl `>=3.1.5,<4.0.0`. The dev manifest adds pytest and httpx. [Testing](TESTING.md) records resolved versions.

```text
Daily Health Check-in -> browser fetch -> FastAPI validation and rules -> SQLite
Crew Daily Log       <- browser fetch <- FastAPI filtered or full vitals list
C001 form fields     -> browser localStorage -> dashboard trend and history views
```

## Persistence and errors

[CheckInForm](../full/src/components/dashboard/CrewDashboard.tsx) requires pulse, sleep, fatigue and mood, plus a matching mission day and phase. It converts fatigue to `stress_score_0_10` using `(fatigue - 1) * 2.5`, and mood to `mood_unhappiness_0_10` using `(5 - mood) * 2.5`. This is a demo mapping. Fatigue and stress are distinct measurements in practice. Optional BP, temperature, glucose and CO₂ fields start with sample values and empty fields fall back to those values. Treat them as demo inputs.

[VitalsCreate](../api/app/schemas.py) requires one of C001–C004, a supported phase/day combination (`L-n`, `FDn` or `R+n`) and nine bounded numbers. The API saves a `VitalsRecord` with identity, phase/day, values, source and status, plus an alert list with the indicator, severity, reference text and source link. [db.py](../api/app/db.py) defines `daily_vitals_logs`, `nasa_reference_thresholds`, `real_nasa_osdr_files_map` and `real_osdr_lab_results` in `api/data/astronaut_health.db`. SQLite enforces unique record IDs and crew/day pairs. The API stores mission-relative days and no measurement timestamp.

The form reports API and validation errors. Duplicate crew/day creates return HTTP 409 and invalid payloads or filter inputs return 422. The API assigns IDs before the insert and performs a separate duplicate lookup. Concurrent writes and retries after a lost response have no verified protection beyond database constraints. A C001 save writes the API record before updating browser storage. Storage failure can therefore leave a saved API record despite a form error. C001 notes and follow-up flags live in browser storage. For other crew the notes and flag exist only in the current form result. The dashboard and Research & Evidence can silently fall back or omit API content on a fetch failure. The crew daily log starts with a fixed JSON copy.

## API routes

All endpoints below use the `/api` prefix. [OpenAPI](http://localhost:8000/docs) documents the full request and response fields when the local server is running.

| Method and path | Contract |
| --- | --- |
| GET `/health` | Service and SQLite status with vitals, threshold and study-file counts. |
| GET `/astronauts` | Four crew IDs with latest record, averages and status counts. |
| GET `/vitals` | Mission-day-sorted records. Optional `astronautId`, `missionPhase`, `missionDay` and `alertStatus` filters. |
| POST `/vitals` | Accepts `VitalsCreate`. Returns HTTP 201 with the stored `VitalsRecord`. |
| POST `/vitals/reset` | Replaces the shared vitals table with seeded rows and returns the count. Called by Load Demo Scenario. |
| GET `/thresholds` | Reference metadata and source URLs for 13 indicators. |
| GET `/analytics/summary` | Status counts and percentages, phase and crew summaries, and numeric extrema. The audited frontend does not consume this endpoint. |
| GET `/osdr-files` | Catalog of studies/files with parsed-row counts. |
| GET `/osdr-lab-results` | Parsed lab rows, optionally filtered by `fileId`. Empty on a clean checkout. |

## Public deployment

The API has open CORS and no authentication or tenant isolation. The demo reset affects everyone sharing the database. A password helper exists on the frontend but is unused. Keep the audited API bound to loopback for local use. Use a disposable, synthetic-only demo instance with isolated or restricted writes and reset if judges need to save entries. A public HTTPS frontend needs a reachable HTTPS API and a rebuild with its correct URL. Set up persistent storage only if durable shared demo records are intended. Check signed out from another device that both services are reachable. A public read-only demo or corrected slide deck can demonstrate the workflow without exposing shared mutations.
