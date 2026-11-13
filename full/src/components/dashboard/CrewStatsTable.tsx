import { useState } from 'react';
import { Profile2User } from 'iconsax-react';
import crewLog from '@/data/crew-log.json';
import { metrics, needsReview, type CheckIn } from './check-ins';
import styles from './CrewDashboard.module.css';
import CrewStatus, { type Status } from './CrewStatus';

const crew = [
  { id: 'C002', name: 'Jordan Lee' },
  { id: 'C003', name: 'Sam Rivera' },
  { id: 'C004', name: 'Taylor Chen' },
];

type CrewRow = { id: string; name: string; day: string; heart?: number | string; sleep?: number | string; fatigue?: number; mood?: number; status: Status; pressure?: string; temperature?: string; glucose?: string; notes?: string };

export function getCrewRows(records: CheckIn[]): CrewRow[] {
  const latest = records.at(-1);
  const previous = records.at(-2);
  return [
    {
      id: 'C001', name: 'Alex Morgan',
      day: latest ? String(latest.day) : '—', heart: latest?.heart, sleep: latest?.sleep, fatigue: latest?.fatigue, mood: latest?.mood,
      notes: latest?.notes,
      status: !latest ? 'missing' : latest.followUp || metrics.some(metric => needsReview(metric.id, latest[metric.id], previous?.[metric.id])) ? 'review' : 'nominal',
    },
    ...crew.map((member): CrewRow => {
      const entry = crewLog.filter(record => record.crew === member.id).at(-1);
      return {
        ...member, day: entry?.day ?? '—', heart: entry?.heart, sleep: entry?.sleep,
        pressure: entry ? `${Number(entry.systolic)}/${Number(entry.diastolic)} mmHg` : undefined,
        temperature: entry ? `${Number(entry.temperature)} °C` : undefined,
        glucose: entry ? `${Number(entry.glucose)} mg/dL` : undefined,
        status: !entry ? 'missing' : entry.status.startsWith('RED') ? 'critical' : entry.status.startsWith('GREEN') ? 'nominal' : 'review',
      };
    }),
  ];

}

export default function CrewStatsTable({ rows }: { rows: ReturnType<typeof getCrewRows> }) {
  const [view, setView] = useState<'overview' | 'details'>('overview');
  return (
    <section className={`${styles.panel} ${styles.crewTable}`} aria-labelledby="crew-table-title">
      <div className={styles.panelHeading}>
        <h2 id="crew-table-title"><Profile2User size={21} color="currentColor" aria-hidden="true" /> Crew statistics</h2>
        <span className={styles.badge}>{rows.length} crew members</span>
      </div>
      <div className={styles.crewTabs} role="group" aria-label="Crew statistics view">
        <button type="button" aria-pressed={view === 'overview'} onClick={() => setView('overview')}>Overview</button>
        <button type="button" aria-pressed={view === 'details'} onClick={() => setView('details')}>More measurements</button>
      </div>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Crew measurements">
        <table>
          <thead><tr><th scope="col">Crew member</th><th scope="col">Last day</th>{(view === 'overview' ? ['Heart rate', 'Sleep', 'Fatigue', 'Mood'] : ['Blood pressure', 'Temperature', 'Glucose', 'Notes']).map(label => <th key={label} scope="col">{label}</th>)}<th scope="col">Status</th></tr></thead>
          <tbody key={view}>
            {rows.map(row => {
              return (
                <tr key={row.id}>
                  <th scope="row">
                    <span className={styles.member}>
                      <span>{row.name}<small>{row.id}</small></span>
                    </span>
                  </th>
                  <td>{row.day}</td>
                  {view === 'overview' ? <>
                  <td>{row.heart == null ? '—' : `${Number(row.heart)} bpm`}</td>
                  <td>{row.sleep == null ? '—' : `${Number(row.sleep)} h`}</td>
                  <td>{row.fatigue == null ? '—' : `${row.fatigue} / 5`}</td>
                  <td>{row.mood == null ? '—' : `${row.mood} / 5`}</td>
                  </> : <>
                    <td>{row.pressure ?? '—'}</td>
                    <td>{row.temperature ?? '—'}</td>
                    <td>{row.glucose ?? '—'}</td>
                    <td className={styles.crewNotes}>{row.notes || '—'}</td>
                  </>}
                  <td><CrewStatus status={row.status} label={row.id === 'C001' && row.status === 'nominal' ? 'No review flag' : undefined} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.muted}>Simulated records · — means no comparable measurement</p>
    </section>
  );
}
