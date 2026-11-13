'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, BatteryEmpty, ExportSquare, Happyemoji, HeartSearch, InfoCircle, Minus, Moon, Radar2, TickCircle } from 'iconsax-react';
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
      </header>
      <div className={styles.content}>
        {view === 'overview' && <Overview records={records} latest={latest} />}
        {view === 'check-in' && <CheckInForm hasLocalRecords={snapshot !== null} />}
        {view === 'body' && <BodyExplorer records={records} />}
        {view === 'trends' && <HealthHistory records={records} />}
        {view === 'research' && <ResearchEvidence />}
        {view === 'crew' && <CrewProfiles records={records} />}
      </div>
    </main>
  );
}

function Overview({ records, latest }: { records: CheckIn[]; latest?: CheckIn }) {
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
  const crewRows = getCrewRows(records);

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

function CheckInForm({ hasLocalRecords }: { hasLocalRecords: boolean }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<CheckIn>();
  const [invalid, setInvalid] = useState<Partial<Record<MetricId, string>>>({});
  const [confirmDemo, setConfirmDemo] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
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
    try {
      const values = readMeasurements(form);
      setSaved(checkInRepository.save(values, String(form.get('notes') ?? '').trim(), form.has('followUp')));
    } catch (issue) {
      setError(issue instanceof Error && issue.name === 'Error' ? issue.message : 'Unable to save in this browser. Your check-in was not saved.');
    }
  }

  function loadDemo() {
    setError('');
    try {
      checkInRepository.loadDemo();
      setSaved(undefined);
      setConfirmDemo(false);
      setMessage('Demo scenario loaded. The overview now shows the simulated records.');
    } catch {
      setError('Unable to load the demo in this browser.');
    }
  }

  return (
    <div className={styles.checkIn}>
      <div className={styles.heading}>
        <div><h1>Daily Health Check-in</h1><p>Record your daily measurements to keep track of changes over time.</p></div>
      </div>
      {saved ? (
        <section className={`${styles.panel} ${styles.savedCheckIn}`} aria-label="Saved check-in">
          <div className={styles.savedHeader}>
            <TickCircle size={26} color="currentColor" variant="Bold" aria-hidden="true" />
            <div>
              <h2>Check-in saved on this device</h2>
              <p role="status">Mission Day {saved.day} · <time dateTime={saved.recordedAt}>{dateTime.format(new Date(saved.recordedAt))} UTC</time></p>
            </div>
          </div>
          <dl className={`${styles.readings} ${styles.savedReadings}`}>{metrics.map(metric => (
            <div key={metric.id}><dt>{metric.name}</dt><dd>{saved[metric.id]} {metric.unit}</dd></div>
          ))}</dl>
          {saved.notes && <div className={styles.savedNoteBlock}><h3>Notes</h3><p className={styles.savedNotes}>{saved.notes}</p></div>}
          {saved.followUp && <p className={styles.muted}>Flagged for follow-up</p>}
          <div className={styles.actions}>
            <MissionLink href="/dashboard">Back to Dashboard</MissionLink>
            <button className={styles.secondary} type="button" onClick={() => setSaved(undefined)}>Start another check-in</button>
          </div>
        </section>
      ) : (
        <form className={styles.form} onSubmit={save} noValidate>
          <div className={styles.formGrid}>
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
          </div>
          <DashboardTextarea label="Notes (optional)" name="notes" maxLength={1000} />
          <DashboardCheckbox label="Flag for follow-up" name="followUp" />
          <div className={styles.actions}>
            <DashboardButton type="submit">Save Check-in</DashboardButton>
            <button className={styles.secondary} type="button" onClick={() => hasLocalRecords ? setConfirmDemo(true) : loadDemo()}>Load Demo Scenario</button>
          </div>
          {confirmDemo && <div className={styles.confirm}><p>Replace the check-ins stored on this device with the demo scenario?</p><button type="button" onClick={loadDemo}>Replace with demo</button> <button type="button" onClick={() => setConfirmDemo(false)}>Cancel</button></div>}
          {error && <p role="alert" className={styles.review}>{error}</p>}
          {message && <p role="status">{message} <Link href="/dashboard">Open overview</Link></p>}
        </form>
      )}
    </div>
  );
}
