import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_db
from app.schemas import ThresholdRecord

router = APIRouter(prefix="/api", tags=["thresholds"])


@router.get("/thresholds", response_model=list[ThresholdRecord])
def list_thresholds(conn: sqlite3.Connection = Depends(get_db)) -> list[ThresholdRecord]:
    rows = conn.execute(
        "SELECT * FROM nasa_reference_thresholds ORDER BY indicator_id"
    ).fetchall()
    return [ThresholdRecord(**dict(row)) for row in rows]
