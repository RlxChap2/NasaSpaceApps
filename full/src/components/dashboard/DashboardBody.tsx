import { useState } from 'react';
import { ArrowDown2, ArrowLeft, ArrowRight, ExportSquare, TickCircle } from 'iconsax-react';
import crewLog from '@/data/crew-log.json';
import { metrics, nasa, needsReview, type CheckIn } from './check-ins';
import { getCrewRows } from './CrewStatsTable';
import CrewStatus from './CrewStatus';
import CrewBodyFigure from './CrewBodyFigure';
import TrendChart from './TrendChart';
import styles from './CrewDashboard.module.css';

const systems = {
  heart: { title: 'Heart / Cardiovascular System', short: 'Heart', text: 'Pulse and blood pressure describe different aspects of circulation. NASA studies how spaceflight affects the heart and blood vessels during and after missions.', source: nasa.heart },
  brain: { title: 'Brain / Sleep & Behavioral Health', short: 'Sleep & behavior', text: 'Sleep, fatigue and mood help track day-to-day function and alertness. They are behavioral indicators, not direct measurements of brain health.', source: nasa.behavior },
  muscle: { title: 'Musculoskeletal System', short: 'Muscles & bones', text: 'Changes in gravity alter how bones and muscles are loaded. Dedicated strength or bone measurements would be needed to track this system.', source: nasa.hazards },
} as const;

type System = keyof typeof systems;

const archiveCharts = {
  heart: [
    { field: 'heart', name: 'Heart Rate', unit: 'bpm' },
    { field: 'systolic', name: 'Systolic Pressure', unit: 'mmHg' },
    { field: 'diastolic', name: 'Diastolic Pressure', unit: 'mmHg' },
  ],
  brain: [
    { field: 'sleep', name: 'Sleep Duration', unit: 'h' },
    { field: 'stress', name: 'Stress Score', unit: '/ 10' },
    { field: 'mood', name: 'Mood Score (0 best–10 worst)', unit: '/ 10' },
  ],
} as const;

export default function DashboardBody({ records }: { records: CheckIn[] }) {
  const [selected, setSelected] = useState<System>('heart');
  const [hovered, setHovered] = useState<System>();
  const active = hovered ?? selected;
  const [crewId, setCrewId] = useState('C001');
  const [angle, setAngle] = useState(0);
  const rows = getCrewRows(records);
  const member = rows.find(row => row.id === crewId) ?? rows[0];
  const local = member.id === 'C001';
  const history = local ? [] : crewLog.filter(record => record.crew === member.id);
  const latest = records.at(-1);
  const previous = records.at(-2);
  const sourceRecord = history.at(-1);
  const system = systems[active];
  const measurements = [
    ['Heart rate', member.heart == null ? undefined : `${Number(member.heart)} bpm`],
    ['Sleep duration', member.sleep == null ? undefined : `${Number(member.sleep)} h`],
    ['Fatigue level', member.fatigue == null ? undefined : `${member.fatigue} / 5`],
    ['Mood level', member.mood == null ? undefined : `${member.mood} / 5`],
    ['Blood pressure', member.pressure], ['Temperature', member.temperature], ['Glucose', member.glucose],
    ['Stress score (0–10)', sourceRecord?.stress], ['Mood score (0 best–10 worst)', sourceRecord?.mood],
  ] as const;
  const details = active === 'heart' ? [measurements[0], measurements[4]] : measurements.slice(1, 4);
  const regionMetrics = active === 'heart' ? metrics.slice(0, 1) : metrics.slice(1);
  const flagged = local && latest ? regionMetrics.filter(metric => needsReview(metric.id, latest[metric.id], previous?.[metric.id])) : [];

  function readings(items: ReadonlyArray<readonly [string, string | undefined]>) {
    return <dl className={styles.readings}>{items.map(([label, value]) => (
      <div key={label}><dt>{label}</dt><dd>{value ?? 'No measurement available'}</dd></div>
    ))}</dl>;
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.heading}>
        <div><h1>Body Explorer</h1><p>Point to a region to preview it, or select it to keep its details open.</p></div>
        <div className={styles.crewPicker}>
          <span>Crew member</span>
          <details onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.currentTarget.open = false;
            event.currentTarget.querySelector('summary')?.focus();
          }}>
            <summary>{member.name}<ArrowDown2 size={16} color="currentColor" aria-hidden="true" /></summary>
            <ul aria-label="Crew members">
              {rows.map(row => (
                <li key={row.id}><button type="button" aria-pressed={row.id === member.id} onClick={event => {
                  setCrewId(row.id);
                  const picker = event.currentTarget.closest('details');
                  if (picker) {
                    picker.open = false;
                    picker.querySelector('summary')?.focus();
                  }
                }}>
                  <span>{row.name}</span>
                  {row.id === member.id && <TickCircle size={16} color="currentColor" aria-hidden="true" />}
                </button></li>
              ))}
            </ul>
          </details>
        </div>
      </div>
      <div className={styles.bodyGrid}>
        <div className={`${styles.panel} ${styles.explorerMap}`}>
          <div className={styles.bodyMap}>
            <CrewBodyFigure angle={angle} selected={active} onHover={setHovered} onSelect={setSelected} />
          </div>
          <div className={styles.crewTabs} role="group" aria-label="Rotate anatomy model">
            <button type="button" aria-label="Rotate left" onClick={() => setAngle(value => (value - 45) % 360)}><ArrowLeft size={16} color="currentColor" aria-hidden="true" /></button>
            <button type="button" onClick={() => setAngle(0)}>Front view</button>
            <button type="button" aria-label="Rotate right" onClick={() => setAngle(value => (value + 45) % 360)}><ArrowRight size={16} color="currentColor" aria-hidden="true" /></button>
          </div>
          <div className={styles.crewTabs} role="group" aria-label="Body systems">
            {(Object.keys(systems) as System[]).map(id => <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}>{systems[id].short}</button>)}
          </div>
        </div>
        <div className={styles.bodyDetails}>
          <section className={styles.panel} id="system-details" aria-labelledby="system-title">
            <h2 id="system-title" aria-live="polite">{system.title}</h2>
            <div key={active} className={styles.systemContent}>
            <p>{system.text}</p>
            {active === 'muscle' ? <><p className={styles.badge}>Research Information Only</p><p>No measurement available</p></> : <>
              {readings(details)}
              {local && latest && <p><CrewStatus status={flagged.length ? 'review' : 'nominal'} label={flagged.length ? undefined : 'No review flag'} />{flagged.length > 0 && ` · ${flagged.map(metric => metric.name).join(', ')}`}</p>}
              <div className={styles.bodyCharts}>
                {local ? regionMetrics.map(metric => (
                  <section key={metric.id} className={styles.bodyChart}>
                    <h3>{metric.name}</h3>
                    <TrendChart metric={metric} records={records.slice(-7)} monochrome showStats />
                  </section>
                )) : archiveCharts[active].map(({ field, name, unit }) => (
                  <section key={field} className={styles.bodyChart}>
                    <h3>{name}</h3>
                    <TrendChart metric={{ name, unit, color: '#dedede', max: unit === '/ 10' ? 10 : undefined }}
                      series={history.slice(-7).flatMap(entry => {
                        const raw = entry[field];
                        const value = Number(raw);
                        return raw?.trim() && Number.isFinite(value) ? [{ day: entry.day, value }] : [];
                      })} monochrome showStats />
                  </section>
                ))}
              </div>
            </>}
            <a href={system.source} target="_blank" rel="noreferrer">NASA research <ExportSquare size={15} color="currentColor" aria-hidden="true" /></a>
            </div>
          </section>
          <section className={styles.panel}>
            <h2>Radiation Exposure</h2>
            <p className={styles.badge}>Research Information Only</p>
            <p>No measurement available. A dosimeter is needed to record exposure.</p>
            <a href={nasa.hazards} target="_blank" rel="noreferrer">NASA spaceflight hazards <ExportSquare size={15} color="currentColor" aria-hidden="true" /></a>
          </section>
        </div>
      </div>
      <section className={`${styles.panel} ${styles.crewHealthRecord}`} aria-label="Crew health record">
        <div className={styles.panelHeading}>
          <div className={styles.member}><div><h2>{member.name}</h2><small>{member.id} · Last record {member.day}</small></div></div>
          <CrewStatus status={member.status} label={local && member.status === 'nominal' ? 'No review flag' : undefined} />
        </div>
        {readings(local ? measurements.slice(0, 4) : measurements)}
        {member.notes && <p className={styles.savedNotes}>{member.notes}</p>}
        <p className={styles.muted}>Simulated records. Status reflects the recorded review flag for this example.</p>
      </section>
    </div>
  );
}
