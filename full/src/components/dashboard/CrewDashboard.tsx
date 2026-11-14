'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, BatteryEmpty, ExportSquare, Happyemoji, HeartSearch, InfoCircle, Minus, Moon, Radar2, TickCircle } from 'iconsax-react';
import { createVitals, fetchHealth, fetchVitals, nextMissionDay, resetVitals, type AstronautId, type HealthResponse, type MissionPhase, type VitalsRecord } from '@/lib/api';
import MissionLink from '../MissionLink';
import { DashboardButton, DashboardCheckbox, DashboardInput, DashboardSelect, DashboardTextarea } from './DashboardControls';
import { checkInRepository, metrics, needsReview, readCheckIns, readMeasurements, type CheckIn, type MetricId } from './check-ins';
import TrendChart from './TrendChart';
import CrewStatsTable, { getCrewRows } from './CrewStatsTable';
import CrewCharts from './CrewCharts';
import CrewStatus from './CrewStatus';
import BodyExplorer from './DashboardBody';
import HealthHistory from './HealthHistory';
import ResearchEvidence from './ResearchEvidence';
import CrewProfiles from './CrewProfiles';
import styles from './CrewDashboard.module.css';

const icons = { heart: HeartSearch, sleep: Moon, fatigue: BatteryEmpty, mood: Happyemoji };
const serverSnapshot = () => null;
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

export default function CrewDashboard({ view }: { view: 'overview' | 'check-in' | 'body' | 'trends' | 'research' | 'crew' }) {
  const snapshot = useSyncExternalStore(checkInRepository.subscribe, checkInRepository.snapshot, serverSnapshot);
  const records = useMemo(() => {
    try { return readCheckIns(snapshot); } catch { return readCheckIns(null); }
  }, [snapshot]);
  const latest = records.at(-1);
  const [backendVitals, setBackendVitals] = useState<VitalsRecord[]>([]);
  const [apiHealth, setApiHealth] = useState<HealthResponse | null>(null);

  const refreshBackend = useCallback(async () => {
    try {
      const [vitals, health] = await Promise.all([fetchVitals(), fetchHealth()]);
      setBackendVitals(vitals);
      setApiHealth(health);
    } catch {
      setApiHealth(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchVitals(), fetchHealth()])
      .then(([vitals, health]) => {
        if (!active) return;
        setBackendVitals(vitals);
        setApiHealth(health);
      })
      .catch(() => {
        if (active) setApiHealth(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={view === 'overview' ? `${styles.page} ${styles.overview}` : styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/"><Radar2 size={18} color="currentColor" variant="Bold" aria-hidden="true" /> Crew State Health</Link>
        <nav aria-label="Dashboard">
          <Link href="/dashboard" aria-current={view === 'overview' ? 'page' : undefined}>Overview</Link>
          <Link href="/dashboard/check-in" aria-current={view === 'check-in' ? 'page' : undefined}>Check-in</Link>
          <Link href="/dashboard/body" aria-current={view === 'body' ? 'page' : undefined}>Body Explorer</Link>
          <Link href="/dashboard/trends" aria-current={view === 'trends' ? 'page' : undefined}>Health Trends</Link>
          <Link href="/dashboard/crew" aria-current={view === 'crew' ? 'page' : undefined}>Crew Profiles</Link>
          <Link href="/dashboard/research" aria-current={view === 'research' ? 'page' : undefined}>Research &amp; Evidence</Link>
        </nav>
        {apiHealth && <span className={styles.badge} title="FastAPI + SQLite connected">API · {apiHealth.totalDailyRecords} records</span>}
      </header>
      <div className={styles.content}>
        {view === 'overview' && <Overview records={records} latest={latest} backendVitals={backendVitals} />}
        {view === 'check-in' && <CheckInForm hasLocalRecords={snapshot !== null} backendVitals={backendVitals} onBackendChange={refreshBackend} />}
        {view === 'body' && <BodyExplorer records={records} backendVitals={backendVitals} />}
        {view === 'trends' && <HealthHistory records={records} />}
        {view === 'research' && <ResearchEvidence />}
        {view === 'crew' && <CrewProfiles records={records} backendVitals={backendVitals} />}
      </div>
    </main>
  );
}

function Overview({ records, latest, backendVitals }: { records: CheckIn[]; latest?: CheckIn; backendVitals: VitalsRecord[] }) {
  const [metricId, setMetric] = useState<MetricId>('sleep');
  const [period, setPeriod] = useState(7);
  const metric = metrics.find(item => item.id === metricId)!;
  const previous = records.at(-2);
  const recent = records.filter(record => latest && record.day > latest.day - period);
  const first = recent[0];
  const difference = latest && first ? +(latest[metricId] - first[metricId]).toFixed(1) : 0;
  const flagged = latest ? metrics.filter(item => needsReview(item.id, latest[item.id], previous?.[item.id])) : [];
  const average = recent.length ? recent.reduce((sum, entry) => sum + entry[metricId], 0) / recent.length : undefined;
  const entriesWithFlags = records.filter(record => record.followUp);
  const crewRows = getCrewRows(records, backendVitals);

  return (
    <>
      <div className={styles.heading}>
        <div>
          <h1>Crew Health Overview</h1>
          <p>Mission Day {latest?.day ?? '—'} <span>·</span> Alex Morgan <span>·</span> Last check-in {latest ? dateTime.format(new Date(latest.recordedAt)) + ' UTC' : '—'}</p>
        </div>
        <MissionLink href="/dashboard/check-in">Start Daily Check-in</MissionLink>
      </div>
      <div className={styles.overviewGrid}>
      <section className={styles.metrics} aria-label="Latest health indicators">
        {metrics.map(item => {
          const Icon = icons[item.id];
          const delta = latest && previous ? +(latest[item.id] - previous[item.id]).toFixed(1) : undefined;
          const Direction = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
          const review = flagged.includes(item);
          return (
            <article className={styles.card} key={item.id}>
              <div className={styles.metricHeader}>
                <Icon size={18} color="currentColor" variant="Bold" aria-hidden="true" />
                <CrewStatus status={!latest ? 'missing' : review ? 'review' : 'nominal'} label={latest && !review ? 'No review flag' : undefined} />
              </div>
              <h2>{item.name}</h2>
              <p className={styles.value}>{latest?.[item.id] ?? '—'} <small>{item.unit}</small></p>
              <p className={styles.delta}><Direction size={15} color="currentColor" aria-hidden="true" />{delta === undefined ? 'No previous reading' : delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta} ${item.unit} vs previous`}</p>
              <a href="#health-trends" onClick={() => setMetric(item.id)} aria-label={`View details: ${item.name}`}>View Details <ExportSquare size={18} color="currentColor" aria-hidden="true" /></a>
            </article>
          );
        })}
      </section>

        <section className={`${styles.panel} ${styles.heroChart}`} id="health-trends" aria-labelledby="trends-title">
          <div className={styles.panelHeading}>
            <h2 id="trends-title">Health Trends</h2>
            <div className={styles.filters}>
              <DashboardSelect label="Indicator" value={metricId} onChange={event => setMetric(event.target.value as MetricId)}>
                {metrics.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </DashboardSelect>
              <DashboardSelect label="Period" value={period} onChange={event => setPeriod(Number(event.target.value))}>
                {[3, 7, 14, 30].map(days => <option key={days} value={days}>Last {days} days</option>)}
              </DashboardSelect>
            </div>
          </div>
          <dl className={styles.chartStats}>
            <div><dt>Latest</dt><dd>{latest?.[metricId] ?? '—'} <small>{metric.unit}</small></dd></div>
            <div><dt>Period average</dt><dd>{average?.toFixed(1) ?? '—'} <small>{metric.unit}</small></dd></div>
            <div><dt>Period change</dt><dd>{recent.length > 1 ? `${difference > 0 ? '+' : ''}${difference}` : '—'} <small>{metric.unit}</small></dd></div>
          </dl>
          <TrendChart metric={metric} records={recent} monochrome bars />
        </section>
        <section className={`${styles.panel} ${styles.crewCard}`} aria-labelledby="crew-card-title">
          <div className={styles.crewCardCopy}>
            <h2 id="crew-card-title">Alex Morgan</h2>
            <p>Mission Day {latest?.day ?? '—'}</p>
            <strong>{records.length}</strong>
            <span>Recorded check-ins</span>
            <span>{flagged.length + entriesWithFlags.length} pending follow-ups</span>
          </div>
        </section>
        <CrewCharts rows={crewRows} records={records} />
        <CrewStatsTable rows={crewRows} />
      </div>
    </>
  );
}

function CheckInForm({
  hasLocalRecords,
  backendVitals,
  onBackendChange,
}: {
  hasLocalRecords: boolean;
  backendVitals: VitalsRecord[];
  onBackendChange: () => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<{ checkIn: CheckIn; backendRecord?: VitalsRecord }>();
  const [invalid, setInvalid] = useState<Partial<Record<MetricId, string>>>({});
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [astronautId, setAstronautId] = useState<AstronautId>('C001');
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('In-Flight');
  const [customMissionDay, setCustomMissionDay] = useState<string | null>(null);
  const suggestedMissionDay = nextMissionDay(backendVitals, astronautId, missionPhase);
  const missionDay = customMissionDay ?? suggestedMissionDay;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const formElement = event.currentTarget;
    const errors: Partial<Record<MetricId, string>> = {};
    for (const metric of metrics) {
      const field = formElement.elements.namedItem(metric.id);
      if ((field instanceof HTMLInputElement || field instanceof HTMLSelectElement) && !field.validity.valid) {
        errors[metric.id] = field.validity.valueMissing
          ? `Enter ${metric.name.toLowerCase()}.`
          : `Enter a value from ${metric.min} to ${metric.max}${metric.step === 1 ? ' using whole numbers' : ' with up to one decimal place'}.`;
      }
    }
    setInvalid(errors);
    const firstInvalid = metrics.find(metric => errors[metric.id]);
    if (firstInvalid) {
      (formElement.elements.namedItem(firstInvalid.id) as HTMLElement | null)?.focus();
      return;
    }
    const form = new FormData(formElement);
    setSubmitting(true);
    try {
      const values = readMeasurements(form);
      const notes = String(form.get('notes') ?? '').trim();
      const followUp = form.has('followUp');
      const backendRecord = await createVitals({
        astronaut_id: astronautId,
        mission_phase: missionPhase,
        mission_day: String(form.get('missionDay') ?? missionDay).trim(),
        sleep_hours: values.sleep,
        stress_score_0_10: Number(((values.fatigue - 1) * 2.5).toFixed(1)),
        mood_unhappiness_0_10: Number(((5 - values.mood) * 2.5).toFixed(1)),
        heart_rate_bpm: values.heart,
        systolic_bp_mmhg: Number(form.get('systolic') || 115),
        diastolic_bp_mmhg: Number(form.get('diastolic') || 74),
        body_temp_c: Number(form.get('temperature') || 36.9),
        blood_sugar_mg_dl: Number(form.get('glucose') || 90),
        cabin_co2_mmhg: Number(form.get('co2') || 0.8),
      });
      const checkIn: CheckIn = astronautId === 'C001'
        ? checkInRepository.save(values, notes, followUp)
        : {
            ...values,
            day: Number(backendRecord.record_id.replace(/\D+/g, '')) || 41,
            recordedAt: new Date().toISOString(),
            notes,
            followUp,
            source: 'manual',
          };
      await onBackendChange();
      setCustomMissionDay(null);
      setSaved({ checkIn, backendRecord });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to save check-in to the backend API.');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadDemo() {
    setError('');
    setSubmitting(true);
    try {
      await resetVitals();
      checkInRepository.loadDemo();
      await onBackendChange();
      setSaved(undefined);
      setConfirmDemo(false);
      setMessage('Demo scenario reset on backend SQLite (40 baseline records) and browser storage.');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to reset the demo scenario.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.checkIn}>
      <div className={styles.heading}>
        <div><h1>Daily Health Check-in</h1><p>Enter fictional crew measurements and see how the demo rules classify them.</p></div>
      </div>
      {saved ? (
        <section className={`${styles.panel} ${styles.savedCheckIn}`} aria-label="Saved check-in">
          <div className={styles.savedHeader}>
            <TickCircle size={26} color="currentColor" variant="Bold" aria-hidden="true" />
            <div>
              <h2>Check-in saved to FastAPI + SQLite{saved.backendRecord ? ` (${saved.backendRecord.record_id})` : ''}</h2>
              <p role="status">
                {saved.backendRecord ? `${saved.backendRecord.astronaut_id} · ${saved.backendRecord.mission_phase} ${saved.backendRecord.mission_day}` : `Mission Day ${saved.checkIn.day}`} · <time dateTime={saved.checkIn.recordedAt}>{dateTime.format(new Date(saved.checkIn.recordedAt))} UTC</time>
              </p>
            </div>
          </div>
          {saved.backendRecord && (
            <div className={styles.savedNoteBlock}>
              <h3>Backend Alert Evaluation: {saved.backendRecord.overall_alert_status}</h3>
              <p className={styles.savedNotes}>{saved.backendRecord.recommended_action}</p>
              <p className={styles.muted}>{saved.backendRecord.data_label}</p>
              {saved.backendRecord.triggered_alerts.length > 0 && (
                <ul className={styles.followups}>
                  {saved.backendRecord.triggered_alerts.map(alert => (
                    <li key={alert.indicator_id}>
                      <strong>[{alert.severity}] {alert.indicator}:</strong> {alert.value} {alert.unit} (green: {alert.green_range}) — {alert.countermeasure}{' '}
                      <a href={alert.source_url} target="_blank" rel="noreferrer">Source</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <dl className={`${styles.readings} ${styles.savedReadings}`}>{metrics.map(metric => (
            <div key={metric.id}><dt>{metric.name}</dt><dd>{saved.checkIn[metric.id]} {metric.unit}</dd></div>
          ))}</dl>
          {saved.checkIn.notes && <div className={styles.savedNoteBlock}><h3>Notes</h3><p className={styles.savedNotes}>{saved.checkIn.notes}</p></div>}
          {saved.checkIn.followUp && <p className={styles.muted}>Flagged for follow-up</p>}
          <div className={styles.actions}>
            <MissionLink href="/dashboard">Back to Dashboard</MissionLink>
            <button className={styles.secondary} type="button" onClick={() => setSaved(undefined)}>Start another check-in</button>
          </div>
        </section>
      ) : (
        <form className={styles.form} onSubmit={save} noValidate>
          <div className={styles.formGrid}>
            <DashboardSelect label="Crew Member" name="astronautId" value={astronautId} onChange={event => { setAstronautId(event.target.value as AstronautId); setCustomMissionDay(null); }}>
              <option value="C001">C001 · Alex Morgan</option>
              <option value="C002">C002 · Jordan Lee</option>
              <option value="C003">C003 · Sam Rivera</option>
              <option value="C004">C004 · Taylor Chen</option>
            </DashboardSelect>
            <DashboardSelect label="Mission Phase" name="missionPhase" value={missionPhase} onChange={event => { setMissionPhase(event.target.value as MissionPhase); setCustomMissionDay(null); }}>
              <option value="Pre-Flight">Pre-Flight (L-n)</option>
              <option value="In-Flight">In-Flight (FDn)</option>
              <option value="Post-Flight">Post-Flight (R+n)</option>
            </DashboardSelect>
            <DashboardInput label="Mission Day" name="missionDay" type="text" value={missionDay} onChange={event => setCustomMissionDay(event.target.value)} required />
            {metrics.map(metric => (
              <div key={metric.id} className={styles.checkInField}>
                {metric.max === 5 ? (
                  <DashboardSelect label={metric.name} name={metric.id} defaultValue="" required aria-invalid={!!invalid[metric.id]} aria-describedby={`help-${metric.id}` + (invalid[metric.id] ? ` error-${metric.id}` : '')}>
                    <option value="" disabled>Select 1–5</option>
                    {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}
                  </DashboardSelect>
                ) : <DashboardInput label={`${metric.name} (${metric.unit})`} name={metric.id} type="number" min={metric.min} max={metric.max} step={metric.step} required aria-invalid={!!invalid[metric.id]} aria-describedby={`help-${metric.id}` + (invalid[metric.id] ? ` error-${metric.id}` : '')} />}
                <p id={`help-${metric.id}`} className={styles.help}><InfoCircle size={15} color="currentColor" aria-hidden="true" /> {metric.help}</p>
                {invalid[metric.id] && <p id={`error-${metric.id}`} className={styles.fieldError} role="alert">{invalid[metric.id]}</p>}
              </div>
            ))}
            <DashboardInput label="Systolic BP (mmHg)" name="systolic" type="number" min={40} max={260} step={1} defaultValue={115} />
            <DashboardInput label="Diastolic BP (mmHg)" name="diastolic" type="number" min={20} max={180} step={1} defaultValue={74} />
            <DashboardInput label="Body Temp (°C)" name="temperature" type="number" min={30} max={45} step={0.1} defaultValue={36.9} />
            <DashboardInput label="Blood Sugar (mg/dL)" name="glucose" type="number" min={20} max={600} step={1} defaultValue={90} />
            <DashboardInput label="Cabin CO₂ (mmHg)" name="co2" type="number" min={0} max={20} step={0.1} defaultValue={0.8} />
          </div>
          <DashboardTextarea label="Notes (optional)" name="notes" maxLength={1000} />
          <DashboardCheckbox label="Flag for follow-up" name="followUp" />
          <div className={styles.actions}>
            <DashboardButton type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Check-in'}</DashboardButton>
            <button className={styles.secondary} type="button" disabled={submitting} onClick={() => hasLocalRecords ? setConfirmDemo(true) : loadDemo()}>Load Demo Scenario</button>
          </div>
          {confirmDemo && <div className={styles.confirm}><p>Reset the backend database and browser storage back to the 40-record baseline demo?</p><button type="button" onClick={loadDemo}>Replace with demo</button> <button type="button" onClick={() => setConfirmDemo(false)}>Cancel</button></div>}
          {error && <p role="alert" className={styles.review}>{error}</p>}
          {message && <p role="status">{message} <Link href="/dashboard">Open overview</Link></p>}
        </form>
      )}
    </div>
  );
}
