export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export type AstronautId = 'C001' | 'C002' | 'C003' | 'C004';
export type MissionPhase = 'Pre-Flight' | 'In-Flight' | 'Post-Flight';

export interface TriggeredAlert {
  indicator_id: string;
  indicator: string;
  field: string;
  value: number;
  unit: string;
  severity: 'YELLOW' | 'RED';
  reference_range: string;
  green_range: string;
  countermeasure: string;
  source_url: string;
}

export interface VitalsRecord {
  record_id: string;
  astronaut_id: string;
  mission_phase: MissionPhase;
  mission_day: string;
  data_label: string;
  sleep_hours: number;
  stress_score_0_10: number;
  mood_unhappiness_0_10: number;
  heart_rate_bpm: number;
  systolic_bp_mmhg: number;
  diastolic_bp_mmhg: number;
  body_temp_c: number;
  blood_sugar_mg_dl: number;
  cabin_co2_mmhg: number;
  overall_alert_status: string;
  recommended_action: string;
  triggered_alerts: TriggeredAlert[];
  source_label: string;
  source_url: string | null;
}

export interface VitalsCreatePayload {
  astronaut_id: AstronautId;
  mission_phase: MissionPhase;
  mission_day: string;
  sleep_hours: number;
  stress_score_0_10: number;
  mood_unhappiness_0_10: number;
  heart_rate_bpm: number;
  systolic_bp_mmhg: number;
  diastolic_bp_mmhg: number;
  body_temp_c: number;
  blood_sugar_mg_dl: number;
  cabin_co2_mmhg: number;
}

export interface HealthResponse {
  status: string;
  database: string;
  totalDailyRecords: number;
  totalThresholds: number;
  totalOsdrFiles: number;
}

export interface ThresholdRecord {
  indicator_id: string;
  health_or_cabin_indicator: string;
  category: string;
  unit: string;
  normal_green_range: string;
  warning_yellow_range: string;
  critical_red_threshold: string;
  real_nasa_or_inspiration4_reference_value: string;
  recommended_astronaut_countermeasure: string;
  source_label: string;
  source_url: string;
}

export interface OsdrFileRecord {
  file_id: string;
  repository_and_study: string;
  exact_file_name: string;
  format: string;
  size_kb: number;
  data_origin_label: string;
  subjects_count: string;
  timepoints_available: string;
  exact_health_measures_inside_file: string;
  public_no_login_download: string;
  source_label: string;
  source_url: string;
  parsed_row_count: number;
}

export interface AstronautSummary {
  astronaut_id: string;
  latest_record: VitalsRecord | null;
  current_alert_status: string;
  averages: {
    sleep_hours: number;
    stress_score_0_10: number;
    mood_unhappiness_0_10: number;
    heart_rate_bpm: number;
    blood_sugar_mg_dl: number;
  };
  alert_counts: {
    green: number;
    yellow: number;
    red: number;
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
        message = data.detail[0].msg;
      }
    } catch {
      // Ignore JSON parse errors on error responses.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health');
}

export function fetchVitals(params?: {
  astronautId?: string;
  missionPhase?: string;
  missionDay?: string;
  alertStatus?: string;
}): Promise<VitalsRecord[]> {
  const query = new URLSearchParams();
  if (params?.astronautId) query.set('astronautId', params.astronautId);
  if (params?.missionPhase) query.set('missionPhase', params.missionPhase);
  if (params?.missionDay) query.set('missionDay', params.missionDay);
  if (params?.alertStatus) query.set('alertStatus', params.alertStatus);
  const qs = query.toString();
  return apiFetch<VitalsRecord[]>(`/api/vitals${qs ? `?${qs}` : ''}`);
}

export function fetchAstronauts(): Promise<AstronautSummary[]> {
  return apiFetch<AstronautSummary[]>('/api/astronauts');
}

export function createVitals(payload: VitalsCreatePayload): Promise<VitalsRecord> {
  return apiFetch<VitalsRecord>('/api/vitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resetVitals(): Promise<{ status: string; totalDailyRecords: number }> {
  return apiFetch<{ status: string; totalDailyRecords: number }>('/api/vitals/reset', {
    method: 'POST',
  });
}

export function fetchThresholds(): Promise<ThresholdRecord[]> {
  return apiFetch<ThresholdRecord[]>('/api/thresholds');
}

export function fetchOsdrFiles(): Promise<OsdrFileRecord[]> {
  return apiFetch<OsdrFileRecord[]>('/api/osdr-files');
}

export function nextMissionDay(
  records: VitalsRecord[],
  astronautId: AstronautId,
  missionPhase: MissionPhase,
): string {
  const crewDays = records
    .filter(record => record.astronaut_id === astronautId && record.mission_phase === missionPhase)
    .map(record => record.mission_day);

  const prefix = missionPhase === 'Pre-Flight' ? 'L-' : missionPhase === 'In-Flight' ? 'FD' : 'R+';
  const maxNum = crewDays.reduce((max, day) => {
    if (!day.startsWith(prefix)) return max;
    const num = Number(day.slice(prefix.length));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `${prefix}${maxNum + 1}`;
}
