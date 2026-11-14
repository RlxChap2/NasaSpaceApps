import { useState } from 'react';
import crewLog from '@/data/crew-log.json';
import type { VitalsRecord } from '@/lib/api';
import MissionLink from '../MissionLink';
import { getCrewRows } from './CrewStatsTable';
import CrewStatus from './CrewStatus';
import TrendChart from './TrendChart';
import CrewDemoStats from './CrewDemoStats';
import { metrics, needsReview, type CheckIn } from './check-ins';
import styles from './CrewDashboard.module.css';

const archivedMetrics = [
  metrics[0], metrics[1],
  { id: 'systolic', name: 'Systolic pressure', unit: 'mmHg' },
  { id: 'diastolic', name: 'Diastolic pressure', unit: 'mmHg' },
  { id: 'temperature', name: 'Temperature', unit: '°C' },
  { id: 'glucose', name: 'Glucose', unit: 'mg/dL' },
  { id: 'stress', name: 'Stress score', unit: '/ 10' },
  { id: 'mood', name: 'Mood score (0 best–10 worst)', unit: '/ 10' },
  { id: 'co2', name: 'Cabin CO₂', unit: 'mmHg' },
] as const;

export default function CrewProfiles({ records, backendVitals }: { records: CheckIn[]; backendVitals?: VitalsRecord[] }) {
  const [id, setId] = useState('C001');
  const [indicator, setIndicator] = useState('heart');
  const rows = getCrewRows(records, backendVitals);
  const member = rows.find(row => row.id === id) ?? rows[0];
  const local = member.id === 'C001';
  const apiArchive = backendVitals?.filter(record => record.astronaut_id === member.id) ?? [];
  const archive = apiArchive.length
    ? apiArchive.map(record => ({
        record: record.record_id,
        day: record.mission_day,
        heart: record.heart_rate_bpm,
        sleep: record.sleep_hours,
        systolic: record.systolic_bp_mmhg,
        diastolic: record.diastolic_bp_mmhg,
        temperature: record.body_temp_c,
        glucose: record.blood_sugar_mg_dl,
        stress: record.stress_score_0_10,
        mood: record.mood_unhappiness_0_10,
        co2: record.cabin_co2_mmhg,
        source: record.data_label.startsWith('USER INPUT') ? 'manual' : 'simulated',
      }))
    : crewLog
        .filter(record => record.crew === member.id)
        .map(record => ({ ...record, source: 'simulated' }));
  const history = local ? records.map(record => ({ ...record, day: String(record.day), key: String(record.day) }))
    : archive.map(record => ({ ...record, key: record.record }));
  const latest = records.at(-1);
  const previous = records.at(-2);
  const flagged = local && latest ? metrics.filter(metric => needsReview(metric.id, latest[metric.id], previous?.[metric.id])) : [];
  const summaries = (local ? metrics : archivedMetrics).map(metric => {
    const series = history.flatMap(record => {
      const raw = record[metric.id as keyof typeof record];
      const value = Number(raw);
      return raw != null && String(raw).trim() && Number.isFinite(value) ? [{ day: record.day, value }] : [];
    });
    return { ...metric, series };
  });
  const active = summaries.find(item => item.id === indicator) ?? summaries[0];
  const display = (value: number | undefined, unit: string) => value == null ? '—' : `${Number(value.toFixed(2))} ${unit}`;

  return (
    <div className={styles.evidence}>
      <div className={styles.heading}>
        <div><h1>Crew Profiles</h1><p>Review each crew member’s available readings and follow-up flags.</p></div>
        <MissionLink href="/dashboard/body">Body Explorer</MissionLink>
      </div>
      <div className={styles.profilePicker} role="group" aria-label="Crew members">
        {rows.map(row => (
          <button key={row.id} type="button" aria-pressed={row.id === id} onClick={() => { setId(row.id); setIndicator('heart'); }}>
            <span>{row.name}<small>{row.id}</small></span>
          </button>
        ))}
      </div>
      <section className={styles.panel} aria-labelledby="crew-profile-title">
        <div className={styles.panelHeading}>
          <div><h2 id="crew-profile-title">{member.name}</h2><p className={styles.muted}>{history.length} records · Last record {member.day}</p></div>
          <CrewStatus status={member.status} label={local && member.status === 'nominal' ? 'No review flag' : undefined} />
        </div>
        <h3>Follow-up</h3>
        <p>{member.status === 'missing' ? 'No measurement available.' : member.status === 'critical' ? 'The simulated archive marks the latest record as critical.' : member.status === 'review' ? 'The latest record is flagged for review.' : 'The latest record has no review flag.'}</p>
        {flagged.length > 0 && <p>Flagged indicators: {flagged.map(item => item.name).join(', ')}.</p>}
        {local && latest?.followUp && <p>Crew member requested follow-up for this entry.</p>}
        {member.notes && <p className={styles.savedNotes}>{member.notes}</p>}
        <p className={styles.muted}>Review flags describe the record. They are not medical diagnoses.</p>
      </section>
      <CrewDemoStats memberId={member.id} />
      <section className={styles.panel} aria-label="Crew measurement statistics">
        <h2>Measurement statistics</h2>
        <div className={styles.profileMetrics}>
          {summaries.map(({ id, name, unit, series }) => {
            const values = series.map(point => point.value);
            return <button key={id} type="button" aria-pressed={active.id === id} onClick={() => setIndicator(id)}>
              <span>{name}</span><strong>{display(values.at(-1), unit)}</strong>
              <small>Average {display(values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined, unit)}</small>
              <small>{values.length} readings</small>
            </button>;
          })}
        </div>
        <h3>{active.name} history</h3>
        <TrendChart metric={{ name: active.name, unit: active.unit, color: '#dedede' }} series={active.series} monochrome showStats />
      </section>
      <section className={styles.panel} aria-labelledby="profile-history-title">
        <h2 id="profile-history-title">Record history</h2>
        {history.length ? <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Crew record history">
          <table>
            <thead><tr><th scope="col">Mission day</th>{summaries.map(metric => <th key={metric.id} scope="col">{metric.name}</th>)}<th scope="col">Source</th></tr></thead>
            <tbody>{[...history].reverse().map(record => <tr key={record.key}>
              <th scope="row">{record.day}</th>
              {summaries.map(metric => {
                const raw = record[metric.id as keyof typeof record];
                const value = raw != null && String(raw).trim() ? Number(raw) : NaN;
                return <td key={metric.id}>{display(Number.isFinite(value) ? value : undefined, metric.unit)}</td>;
              })}
              <td>{record.source === 'manual' ? 'Manual Input' : 'Simulated Data'}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p>No measurement available.</p>}
      </section>
    </div>
  );
}
