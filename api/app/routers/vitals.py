import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import (ASTRONAUT_IDS,LABEL_USER_INPUT,MISSION_PHASES,USER_SOURCE_LABEL)
from app.db import get_db
from app.engine import evaluate_astronaut_health
from app.schemas import (MISSION_DAY_PATTERN,VitalsCreate,VitalsRecord,VitalsResetResponse,mission_day_sort_key,parse_vitals_row)
from app.seed import seed_vitals_only

router = APIRouter(prefix="/api", tags=["vitals"])


def _next_record_id(conn: sqlite3.Connection) -> str:
    rows = conn.execute("SELECT record_id FROM daily_vitals_logs").fetchall()
    max_num = 0
    for row in rows:
        rid = row["record_id"]
        if rid.startswith("REC-") and rid[4:].isdigit():
            max_num = max(max_num, int(rid[4:]))
    return f"REC-{max_num + 1:03d}"


@router.get("/vitals", response_model=list[VitalsRecord])
def list_vitals(
    astronautId: str | None = Query(default=None),
    missionPhase: str | None = Query(default=None),
    missionDay: str | None = Query(default=None),
    alertStatus: str | None = Query(default=None),
    conn: sqlite3.Connection = Depends(get_db),
) -> list[VitalsRecord]:
    clauses: list[str] = []
    params: list[str] = []

    if astronautId is not None:
        if astronautId not in ASTRONAUT_IDS:
            raise HTTPException(status_code=422, detail=f"Invalid astronautId: {astronautId}")
        clauses.append("astronaut_id = ?")
        params.append(astronautId)

    if missionPhase is not None:
        if missionPhase not in MISSION_PHASES:
            raise HTTPException(status_code=422, detail=f"Invalid missionPhase: {missionPhase}")
        clauses.append("mission_phase = ?")
        params.append(missionPhase)

    if missionDay is not None:
        if not MISSION_DAY_PATTERN.match(missionDay):
            raise HTTPException(status_code=422, detail=f"Invalid missionDay: {missionDay}")
        clauses.append("mission_day = ?")
        params.append(missionDay)

    if alertStatus is not None:
        normalized_status = alertStatus.upper()
        if normalized_status not in {"GREEN", "YELLOW", "RED"}:
            raise HTTPException(status_code=422, detail=f"Invalid alertStatus: {alertStatus}")
        clauses.append("UPPER(overall_alert_status) LIKE ?")
        params.append(f"{normalized_status}%")

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = conn.execute(f"SELECT * FROM daily_vitals_logs {where_sql}", params).fetchall()
    parsed = [parse_vitals_row(row) for row in rows]
    parsed.sort(
        key=lambda r: (
            mission_day_sort_key(r["mission_day"]),
            r["astronaut_id"],
            r["record_id"],
        )
    )
    return [VitalsRecord(**item) for item in parsed]


@router.post("/vitals", response_model=VitalsRecord, status_code=status.HTTP_201_CREATED)
def create_vitals(payload: VitalsCreate,conn: sqlite3.Connection = Depends(get_db)) -> VitalsRecord:
    existing = conn.execute(
        "SELECT 1 FROM daily_vitals_logs WHERE astronaut_id = ? AND mission_day = ?",
        (payload.astronaut_id, payload.mission_day),
    ).fetchone()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Record already exists for {payload.astronaut_id} on {payload.mission_day}")

    thresholds = [dict(r) for r in conn.execute("SELECT * FROM nasa_reference_thresholds").fetchall()]
    reading = payload.model_dump()
    evaluation = evaluate_astronaut_health(reading, thresholds)
    record_id = _next_record_id(conn)

    record = {
        **reading,
        "record_id": record_id,
        "data_label": LABEL_USER_INPUT,
        "overall_alert_status": evaluation["overall_alert_status"],
        "recommended_action": evaluation["recommended_action"],
        "triggered_alerts": evaluation["triggered_alerts"],
        "source_label": USER_SOURCE_LABEL,
        "source_url": None,
    }

    conn.execute(
        """
        INSERT INTO daily_vitals_logs (
            record_id, astronaut_id, mission_phase, mission_day, data_label,
            sleep_hours, stress_score_0_10, mood_unhappiness_0_10, heart_rate_bpm,
            systolic_bp_mmhg, diastolic_bp_mmhg, body_temp_c, blood_sugar_mg_dl,
            cabin_co2_mmhg, overall_alert_status, recommended_action, triggered_alerts,
            source_label, source_url
        ) VALUES (
            :record_id, :astronaut_id, :mission_phase, :mission_day, :data_label,
            :sleep_hours, :stress_score_0_10, :mood_unhappiness_0_10, :heart_rate_bpm,
            :systolic_bp_mmhg, :diastolic_bp_mmhg, :body_temp_c, :blood_sugar_mg_dl,
            :cabin_co2_mmhg, :overall_alert_status, :recommended_action, :triggered_alerts,
            :source_label, :source_url
        )
        """,
        {
            **record,
            "triggered_alerts": json.dumps(evaluation["triggered_alerts"]),
        },
    )
    conn.commit()
    return VitalsRecord(**record)


@router.post("/vitals/reset", response_model=VitalsResetResponse)
def reset_vitals(conn: sqlite3.Connection = Depends(get_db)) -> VitalsResetResponse:
    total = seed_vitals_only(conn)
    return VitalsResetResponse(status="reset", totalDailyRecords=total)
