import json
import re
import sqlite3
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

MISSION_DAY_PATTERN = re.compile(r"^(?:L-([1-9]\d*)|FD([1-9]\d*)|R\+(\d+))$")
PHASE_DAY_PATTERNS: dict[str, re.Pattern[str]] = {
    "Pre-Flight": re.compile(r"^L-[1-9]\d*$"),
    "In-Flight": re.compile(r"^FD[1-9]\d*$"),
    "Post-Flight": re.compile(r"^R\+\d+$"),
}


def mission_day_sort_key(mission_day: str) -> tuple[int, int]:
    if mission_day.startswith("L-"):
        return (0, -int(mission_day[2:]))
    if mission_day.startswith("FD"):
        return (1, int(mission_day[2:]))
    if mission_day.startswith("R+"):
        return (2, int(mission_day[2:]))
    return (3, 0)


def parse_vitals_row(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["triggered_alerts"] = json.loads(data["triggered_alerts"])
    return data


class HealthResponse(BaseModel):
    status: str
    database: str
    totalDailyRecords: int
    totalThresholds: int
    totalOsdrFiles: int


class TriggeredAlert(BaseModel):
    indicator_id: str
    indicator: str
    field: str
    value: float
    unit: str
    severity: Literal["YELLOW", "RED"]
    reference_range: str
    green_range: str
    countermeasure: str
    source_url: str


class VitalsCreate(BaseModel):
    astronaut_id: Literal["C001", "C002", "C003", "C004"]
    mission_phase: Literal["Pre-Flight", "In-Flight", "Post-Flight"]
    mission_day: str
    sleep_hours: float = Field(ge=0, le=24)
    stress_score_0_10: float = Field(ge=0, le=10)
    mood_unhappiness_0_10: float = Field(ge=0, le=10)
    heart_rate_bpm: float = Field(ge=20, le=250)
    systolic_bp_mmhg: float = Field(ge=40, le=260)
    diastolic_bp_mmhg: float = Field(ge=20, le=180)
    body_temp_c: float = Field(ge=30, le=45)
    blood_sugar_mg_dl: float = Field(ge=20, le=600)
    cabin_co2_mmhg: float = Field(ge=0, le=20)

    @model_validator(mode="after")
    def check_mission_day_phase(self) -> "VitalsCreate":
        pattern = PHASE_DAY_PATTERNS[self.mission_phase]
        if not pattern.match(self.mission_day):
            raise ValueError(
                f"mission_day {self.mission_day!r} does not match mission_phase {self.mission_phase!r}"
            )
        return self


class VitalsRecord(BaseModel):
    record_id: str
    astronaut_id: str
    mission_phase: str
    mission_day: str
    data_label: str
    sleep_hours: float
    stress_score_0_10: float
    mood_unhappiness_0_10: float
    heart_rate_bpm: float
    systolic_bp_mmhg: float
    diastolic_bp_mmhg: float
    body_temp_c: float
    blood_sugar_mg_dl: float
    cabin_co2_mmhg: float
    overall_alert_status: str
    recommended_action: str
    triggered_alerts: list[TriggeredAlert]
    source_label: str
    source_url: str | None = None


class VitalsResetResponse(BaseModel):
    status: str
    totalDailyRecords: int


class AstronautAverages(BaseModel):
    sleep_hours: float
    stress_score_0_10: float
    mood_unhappiness_0_10: float
    heart_rate_bpm: float
    blood_sugar_mg_dl: float


class AlertCounts(BaseModel):
    green: int
    yellow: int
    red: int


class AstronautSummary(BaseModel):
    astronaut_id: str
    latest_record: VitalsRecord | None
    current_alert_status: str
    averages: AstronautAverages
    alert_counts: AlertCounts


class ThresholdRecord(BaseModel):
    indicator_id: str
    health_or_cabin_indicator: str
    category: str
    unit: str
    normal_green_range: str
    warning_yellow_range: str
    critical_red_threshold: str
    real_nasa_or_inspiration4_reference_value: str
    recommended_astronaut_countermeasure: str
    source_label: str
    source_url: str


class FleetStatusCounts(BaseModel):
    green: int
    yellow: int
    red: int
    total: int
    greenPct: float
    yellowPct: float
    redPct: float


class SegmentSummary(BaseModel):
    total: int
    sleep_hours: float
    stress_score_0_10: float
    mood_unhappiness_0_10: float
    heart_rate_bpm: float
    systolic_bp_mmhg: float
    diastolic_bp_mmhg: float
    body_temp_c: float
    blood_sugar_mg_dl: float
    green: int
    yellow: int
    red: int


class ExtremaStats(BaseModel):
    min: float
    avg: float
    max: float


class AnalyticsSummaryResponse(BaseModel):
    fleetStatusCounts: FleetStatusCounts
    byMissionPhase: dict[str, SegmentSummary]
    byAstronaut: dict[str, SegmentSummary]
    fleetExtrema: dict[str, ExtremaStats]


class OsdrFileRecord(BaseModel):
    file_id: str
    repository_and_study: str
    exact_file_name: str
    format: str
    size_kb: float
    data_origin_label: str
    subjects_count: str
    timepoints_available: str
    exact_health_measures_inside_file: str
    public_no_login_download: str
    source_label: str
    source_url: str
    parsed_row_count: int


class OsdrLabResultRecord(BaseModel):
    id: int
    file_id: str
    source_file: str
    row_data: dict[str, Any]
    data_label: str
    source_url: str
