import sqlite3

from fastapi import APIRouter, Depends

from app.config import ASTRONAUT_IDS, STATUS_GREEN, STATUS_RED, STATUS_YELLOW
from app.db import get_db
from app.schemas import (AlertCounts,AstronautAverages,AstronautSummary,VitalsRecord,mission_day_sort_key,parse_vitals_row)

router = APIRouter(prefix="/api", tags=["astronauts"])


@router.get("/astronauts", response_model=list[AstronautSummary])
def list_astronauts(conn: sqlite3.Connection = Depends(get_db)) -> list[AstronautSummary]:
    rows = conn.execute("SELECT * FROM daily_vitals_logs").fetchall()
    grouped: dict[str, list[dict]] = {aid: [] for aid in ASTRONAUT_IDS}
    for row in rows:
        parsed = parse_vitals_row(row)
        if parsed["astronaut_id"] in grouped:
            grouped[parsed["astronaut_id"]].append(parsed)

    summaries: list[AstronautSummary] = []
    for astronaut_id in ASTRONAUT_IDS:
        records = sorted(
            grouped[astronaut_id],
            key=lambda r: (mission_day_sort_key(r["mission_day"]), r["record_id"]),
        )
        latest = records[-1] if records else None
        count = len(records)
        avg = (
            lambda field: round(sum(r[field] for r in records) / count, 2) if count else 0.0
        )
        summaries.append(
            AstronautSummary(
                astronaut_id=astronaut_id,
                latest_record=VitalsRecord(**latest) if latest else None,
                current_alert_status=latest["overall_alert_status"] if latest else STATUS_GREEN,
                averages=AstronautAverages(
                    sleep_hours=avg("sleep_hours"),
                    stress_score_0_10=avg("stress_score_0_10"),
                    mood_unhappiness_0_10=avg("mood_unhappiness_0_10"),
                    heart_rate_bpm=avg("heart_rate_bpm"),
                    blood_sugar_mg_dl=avg("blood_sugar_mg_dl"),
                ),
                alert_counts=AlertCounts(
                    green=sum(1 for r in records if r["overall_alert_status"] == STATUS_GREEN),
                    yellow=sum(1 for r in records if r["overall_alert_status"] == STATUS_YELLOW),
                    red=sum(1 for r in records if r["overall_alert_status"] == STATUS_RED),
                ),
            )
        )
    return summaries
