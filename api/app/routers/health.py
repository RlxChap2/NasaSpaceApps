import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_db
from app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health(conn: sqlite3.Connection = Depends(get_db)) -> HealthResponse:
    total_daily = conn.execute("SELECT COUNT(*) FROM daily_vitals_logs").fetchone()[0]
    total_thresholds = conn.execute("SELECT COUNT(*) FROM nasa_reference_thresholds").fetchone()[0]
    total_osdr = conn.execute("SELECT COUNT(*) FROM real_nasa_osdr_files_map").fetchone()[0]
    return HealthResponse(
        status="ok",
        database="connected",
        totalDailyRecords=total_daily,
        totalThresholds=total_thresholds,
        totalOsdrFiles=total_osdr,
    )
