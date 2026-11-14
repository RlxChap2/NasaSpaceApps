import sqlite3
from collections.abc import Generator
from pathlib import Path

from app.config import DB_PATH

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS nasa_reference_thresholds (
    indicator_id TEXT PRIMARY KEY,
    health_or_cabin_indicator TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    normal_green_range TEXT NOT NULL,
    warning_yellow_range TEXT NOT NULL,
    critical_red_threshold TEXT NOT NULL,
    real_nasa_or_inspiration4_reference_value TEXT NOT NULL,
    recommended_astronaut_countermeasure TEXT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_vitals_logs (
    record_id TEXT PRIMARY KEY,
    astronaut_id TEXT NOT NULL,
    mission_phase TEXT NOT NULL,
    mission_day TEXT NOT NULL,
    data_label TEXT NOT NULL,
    sleep_hours REAL NOT NULL,
    stress_score_0_10 REAL NOT NULL,
    mood_unhappiness_0_10 REAL NOT NULL,
    heart_rate_bpm REAL NOT NULL,
    systolic_bp_mmhg REAL NOT NULL,
    diastolic_bp_mmhg REAL NOT NULL,
    body_temp_c REAL NOT NULL,
    blood_sugar_mg_dl REAL NOT NULL,
    cabin_co2_mmhg REAL NOT NULL,
    overall_alert_status TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    triggered_alerts TEXT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT,
    UNIQUE(astronaut_id, mission_day)
);

CREATE TABLE IF NOT EXISTS real_nasa_osdr_files_map (
    file_id TEXT PRIMARY KEY,
    repository_and_study TEXT NOT NULL,
    exact_file_name TEXT NOT NULL,
    format TEXT NOT NULL,
    size_kb REAL NOT NULL,
    data_origin_label TEXT NOT NULL,
    subjects_count TEXT NOT NULL,
    timepoints_available TEXT NOT NULL,
    exact_health_measures_inside_file TEXT NOT NULL,
    public_no_login_download TEXT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS real_osdr_lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT NOT NULL,
    source_file TEXT NOT NULL,
    row_data TEXT NOT NULL,
    data_label TEXT NOT NULL,
    source_url TEXT NOT NULL
);
"""


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA_SQL)
    conn.commit()
