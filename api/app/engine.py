from collections.abc import Callable, Mapping, Sequence
from typing import Any

from app.config import SEVERITY_RED, SEVERITY_YELLOW, STATUS_GREEN, STATUS_RED, STATUS_YELLOW

Rule = tuple[str, str, Callable[[float], bool], Callable[[float], bool]]

# Evaluation order is fixed so triggered_alerts and countermeasures are deterministic.
RULES: tuple[Rule, ...] = (
    ("sleep_hours", "IND-01", lambda v: v < 6.0, lambda v: v < 7.0),
    ("stress_score_0_10", "IND-02", lambda v: v >= 7, lambda v: v >= 4),
    ("mood_unhappiness_0_10", "IND-03", lambda v: v >= 7, lambda v: v >= 4),
    ("heart_rate_bpm", "IND-05", lambda v: v < 50 or v >= 100, lambda v: v < 55 or v >= 86),
    ("systolic_bp_mmhg", "IND-07", lambda v: v < 85 or v >= 140, lambda v: v < 90 or v >= 120),
    ("diastolic_bp_mmhg", "IND-08", lambda v: v < 55 or v >= 90, lambda v: v < 60 or v >= 80),
    ("body_temp_c", "IND-09", lambda v: v < 36.0 or v > 38.0, lambda v: v < 36.5 or v > 37.5),
    ("blood_sugar_mg_dl", "IND-10", lambda v: v < 60 or v >= 126, lambda v: v < 70 or v >= 100),
    ("cabin_co2_mmhg", "IND-11", lambda v: v >= 3.0, lambda v: v > 2.0),
)


def _index_thresholds(thresholds: Sequence[Mapping[str, Any]] | Mapping[str, Mapping[str, Any]]) -> dict[str, Mapping[str, Any]]:
    if isinstance(thresholds, Mapping):
        return dict(thresholds)
    return {row["indicator_id"]: row for row in thresholds}


def evaluate_astronaut_health(reading: Mapping[str, Any], thresholds: Sequence[Mapping[str, Any]] | Mapping[str, Mapping[str, Any]]) -> dict[str, Any]:
    threshold_map = _index_thresholds(thresholds)
    triggered_alerts: list[dict[str, Any]] = []

    for field, indicator_id, is_red, is_yellow in RULES:
        value = float(reading[field])
        if is_red(value):
            severity = SEVERITY_RED
        elif is_yellow(value):
            severity = SEVERITY_YELLOW
        else:
            continue

        threshold = threshold_map[indicator_id]
        triggered_alerts.append(
            {
                "indicator_id": indicator_id,
                "indicator": threshold["health_or_cabin_indicator"],
                "field": field,
                "value": reading[field],
                "unit": threshold["unit"],
                "severity": severity,
                "reference_range": (
                    threshold["critical_red_threshold"]
                    if severity == SEVERITY_RED
                    else threshold["warning_yellow_range"]
                ),
                "green_range": threshold["normal_green_range"],
                "countermeasure": threshold["recommended_astronaut_countermeasure"],
                "source_url": threshold["source_url"],
            }
        )

    has_red = any(alert["severity"] == SEVERITY_RED for alert in triggered_alerts)
    has_yellow = any(alert["severity"] == SEVERITY_YELLOW for alert in triggered_alerts)

    if has_red:
        overall_alert_status = STATUS_RED
    elif has_yellow:
        overall_alert_status = STATUS_YELLOW
    else:
        overall_alert_status = STATUS_GREEN

    if not triggered_alerts:
        recommended_action = "Nominal routine - no action required"
    else:
        ordered = [
            *(a for a in triggered_alerts if a["severity"] == SEVERITY_RED),
            *(a for a in triggered_alerts if a["severity"] == SEVERITY_YELLOW),
        ]
        countermeasures = list(dict.fromkeys(a["countermeasure"] for a in ordered))
        joined = "; ".join(countermeasures)
        recommended_action = f"CRITICAL: {joined}" if has_red else joined

    return {
        "overall_alert_status": overall_alert_status,
        "recommended_action": recommended_action,
        "triggered_alerts": triggered_alerts,
    }
