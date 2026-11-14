import csv
import json
import logging
import re
import sqlite3
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

from app.config import (DB_PATH, INPUT_DIR, LABEL_REAL_OSDR, OSDR_DIR, SOURCE_MAP)
from app.db import get_connection, init_schema
from app.engine import evaluate_astronaut_health
from app.seed_data import DAILY_VITALS, OSDR_FILES, THRESHOLDS

logger = logging.getLogger(__name__)

COLUMN_ALIASES: dict[str, str] = {
    "health_cabin_indicator": "health_or_cabin_indicator",
    "critical_alert_red_threshold": "critical_red_threshold",
    "real_nasa_inspiration4_published_reference": "real_nasa_or_inspiration4_reference_value",
    "recommended_in_flight_countermeasure_action": "recommended_action",
    "source_evidence_citation": "source",
    "source_reference_evidence_link": "source",
    "direct_repository_access_link": "source",
    "repository_study_id": "repository_and_study",
    "file_size_kb": "size_kb",
    "data_origin_type_label": "data_origin_label",
    "study_subjects_count": "subjects_count",
    "health_biological_measures_included": "exact_health_measures_inside_file",
    "public_download_no_login_required": "public_no_login_download",
}

VITAL_NUMERIC_FIELDS = ("sleep_hours", "stress_score_0_10", "mood_unhappiness_0_10",
    "heart_rate_bpm", "systolic_bp_mmhg", "diastolic_bp_mmhg",
    "body_temp_c", "blood_sugar_mg_dl", "cabin_co2_mmhg",)


def _normalize_header(header: Any) -> str:
    if header is None: return ""
    text = str(header).strip().replace("°C", "c").replace("°c", "c")
    normalized = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return COLUMN_ALIASES.get(normalized, normalized)


def _resolve_source(raw_source: str) -> tuple[str, str]:
    key = raw_source.strip()
    if key in SOURCE_MAP:
        return SOURCE_MAP[key]
    lower = key.lower()
    if "pmc12155433" in lower:
        return SOURCE_MAP["NIH_SLEEP"]
    if "nasa-std-3001" in lower:
        return SOURCE_MAP["NASA_STD_3001_V1"]
    if "osd-569" in lower:
        return SOURCE_MAP["OSDR_569"]
    if "osd-575" in lower:
        return SOURCE_MAP["OSDR_575"]
    if "osd-656" in lower:
        return SOURCE_MAP["OSDR_656"]
    if "mmash" in lower or "physionet" in lower:
        return SOURCE_MAP["PHYSIONET_MMASH"]
    if "nature" in lower or "inspiration4" in lower:
        return SOURCE_MAP["NATURE_I4"]
    return SOURCE_MAP["NATURE_I4"]


def _iter_sheet_rows(input_dir: Path) -> list[list[list[Any]]]:
    if not input_dir.exists():
        return []
    tables: list[list[list[Any]]] = []
    for path in sorted(input_dir.iterdir()):
        if path.suffix.lower() == ".csv":
            with path.open("r", encoding="utf-8-sig", newline="") as f:
                tables.append(list(csv.reader(f)))
        elif path.suffix.lower() == ".xlsx":
            wb = load_workbook(path, read_only=True, data_only=True)
            try:
                for ws in wb.worksheets:
                    tables.append([list(row) for row in ws.iter_rows(values_only=True)])
            finally:
                wb.close()
    return tables


def _extract_table_records(rows: list[list[Any]]) -> tuple[str, list[dict[str, Any]]] | None:
    pk_to_kind = {
        "indicator_id": "thresholds",
        "record_id": "vitals",
        "file_id": "osdr",
    }
    for idx, raw_row in enumerate(rows):
        headers = [_normalize_header(cell) for cell in raw_row]
        kind = next((pk_to_kind[h] for h in headers if h in pk_to_kind), None)
        if not kind:
            continue

        extracted: list[dict[str, Any]] = []
        for data_row in rows[idx + 1 :]:
            if not any(cell is not None and str(cell).strip() != "" for cell in data_row):
                break
            row_dict = {
                headers[col_i]: (
                    str(data_row[col_i]).strip() if col_i < len(data_row) and data_row[col_i] is not None else ""
                )
                for col_i in range(len(headers))
                if headers[col_i]
            }
            extracted.append(row_dict)
        return kind, extracted
    return None


def _load_spreadsheet_overrides(
    input_dir: Path,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    thresholds_rows: list[dict[str, Any]] = []
    vitals_rows: list[dict[str, Any]] = []
    osdr_rows: list[dict[str, Any]] = []

    for raw_rows in _iter_sheet_rows(input_dir):
        parsed = _extract_table_records(raw_rows)
        if not parsed:
            continue
        kind, records = parsed
        if kind == "thresholds":
            for row in records:
                if not row.get("indicator_id"):
                    continue
                if "source_label" not in row or "source_url" not in row:
                    label, url = _resolve_source(row.get("source", ""))
                    row["source_label"] = label
                    row["source_url"] = url
                thresholds_rows.append(row)
        elif kind == "vitals":
            for row in records:
                if not row.get("record_id") and not row.get("astronaut_id"):
                    continue
                if not row.get("data_label"):
                    logger.warning(
                        "Skipping spreadsheet vitals row %s: missing data_label",
                        row.get("record_id") or "<unknown>",
                    )
                    continue
                for field in VITAL_NUMERIC_FIELDS:
                    row[field] = float(row[field])
                if "source_label" not in row or "source_url" not in row:
                    label, url = _resolve_source(row.get("source", ""))
                    row["source_label"] = label
                    row["source_url"] = url
                vitals_rows.append(row)
        elif kind == "osdr":
            for row in records:
                if not row.get("file_id"):
                    continue
                if not row.get("data_origin_label"):
                    logger.warning(
                        "Skipping spreadsheet OSDR row %s: missing data_origin_label",
                        row.get("file_id"),
                    )
                    continue
                row["size_kb"] = float(row["size_kb"])
                if "source_label" not in row or "source_url" not in row:
                    label, url = _resolve_source(row.get("source", ""))
                    row["source_label"] = label
                    row["source_url"] = url
                osdr_rows.append(row)

    return thresholds_rows, vitals_rows, osdr_rows


def _upsert_thresholds(conn: sqlite3.Connection, rows: list[dict[str, Any]]) -> None:
    sql = """
    INSERT INTO nasa_reference_thresholds (
        indicator_id, health_or_cabin_indicator, category, unit,
        normal_green_range, warning_yellow_range, critical_red_threshold,
        real_nasa_or_inspiration4_reference_value, recommended_astronaut_countermeasure,
        source_label, source_url
    ) VALUES (
        :indicator_id, :health_or_cabin_indicator, :category, :unit,
        :normal_green_range, :warning_yellow_range, :critical_red_threshold,
        :real_nasa_or_inspiration4_reference_value, :recommended_astronaut_countermeasure,
        :source_label, :source_url
    )
    ON CONFLICT(indicator_id) DO UPDATE SET
        health_or_cabin_indicator = excluded.health_or_cabin_indicator,
        category = excluded.category,
        unit = excluded.unit,
        normal_green_range = excluded.normal_green_range,
        warning_yellow_range = excluded.warning_yellow_range,
        critical_red_threshold = excluded.critical_red_threshold,
        real_nasa_or_inspiration4_reference_value = excluded.real_nasa_or_inspiration4_reference_value,
        recommended_astronaut_countermeasure = excluded.recommended_astronaut_countermeasure,
        source_label = excluded.source_label,
        source_url = excluded.source_url
    """
    conn.executemany(sql, rows)


def _upsert_vitals(
    conn: sqlite3.Connection,
    rows: list[dict[str, Any]],
    threshold_map: dict[str, dict[str, Any]],
) -> None:
    sql = """
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
    ON CONFLICT(record_id) DO UPDATE SET
        astronaut_id = excluded.astronaut_id,
        mission_phase = excluded.mission_phase,
        mission_day = excluded.mission_day,
        data_label = excluded.data_label,
        sleep_hours = excluded.sleep_hours,
        stress_score_0_10 = excluded.stress_score_0_10,
        mood_unhappiness_0_10 = excluded.mood_unhappiness_0_10,
        heart_rate_bpm = excluded.heart_rate_bpm,
        systolic_bp_mmhg = excluded.systolic_bp_mmhg,
        diastolic_bp_mmhg = excluded.diastolic_bp_mmhg,
        body_temp_c = excluded.body_temp_c,
        blood_sugar_mg_dl = excluded.blood_sugar_mg_dl,
        cabin_co2_mmhg = excluded.cabin_co2_mmhg,
        overall_alert_status = excluded.overall_alert_status,
        recommended_action = excluded.recommended_action,
        triggered_alerts = excluded.triggered_alerts,
        source_label = excluded.source_label,
        source_url = excluded.source_url
    """
    prepared: list[dict[str, Any]] = []
    for row in rows:
        evaluation = evaluate_astronaut_health(row, threshold_map)
        provided_status = row.get("overall_alert_status", "")
        if provided_status and provided_status != evaluation["overall_alert_status"]:
            logger.warning(
                "Status mismatch for %s: source=%r, engine=%r",
                row["record_id"],
                provided_status,
                evaluation["overall_alert_status"],
            )
        prepared.append(
            {
                **row,
                "overall_alert_status": evaluation["overall_alert_status"],
                "recommended_action": row.get("recommended_action") or evaluation["recommended_action"],
                "triggered_alerts": json.dumps(evaluation["triggered_alerts"]),
            }
        )
    conn.executemany(sql, prepared)


def _upsert_osdr_files(conn: sqlite3.Connection, rows: list[dict[str, Any]]) -> None:
    sql = """
    INSERT INTO real_nasa_osdr_files_map (
        file_id, repository_and_study, exact_file_name, format, size_kb,
        data_origin_label, subjects_count, timepoints_available,
        exact_health_measures_inside_file, public_no_login_download,
        source_label, source_url
    ) VALUES (
        :file_id, :repository_and_study, :exact_file_name, :format, :size_kb,
        :data_origin_label, :subjects_count, :timepoints_available,
        :exact_health_measures_inside_file, :public_no_login_download,
        :source_label, :source_url
    )
    ON CONFLICT(file_id) DO UPDATE SET
        repository_and_study = excluded.repository_and_study,
        exact_file_name = excluded.exact_file_name,
        format = excluded.format,
        size_kb = excluded.size_kb,
        data_origin_label = excluded.data_origin_label,
        subjects_count = excluded.subjects_count,
        timepoints_available = excluded.timepoints_available,
        exact_health_measures_inside_file = excluded.exact_health_measures_inside_file,
        public_no_login_download = excluded.public_no_login_download,
        source_label = excluded.source_label,
        source_url = excluded.source_url
    """
    conn.executemany(sql, rows)


def _ingest_osdr_csvs(conn: sqlite3.Connection, osdr_dir: Path) -> int:
    if not osdr_dir.exists():
        return 0
    file_rows = conn.execute(
        "SELECT file_id, exact_file_name, source_url FROM real_nasa_osdr_files_map"
    ).fetchall()
    total_inserted = 0
    for file_row in file_rows:
        csv_path = osdr_dir / file_row["exact_file_name"]
        if not csv_path.is_file() or csv_path.suffix.lower() != ".csv":
            continue
        conn.execute("DELETE FROM real_osdr_lab_results WHERE file_id = ?", (file_row["file_id"],))
        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            batch = [
                (
                    file_row["file_id"],
                    file_row["exact_file_name"],
                    json.dumps(dict(row)),
                    LABEL_REAL_OSDR,
                    file_row["source_url"],
                )
                for row in reader
            ]
        conn.executemany(
            """
            INSERT INTO real_osdr_lab_results (
                file_id, source_file, row_data, data_label, source_url
            ) VALUES (?, ?, ?, ?, ?)
            """,
            batch,
        )
        total_inserted += len(batch)
    return total_inserted


def _load_threshold_map(conn: sqlite3.Connection) -> dict[str, dict[str, Any]]:
    rows = conn.execute("SELECT * FROM nasa_reference_thresholds").fetchall()
    if rows:
        return {row["indicator_id"]: dict(row) for row in rows}
    return {row["indicator_id"]: row for row in THRESHOLDS}


def seed_vitals_only(conn: sqlite3.Connection, input_dir: Path = INPUT_DIR) -> int:
    _, sheet_vitals, _ = _load_spreadsheet_overrides(input_dir)
    threshold_map = _load_threshold_map(conn)
    conn.execute("DELETE FROM daily_vitals_logs")
    _upsert_vitals(conn, DAILY_VITALS, threshold_map)
    if sheet_vitals:
        _upsert_vitals(conn, sheet_vitals, threshold_map)
    conn.commit()
    return conn.execute("SELECT COUNT(*) FROM daily_vitals_logs").fetchone()[0]


def seed_database(
    conn: sqlite3.Connection,
    input_dir: Path = INPUT_DIR,
    osdr_dir: Path = OSDR_DIR,
) -> dict[str, int]:
    init_schema(conn)
    sheet_thresholds, sheet_vitals, sheet_osdr = _load_spreadsheet_overrides(input_dir)

    _upsert_thresholds(conn, THRESHOLDS)
    if sheet_thresholds:
        _upsert_thresholds(conn, sheet_thresholds)

    threshold_map = _load_threshold_map(conn)
    _upsert_vitals(conn, DAILY_VITALS, threshold_map)
    if sheet_vitals:
        _upsert_vitals(conn, sheet_vitals, threshold_map)

    _upsert_osdr_files(conn, OSDR_FILES)
    if sheet_osdr:
        _upsert_osdr_files(conn, sheet_osdr)

    _ingest_osdr_csvs(conn, osdr_dir)
    conn.commit()

    return {
        "thresholds": conn.execute("SELECT COUNT(*) FROM nasa_reference_thresholds").fetchone()[0],
        "daily_vitals": conn.execute("SELECT COUNT(*) FROM daily_vitals_logs").fetchone()[0],
        "osdr_files": conn.execute("SELECT COUNT(*) FROM real_nasa_osdr_files_map").fetchone()[0],
        "osdr_lab_results": conn.execute("SELECT COUNT(*) FROM real_osdr_lab_results").fetchone()[0],
    }


def auto_seed_if_empty(db_path: Path = DB_PATH, input_dir: Path = INPUT_DIR, osdr_dir: Path = OSDR_DIR) -> None:
    conn = get_connection(db_path)
    try:
        init_schema(conn)
        core_tables = ("nasa_reference_thresholds", "daily_vitals_logs", "real_nasa_osdr_files_map")
        needs_seed = any(
            conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] == 0
            for table in core_tables
        )
        if needs_seed:
            seed_database(conn, input_dir=input_dir, osdr_dir=osdr_dir)
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    connection = get_connection()
    try:
        counts = seed_database(connection)
        print(
            f"Seeded: {counts['thresholds']} thresholds, "
            f"{counts['daily_vitals']} daily records, "
            f"{counts['osdr_files']} OSDR files, "
            f"{counts['osdr_lab_results']} OSDR lab results."
        )
    finally:
        connection.close()
