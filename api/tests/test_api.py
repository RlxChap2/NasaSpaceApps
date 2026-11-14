from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import INPUT_DIR, LABEL_USER_INPUT, STATUS_GREEN, STATUS_RED, USER_SOURCE_LABEL
from app.db import get_connection, get_db
from app.main import app
from app.seed import seed_database, seed_vitals_only


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    db_path = tmp_path / "api_test.db"
    osdr_dir = tmp_path / "osdr"
    osdr_dir.mkdir()
    (osdr_dir / "LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv").write_text(
        "Subject,Timepoint,Glucose_mg_dL\nC001,L-3,86\n",
        encoding="utf-8",
    )

    conn = get_connection(db_path)
    seed_database(conn, input_dir=INPUT_DIR, osdr_dir=osdr_dir)
    conn.close()

    def override_get_db():
        c = get_connection(db_path)
        try:
            yield c
        finally:
            c.close()

    def override_seed_vitals(c):
        return seed_vitals_only(c, input_dir=INPUT_DIR)

    monkeypatch.setattr("app.main.auto_seed_if_empty", lambda: None)
    monkeypatch.setattr("app.routers.vitals.seed_vitals_only", override_seed_vitals)
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


def test_health_and_cors(client: TestClient) -> None:
    response = client.get("/api/health", headers={"Origin": "http://localhost:3847"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "*"
    assert response.json() == {
        "status": "ok",
        "database": "connected",
        "totalDailyRecords": 40,
        "totalThresholds": 13,
        "totalOsdrFiles": 10,
    }


def test_astronauts_summary(client: TestClient) -> None:
    response = client.get("/api/astronauts")
    assert response.status_code == 200
    data = response.json()
    assert [item["astronaut_id"] for item in data] == ["C001", "C002", "C003", "C004"]
    c001 = data[0]
    assert c001["latest_record"]["mission_day"] == "R+3"
    assert c001["current_alert_status"] == STATUS_GREEN
    assert c001["averages"] == {
        "sleep_hours": 7.06,
        "stress_score_0_10": 3.5,
        "mood_unhappiness_0_10": 1.6,
        "heart_rate_bpm": 70.9,
        "blood_sugar_mg_dl": 91.3,
    }
    assert c001["alert_counts"] == {"green": 5, "yellow": 5, "red": 0}


def test_vitals_ordering_filters_and_validation(client: TestClient) -> None:
    res = client.get("/api/vitals", params={"astronautId": "C001"})
    assert res.status_code == 200
    days = [row["mission_day"] for row in res.json()]
    assert days == ["L-3", "L-1", "FD1", "FD2", "FD3", "FD4", "FD5", "FD6", "R+1", "R+3"]

    red_res = client.get("/api/vitals", params={"alertStatus": "red"})
    assert red_res.status_code == 200
    assert len(red_res.json()) == 4

    assert client.get("/api/vitals", params={"alertStatus": "BLUE"}).status_code == 422
    assert client.get("/api/vitals", params={"astronautId": "C999"}).status_code == 422
    assert client.get("/api/vitals", params={"missionPhase": "Orbital"}).status_code == 422
    assert client.get("/api/vitals", params={"missionDay": "DAY1"}).status_code == 422


def test_post_vitals_and_reset(client: TestClient) -> None:
    nominal_payload = {
        "astronaut_id": "C001",
        "mission_phase": "In-Flight",
        "mission_day": "FD7",
        "sleep_hours": 7.5,
        "stress_score_0_10": 2,
        "mood_unhappiness_0_10": 1,
        "heart_rate_bpm": 68,
        "systolic_bp_mmhg": 116,
        "diastolic_bp_mmhg": 74,
        "body_temp_c": 36.9,
        "blood_sugar_mg_dl": 88,
        "cabin_co2_mmhg": 0.8,
    }
    created = client.post("/api/vitals", json=nominal_payload)
    assert created.status_code == 201
    body = created.json()
    assert body["record_id"] == "REC-041"
    assert body["data_label"] == LABEL_USER_INPUT
    assert body["source_label"] == USER_SOURCE_LABEL
    assert body["source_url"] is None
    assert body["overall_alert_status"] == STATUS_GREEN
    assert body["triggered_alerts"] == []

    duplicate = client.post("/api/vitals", json=nominal_payload)
    assert duplicate.status_code == 409

    critical_payload = {
        "astronaut_id": "C002",
        "mission_phase": "Post-Flight",
        "mission_day": "R+5",
        "sleep_hours": 5.5,
        "stress_score_0_10": 8,
        "mood_unhappiness_0_10": 2,
        "heart_rate_bpm": 72,
        "systolic_bp_mmhg": 115,
        "diastolic_bp_mmhg": 75,
        "body_temp_c": 37.0,
        "blood_sugar_mg_dl": 90,
        "cabin_co2_mmhg": 0.6,
    }
    crit_res = client.post("/api/vitals", json=critical_payload)
    assert crit_res.status_code == 201
    crit_body = crit_res.json()
    assert crit_body["record_id"] == "REC-042"
    assert crit_body["overall_alert_status"] == STATUS_RED
    assert len(crit_body["triggered_alerts"]) == 2
    assert all(alert["source_url"].startswith("https://") for alert in crit_body["triggered_alerts"])

    bad_phase = client.post(
        "/api/vitals",
        json={**nominal_payload, "mission_day": "R+2"},
    )
    assert bad_phase.status_code == 422

    bad_range = client.post(
        "/api/vitals",
        json={**nominal_payload, "mission_day": "FD8", "sleep_hours": 30},
    )
    assert bad_range.status_code == 422

    reset_res = client.post("/api/vitals/reset")
    assert reset_res.status_code == 200
    assert reset_res.json() == {"status": "reset", "totalDailyRecords": 40}


def test_thresholds_analytics_and_osdr(client: TestClient) -> None:
    thresholds_res = client.get("/api/thresholds")
    assert thresholds_res.status_code == 200
    assert len(thresholds_res.json()) == 13

    analytics_res = client.get("/api/analytics/summary")
    assert analytics_res.status_code == 200
    summary = analytics_res.json()
    assert summary["fleetStatusCounts"] == {
        "green": 21,
        "yellow": 15,
        "red": 4,
        "total": 40,
        "greenPct": 52.5,
        "yellowPct": 37.5,
        "redPct": 10.0,
    }
    assert set(summary["byMissionPhase"].keys()) == {"Pre-Flight", "In-Flight", "Post-Flight"}
    assert set(summary["byAstronaut"].keys()) == {"C001", "C002", "C003", "C004"}
    assert len(summary["fleetExtrema"]) == 9
    assert summary["fleetExtrema"]["sleep_hours"] == {"min": 5.6, "avg": 6.99, "max": 8.1}

    osdr_files = client.get("/api/osdr-files")
    assert osdr_files.status_code == 200
    files = osdr_files.json()
    assert len(files) == 10
    osdr_04 = next(f for f in files if f["file_id"] == "OSDR-04")
    assert osdr_04["parsed_row_count"] == 1

    lab_results = client.get("/api/osdr-lab-results", params={"fileId": "OSDR-04"})
    assert lab_results.status_code == 200
    assert len(lab_results.json()) == 1
    assert lab_results.json()[0]["row_data"]["Subject"] == "C001"
