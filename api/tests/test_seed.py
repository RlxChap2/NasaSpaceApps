import logging
from pathlib import Path

import pytest

from app.config import INPUT_DIR, LABEL_REAL_OSDR
from app.db import get_connection
from app.seed import seed_database


def test_seed_is_idempotent(tmp_path: Path) -> None:
    db_path = tmp_path / "test.db"
    conn = get_connection(db_path)
    try:
        first = seed_database(conn, input_dir=INPUT_DIR, osdr_dir=tmp_path / "empty_osdr")
        second = seed_database(conn, input_dir=INPUT_DIR, osdr_dir=tmp_path / "empty_osdr")
        assert first == {
            "thresholds": 13,
            "daily_vitals": 40,
            "osdr_files": 10,
            "osdr_lab_results": 0,
        }
        assert second == first
    finally:
        conn.close()


def test_seed_skips_missing_data_label_and_warns_on_status_mismatch(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    input_dir = tmp_path / "input"
    input_dir.mkdir()
    csv_path = input_dir / "vitals.csv"
    csv_path.write_text(
        "\n".join(
            [
                "Record ID,Astronaut ID,Mission Phase,Mission Day,Data Label,Sleep Hours,Stress Score (0-10),Mood Unhappiness (0-10),Heart Rate (bpm),Systolic BP (mmHg),Diastolic BP (mmHg),Body Temp (°C),Blood Sugar (mg/dL),Cabin CO2 (mmHg),Overall Alert Status,Recommended In-Flight Countermeasure Action,Source Reference & Evidence Link",
                "REC-099,C001,In-Flight,FD9,,7.5,2,1,65,115,75,36.8,88,0.7,GREEN - NOMINAL,No label should skip,NATURE_I4",
                "REC-001,C001,Pre-Flight,L-3,SIMULATED - NASA Calibrated,7.8,2,1,64,114,72,36.8,86,0.5,RED - CRITICAL ALERT,Test mismatch,NATURE_I4",
            ]
        ),
        encoding="utf-8",
    )

    conn = get_connection(tmp_path / "test.db")
    try:
        with caplog.at_level(logging.WARNING):
            counts = seed_database(conn, input_dir=input_dir, osdr_dir=tmp_path / "empty_osdr")
        assert counts["daily_vitals"] == 40
        assert conn.execute(
            "SELECT 1 FROM daily_vitals_logs WHERE record_id = 'REC-099'"
        ).fetchone() is None
        row = conn.execute(
            "SELECT overall_alert_status FROM daily_vitals_logs WHERE record_id = 'REC-001'"
        ).fetchone()
        assert row["overall_alert_status"] == "GREEN - NOMINAL"
        assert "missing data_label" in caplog.text
        assert "Status mismatch for REC-001" in caplog.text
    finally:
        conn.close()


def test_seed_ingests_matching_osdr_csv(tmp_path: Path) -> None:
    osdr_dir = tmp_path / "osdr"
    osdr_dir.mkdir()
    csv_file = osdr_dir / "LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv"
    csv_file.write_text(
        "Subject,Timepoint,Glucose_mg_dL\nC001,L-3,86\nC004,R+1,94\n",
        encoding="utf-8",
    )

    conn = get_connection(tmp_path / "test.db")
    try:
        first = seed_database(conn, input_dir=INPUT_DIR, osdr_dir=osdr_dir)
        second = seed_database(conn, input_dir=INPUT_DIR, osdr_dir=osdr_dir)
        assert first["osdr_lab_results"] == 2
        assert second["osdr_lab_results"] == 2
        row = conn.execute("SELECT * FROM real_osdr_lab_results LIMIT 1").fetchone()
        assert row["file_id"] == "OSDR-04"
        assert row["data_label"] == LABEL_REAL_OSDR
    finally:
        conn.close()
