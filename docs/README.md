# Crew State Health | NASA Space Apps

Crew State Health is an interactive web prototype for exploring astronaut health and life beyond Earth. The site includes lunar scenes, a 3D anatomy explorer and simulated crew records. Team 0xE90 built it for [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

## Requirements

- Node.js 20.9 or later with npm. The review used Node.js 24.19.0 and npm 11.17.0.
- Python. The API was tested with Python 3.13.14.
- Git, or a ZIP of the repository from someone with access. A WebGL-capable browser is needed for 3D scenes.

## Run locally

Open two terminals at the repository root. Start the API first. These commands use PowerShell.

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

A new SQLite database seeds automatically on startup. The API provides [OpenAPI docs](http://localhost:8000/docs). See the [API README](../api/README.md) for the seed and test commands. Its reference to planned frontend integration predates the current checkout.

```powershell
cd full
npm ci
npm run dev
```

Open the [site](http://localhost:3847), [Daily Health Check-in](http://localhost:3847/dashboard/check-in) or [Crew Health](http://localhost:3847/crew-health). Leave the API running while using Check-in. Use fictional values and choose a crew member, phase and unused mission day. The saved entry appears in the Crew Daily Log. **Load Demo Scenario** clears all custom records from the connected API database and resets this browser's sample history. Use it with a disposable demo database.

For frontend production checks, run `npm run lint` and `npm run build` from `full/`, then `npm start` to serve the build on port 3847. For a different API origin, set `NEXT_PUBLIC_API_URL` in the frontend environment before running or building Next.js. See [Architecture](ARCHITECTURE.md) for public deployment constraints.

## Project documentation

- [Project overview and repository inventory](PROJECT_OVERVIEW.md)
- [Architecture and API](ARCHITECTURE.md)
- [Data provenance and quality](DATA_PROVENANCE.md)
- [NASA and other research evidence](NASA_EVIDENCE.md)
- [Test results](TESTING.md)
- [AI use and asset credits](AI_USAGE.md)
- [NASA submission draft and slide audit](../NASA_SUBMISSION_DRAFT.md)

Original asset notes include [NASA media](../full/public/images/NASA-MEDIA.md), [anatomy model licenses](../full/public/models/anatomy/LICENSE.md) and [helmet attribution](../full/public/models/helmet/ATTRIBUTION.md). The repository is private as of November 14, 2026. A public final project URL and project-wide license remain to be confirmed.
