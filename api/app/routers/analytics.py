import sqlite3
from typing import Any

from fastapi import APIRouter, Depends

from app.config import (ASTRONAUT_IDS, MISSION_PHASES, STATUS_GREEN, STATUS_RED, STATUS_YELLOW)
from app.db import get_db
from app.schemas import ( AnalyticsSummaryResponse, ExtremaStats, FleetStatusCounts, SegmentSummary)

router = APIRouter(prefix="/api", tags=["analytics"])

SEGMENT_AVG_FIELDS = (
    "sleep_hours",
    "stress_score_0_10",
    "mood_unhappiness_0_10",
    "heart_rate_bpm",
    "systolic_bp_mmhg",
    "diastolic_bp_mmhg",
    "body_temp_c",
    "blood_sugar_mg_dl",
)

ALL_NUMERIC_FIELDS = (*SEGMENT_AVG_FIELDS, "cabin_co2_mmhg")


def _summarize_segment(rows: list[dict[str, Any]]) -> SegmentSummary:
    total = len(rows)
    averages = {
        field: round(sum(r[field] for r in rows) / total, 2) if total else 0.0
        for field in SEGMENT_AVG_FIELDS
    }
    return SegmentSummary(
        total=total,
        **averages,
        green=sum(1 for r in rows if r["overall_alert_status"] == STATUS_GREEN),
        yellow=sum(1 for r in rows if r["overall_alert_status"] == STATUS_YELLOW),
        red=sum(1 for r in rows if r["overall_alert_status"] == STATUS_RED),
    )


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(conn: sqlite3.Connection = Depends(get_db)) -> AnalyticsSummaryResponse:
    rows = [dict(row) for row in conn.execute("SELECT * FROM daily_vitals_logs").fetchall()]
    total = len(rows)
    green = sum(1 for r in rows if r["overall_alert_status"] == STATUS_GREEN)
    yellow = sum(1 for r in rows if r["overall_alert_status"] == STATUS_YELLOW)
    red = sum(1 for r in rows if r["overall_alert_status"] == STATUS_RED)

    pct = lambda count: round((count / total) * 100, 2) if total else 0.0
    fleet_status = FleetStatusCounts( green=green, yellow=yellow, red=red, total=total, greenPct=pct(green), yellowPct=pct(yellow), redPct=pct(red))

    by_phase = {
        phase: _summarize_segment([r for r in rows if r["mission_phase"] == phase])
        for phase in MISSION_PHASES
    }
    by_astronaut = {
        aid: _summarize_segment([r for r in rows if r["astronaut_id"] == aid])
        for aid in ASTRONAUT_IDS
    }

    fleet_extrema: dict[str, ExtremaStats] = {}
    for field in ALL_NUMERIC_FIELDS:
        values = [r[field] for r in rows]
        if values:
            fleet_extrema[field] = ExtremaStats(
                min=round(min(values), 2),
                avg=round(sum(values) / len(values), 2),
                max=round(max(values), 2),
            )
        else:
            fleet_extrema[field] = ExtremaStats(min=0.0, avg=0.0, max=0.0)

    return AnalyticsSummaryResponse(
        fleetStatusCounts=fleet_status,
        byMissionPhase=by_phase,
        byAstronaut=by_astronaut,
        fleetExtrema=fleet_extrema,
    )
