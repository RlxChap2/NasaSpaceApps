# Data provenance

Review date: November 14, 2026. The Google Sheets link exported anonymously as XLSX. A separate workbook named `NASA Space Apps 2026 - Astronaut Health Monitoring Dataset & Reference Thresholds.xlsx` was also available locally. The files have different byte hashes. All three sheets matched on stored cell values, formulas and normalized data rows. The workbook linked by the app is a different Google Sheet ID, but its anonymous XLSX export has the same SHA-256 hash as the local copy and the same cell values and formulas as the candidate. The separate Research Drive folder returned HTTP 404 without login. [Candidate workbook](https://docs.google.com/spreadsheets/d/1zvrwhlbwkKbhWnwhwqaSr1uOHPFhupcZQ11oDU-MQqk/edit) · [App-linked workbook](https://docs.google.com/spreadsheets/d/1Udl4Lahc4AHnlVe9jr79_ztFN5UjsfSO/edit).

## Checked inputs

| Source | Grain and review result |
| --- | --- |
| `Simulated_Daily_Vitals_Log` rows 5–44 and [daily_vitals_logs.csv](../api/data/input/daily_vitals_logs.csv) | 40 fictional crew/day observations. All nine measures, crew/day keys and cached statuses match. The CSV materializes formulas and retains source text without hyperlink formulas. |
| `NASA_Reference_Thresholds` rows 5–17 and [reference_thresholds.csv](../api/data/input/reference_thresholds.csv) | 13 unique indicators. Category, units, range text, reference notes and countermeasure text are complete. The source sheet contains 13 linked citations. Its footer count of 13 is a row count and does not establish 13 distinct reviewed sources or validated rules. |
| `Real_NASA_OSDR_Files_Map` rows 5–14 and [osdr_files_map.csv](../api/data/input/osdr_files_map.csv) | Ten unique catalog items with no blank fields. Nine entries point to NASA OSDR, including one metadata ZIP, and one points to PhysioNet MMASH. Eight entries are labeled CSV, one ZIP and one ZIP/CSV. Listed size ranges from 6.06 to 23,500 KB, with median 32.89 KB and total 23,918.01 KB. These are catalog values. Study links and file permissions require separate review. |
| [crew-log.json](../full/src/data/crew-log.json) | Forty frontend fallback rows. The nine numeric fields are strings. Parsed values, crew/day/phase, statuses and simulated origin labels match the vitals CSV. There are no duplicate IDs or crew/day pairs and no empty fields. |
| [seed_data.py](../api/app/seed_data.py) | Hard-coded fallback of 40 vitals, 13 indicators and ten catalog entries. No duplicate IDs or missing row fields were found. Twelve vital cells differ from CSV: six temperature, four sleep and two CO₂. Two catalog sizes and two timepoint descriptions differ. The committed CSVs overlay these rows when present. |
| [check-ins.ts](../full/src/components/dashboard/check-ins.ts) | Seven fixed browser demo rows for one fictional profile. Days 12–18 use distinct UTC timestamps, November 8–14, 2026 at 09:15, with heart rate 70–75 bpm (median 73), sleep 6.2–8.1 h (median 7.4), fatigue 1–4/5 (median 2) and mood 3–5/5 (median 4). Empty notes and false follow-up flags are defaults. This history is independent of the 40-row archive. |
| [CrewSignals.tsx](../full/src/components/CrewSignals.tsx) | Three separate six-point examples: heart rate 68–76 bpm, sleep 6–8 h, and temperature 36.5–36.8 °C. Values are fixed numbers with no observation timestamps. Added values last for the current view session. |
| [CrewDemoStats.tsx](../full/src/components/dashboard/CrewDemoStats.tsx) | Activity and recovery charts generate 14 indexed days per fictional profile with a deterministic integer generator seeded by the numeric crew ID. Across 56 crew/day points, mobility is 8–25 min (median 15), endurance 15–39 min (25.5), strength 10–32 min (20), and rest 5.8–8.6 h (6.95). All four fields are populated, with unique crew/day pairs and no exact duplicate value tuples. Days have no timestamp or timezone. The UI labels the chart simulated. |
| `api/data/astronaut_health.db` | Read-only check of existing local data counted 40 seeded rows, one user-labeled row, 13 references, ten file entries and zero lab rows. The audit used a fresh isolated database for writes and never used the existing manual row in the demo. |

The workbook also contains formula summaries for fleet status, mission phase, crew and extrema. Counts reconcile to 8 pre-flight, 24 in-flight and 8 post-flight records, with 21 green, 15 yellow and four red. Formula and cached value inspection found no error cells. Eight OSDR catalog lines describe data, one describes metadata, and one describes Earth wearable data. The workbook's `84` biospecimen claim could not be reconciled to downloaded raw files. Catalog labels such as “Yes (Instant Download)” are assertions, since exact files were neither downloaded nor ingested.

## Vitals field checks

The CSV and workbook use text record IDs, crew IDs C001–C004 and a mission phase/day pair. Each crew has ten rows across `L-3`, `L-1`, `FD1`–`FD6`, `R+1` and `R+3`. These are ordered mission offsets without timestamps or timezones. All 40 have a source note, simulated label, status and example action text. There were zero missing cells in the data table, zero exact duplicates, zero duplicate record IDs, zero duplicate crew/day pairs and zero rows rejected by the API's numeric/phase validation. Every systolic value exceeds its paired diastolic value. This checks internal consistency and API limits.

| Numeric field | Unit | Min | Median | Max |
| --- | --- | ---: | ---: | ---: |
| Sleep | h | 5.6 | 7.0 | 8.1 |
| Stress | score /10 | 1 | 3 | 7 |
| Mood unhappiness | score /10 | 0 | 2 | 7 |
| Heart rate | bpm | 53 | 67 | 91 |
| Systolic BP | mmHg | 109 | 115.5 | 129 |
| Diastolic BP | mmHg | 68 | 74 | 84 |
| Body temperature | °C | 36.6 | 36.9 | 37.7 |
| Blood glucose | mg/dL | 82 | 90.5 | 128 |
| Cabin CO₂ | mmHg | 0.5 | 0.75 | 1.8 |

## Reproduction and labeling

Use a clean database with the three committed CSVs and run `python -m app.seed` from `api/` with project dependencies installed. [seed.py](../api/app/seed.py) supports CSV and XLSX, skips titles and stops at the first blank row following each data block. It reads cached Excel values, uses [config.py](../api/app/config.py) to resolve source text, and recomputes overall statuses with [engine.py](../api/app/engine.py). Cached workbook classifications, CSV classifications and clean SQLite classifications match on these 40 rows. Some printed bands differ from executable boundaries for decimal values, so matching these rows gives limited assurance. The seed preserves supplied action text and generates alert details. The importer defaults unknown source text to the Inspiration4 paper. Check source mappings before adding new files.

The deck credits Claude with generating the simulated dataset. The authors, date, model/version, prompt, random seed, selection method, validation and editing history are unconfirmed. The committed fixtures reproduce the demo states. Generating the same measurements from scratch would need additional records.

Use **Simulated demo data** in public materials. The product includes the literal label `SIMULATED - NASA Calibrated`, but neither a calibration method nor measured inputs tied to the fictional rows were established. The Crew Daily Log displays the origin label and notes that observations are simulated. The browser Trends screen distinguishes simulated and manual entries. Check that each screenshot makes that context visible, especially where headline cards mix sources. Enter fictional values only. OSDR is displayed as catalog metadata with zero ingested lab rows in the audited checkout. Its crew counts and publication IDs do not identify the demo crew.
