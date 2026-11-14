# Testing

Verified on Windows on November 14, 2026 using local `feat/backend` at `b05d2c0`. The backend smoke test used a fresh SQLite database outside the checkout. UI test entries and resets were confined to that database.

| Directory | Command | Result |
| --- | --- | --- |
| Isolated copy of `full/` | `npm.cmd ci --no-audit --no-fund` | Exit 0. Added 547 packages. npm reported pending install scripts for `sharp@0.34.5` and `unrs-resolver@1.12.2`. |
| `full/` | `npm.cmd run lint` | Exit 0, no ESLint findings in command output. |
| `full/` and isolated copy | `npm.cmd run build` | Exit 0 in both directories with Next.js 16.2.9. TypeScript passed, and the build generated 11 static pages. Lint and the isolated production build passed again after the UI copy and source-link edits. |
| `api/` | `.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt` | Exit 0. Installed FastAPI 0.163.0, Uvicorn 0.54.0, Pydantic 2.14.3, openpyxl 3.1.5, pytest 9.2.0 and httpx 0.28.1. |
| `api/` | `.\.venv\Scripts\python.exe -m pytest -q` | `71 passed, 1 warning in 5.58s`. The warning came from Starlette TestClient's deprecation of httpx support. |

Node.js 24.19.0, npm 11.17.0 and Python 3.13.14 were used. The Python requirements specify ranges. The versions above reflect this run. Test modules cover seeding, rule boundaries, API requests and responses, and SQLite-backed operations. Coverage and performance were not measured.

## Browser and API smoke check

The isolated API ran with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`. From `full/`, the production frontend ran with `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 13847`. Headless Chrome with Playwright exercised the browser paths. The normal frontend script uses port 3847. The final browser rerun used the isolated build on port 13848 and repeated the same checks.

1. `GET /api/health` reported 40 daily records, 13 threshold entries and ten catalog entries.
2. In Daily Health Check-in, C001/In-Flight/`FD999`, a fictional pulse of 76 bpm, sleep of 7.4 h, fatigue 2/5 and mood 4/5 returned HTTP 201 with `REC-041`. Remaining measurements used the form's defaults. The form showed the save confirmation and the API count increased to 41.
3. After browser reload, the C001 local entry persisted. The filtered API returned `REC-041`. In Crew Health > Crew Daily Log the selected `FD999` record appeared with its user-input label. The backend stores mission-day offsets and the browser shows a separate UTC timestamp.
4. Research & Evidence rendered 13 reference entries and ten study-file catalog entries. The final browser rerun verified the Reference workbook link points to the anonymously accessible workbook. The browser received HTTP 200 on the landing page, Crew Health, Credits, Overview, Body Explorer, Crew Profiles and Health Trends.
5. A request to save C001/`L-3` again returned HTTP 409. A mismatched phase/day returned 422. C002/`FD7` saved through the form and increased the API count to 42. The new reading was absent from Health Trends, which reads this browser's C001 history. An isolated API reset returned the count to 40.

For the final slide capture, choose an In-Flight day that is unused for the selected crew member. On the stock seed, the suggestion after the API loads is `FD7`. Save from Check-in, capture the confirmation, then select the saved day in Crew Daily Log. The deck's current C001/`L-3` is already seeded and is suitable as a read-only example.

## Remaining checks

- Verify the public site and API from a signed-out browser on another device. Confirm the production API origin, save behavior and the read-only or isolated reset configuration.
- The check-in UI permits heart rates 1–300 bpm, while the API accepts 20–250 bpm. Out-of-overlap inputs can pass client validation and fail on save. The form maps fatigue to stress and supplies numeric defaults for blank optional readings. Ensure the demo explains those values.
- Health Trends and C001 overview cards depend on browser-local data. Multi-crew archive, cross-device history, production hosting, backup/restart durability, simultaneous writes, offline behavior and all WebGL/mobile interactions were not covered by the smoke check.
- The Research Drive folder was inaccessible anonymously. The public deck was accessible and needs the content changes in the [submission draft](../NASA_SUBMISSION_DRAFT.md#deck-audit).
