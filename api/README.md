# Astronaut Health Monitoring API

FastAPI + SQLite backend for the 2026 NASA Space Apps Challenge project.
See also [check-ins.ts](../full/src/components/dashboard/check-ins.ts) in the frontend for the planned integration point.

## Setup (Windows PowerShell)

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

## Seed Database

```powershell
cd api
python -m app.seed
```

## Run Server

```powershell
cd api
python -m uvicorn app.main:app --reload --port 8000
```

Interactive API docs are available at `http://localhost:8000/docs`.

## Run Tests

```powershell
cd api
python -m pytest
```
