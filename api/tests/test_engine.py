import pytest

from app.config import STATUS_GREEN, STATUS_RED, STATUS_YELLOW
from app.engine import evaluate_astronaut_health
from app.seed_data import DAILY_VITALS, THRESHOLDS

NOMINAL_READING = {
    "sleep_hours": 7.5,
    "stress_score_0_10": 2,
    "mood_unhappiness_0_10": 1,
    "heart_rate_bpm": 70,
    "systolic_bp_mmhg": 115,
    "diastolic_bp_mmhg": 75,
    "body_temp_c": 37.0,
    "blood_sugar_mg_dl": 85,
    "cabin_co2_mmhg": 0.8,
}


@pytest.mark.parametrize(
    ("field", "value", "expected_status"),
    [
        ("sleep_hours", 5.9, STATUS_RED),
        ("sleep_hours", 6.0, STATUS_YELLOW),
        ("sleep_hours", 6.9, STATUS_YELLOW),
        ("sleep_hours", 7.0, STATUS_GREEN),
        ("sleep_hours", 8.5, STATUS_GREEN),
        ("sleep_hours", 10.0, STATUS_GREEN),
        ("stress_score_0_10", 3, STATUS_GREEN),
        ("stress_score_0_10", 4, STATUS_YELLOW),
        ("stress_score_0_10", 6, STATUS_YELLOW),
        ("stress_score_0_10", 7, STATUS_RED),
        ("mood_unhappiness_0_10", 3, STATUS_GREEN),
        ("mood_unhappiness_0_10", 4, STATUS_YELLOW),
        ("mood_unhappiness_0_10", 6, STATUS_YELLOW),
        ("mood_unhappiness_0_10", 7, STATUS_RED),
        ("heart_rate_bpm", 49, STATUS_RED),
        ("heart_rate_bpm", 50, STATUS_YELLOW),
        ("heart_rate_bpm", 54, STATUS_YELLOW),
        ("heart_rate_bpm", 55, STATUS_GREEN),
        ("heart_rate_bpm", 85, STATUS_GREEN),
        ("heart_rate_bpm", 86, STATUS_YELLOW),
        ("heart_rate_bpm", 99, STATUS_YELLOW),
        ("heart_rate_bpm", 100, STATUS_RED),
        ("systolic_bp_mmhg", 84, STATUS_RED),
        ("systolic_bp_mmhg", 85, STATUS_YELLOW),
        ("systolic_bp_mmhg", 89, STATUS_YELLOW),
        ("systolic_bp_mmhg", 90, STATUS_GREEN),
        ("systolic_bp_mmhg", 119, STATUS_GREEN),
        ("systolic_bp_mmhg", 120, STATUS_YELLOW),
        ("systolic_bp_mmhg", 139, STATUS_YELLOW),
        ("systolic_bp_mmhg", 140, STATUS_RED),
        ("diastolic_bp_mmhg", 54, STATUS_RED),
        ("diastolic_bp_mmhg", 55, STATUS_YELLOW),
        ("diastolic_bp_mmhg", 59, STATUS_YELLOW),
        ("diastolic_bp_mmhg", 60, STATUS_GREEN),
        ("diastolic_bp_mmhg", 79, STATUS_GREEN),
        ("diastolic_bp_mmhg", 80, STATUS_YELLOW),
        ("diastolic_bp_mmhg", 89, STATUS_YELLOW),
        ("diastolic_bp_mmhg", 90, STATUS_RED),
        ("body_temp_c", 35.9, STATUS_RED),
        ("body_temp_c", 36.0, STATUS_YELLOW),
        ("body_temp_c", 36.4, STATUS_YELLOW),
        ("body_temp_c", 36.5, STATUS_GREEN),
        ("body_temp_c", 37.5, STATUS_GREEN),
        ("body_temp_c", 37.55, STATUS_YELLOW),
        ("body_temp_c", 37.6, STATUS_YELLOW),
        ("body_temp_c", 38.0, STATUS_YELLOW),
        ("body_temp_c", 38.1, STATUS_RED),
        ("blood_sugar_mg_dl", 59, STATUS_RED),
        ("blood_sugar_mg_dl", 60, STATUS_YELLOW),
        ("blood_sugar_mg_dl", 69, STATUS_YELLOW),
        ("blood_sugar_mg_dl", 70, STATUS_GREEN),
        ("blood_sugar_mg_dl", 99, STATUS_GREEN),
        ("blood_sugar_mg_dl", 100, STATUS_YELLOW),
        ("blood_sugar_mg_dl", 125, STATUS_YELLOW),
        ("blood_sugar_mg_dl", 126, STATUS_RED),
        ("cabin_co2_mmhg", 0.2, STATUS_GREEN),
        ("cabin_co2_mmhg", 0.4, STATUS_GREEN),
        ("cabin_co2_mmhg", 2.0, STATUS_GREEN),
        ("cabin_co2_mmhg", 2.05, STATUS_YELLOW),
        ("cabin_co2_mmhg", 2.9, STATUS_YELLOW),
        ("cabin_co2_mmhg", 3.0, STATUS_RED),
    ],
)
def test_field_boundaries(field: str, value: float, expected_status: str) -> None:
    reading = {**NOMINAL_READING, field: value}
    result = evaluate_astronaut_health(reading, THRESHOLDS)
    assert result["overall_alert_status"] == expected_status
    if expected_status == STATUS_GREEN:
        assert result["triggered_alerts"] == []
        assert result["recommended_action"] == "Nominal routine - no action required"
    else:
        assert len(result["triggered_alerts"]) == 1
        assert result["triggered_alerts"][0]["field"] == field


def test_recommended_action_orders_red_first_and_prefixes_critical() -> None:
    reading = {
        **NOMINAL_READING,
        "sleep_hours": 6.5,
        "blood_sugar_mg_dl": 130,
    }
    result = evaluate_astronaut_health(reading, THRESHOLDS)
    assert result["overall_alert_status"] == STATUS_RED
    assert result["recommended_action"].startswith("CRITICAL: ")
    sugar_cm = next(t for t in THRESHOLDS if t["indicator_id"] == "IND-10")[
        "recommended_astronaut_countermeasure"
    ]
    sleep_cm = next(t for t in THRESHOLDS if t["indicator_id"] == "IND-01")[
        "recommended_astronaut_countermeasure"
    ]
    assert result["recommended_action"] == f"CRITICAL: {sugar_cm}; {sleep_cm}"


def test_seeded_40_rows_match_engine_and_status_counts() -> None:
    counts = {STATUS_GREEN: 0, STATUS_YELLOW: 0, STATUS_RED: 0}
    for row in DAILY_VITALS:
        result = evaluate_astronaut_health(row, THRESHOLDS)
        assert result["overall_alert_status"] == row["overall_alert_status"], row["record_id"]
        counts[result["overall_alert_status"]] += 1

    assert counts[STATUS_GREEN] == 21
    assert counts[STATUS_YELLOW] == 15
    assert counts[STATUS_RED] == 4
