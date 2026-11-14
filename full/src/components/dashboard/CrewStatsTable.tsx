import { useState } from 'react';
import { Profile2User } from 'iconsax-react';
import crewLog from '@/data/crew-log.json';
import type { VitalsRecord } from '@/lib/api';
import { metrics, needsReview, type CheckIn } from './check-ins';
import styles from './CrewDashboard.module.css';
import CrewStatus, { type Status } from './CrewStatus';

const crew = [
  { id: 'C002', name: 'Jordan Lee' },
  { id: 'C003', name: 'Sam Rivera' },
  { id: 'C004', name: 'Taylor Chen' },
];

type CrewRow = { id: string; name: string; day: string; heart?: number | string; sleep?: number | string; fatigue?: number; mood?: number; status: Status; pressure?: string; temperature?: string; glucose?: string; notes?: string };

function mapBackendStatus(overallStatus: string): Status {
  if (overallStatus.startsWith('RED')) return 'critical';
  if (overallStatus.startsWith('GREEN')) return 'nominal';
  return 'review';
}

export function getCrewRows(records: CheckIn[], backendVitals?: VitalsRecord[]): CrewRow[] {
  const latest = records.at(-1);
  const previous = records.at(-2);
  const c001Backend = backendVitals?.filter(record => record.astronaut_id === 'C001').at(-1);
  const c001LocalStatus: Status = !latest
    ? 'missing'
    : latest.followUp || metrics.some(metric => needsReview(metric.id, latest[metric.id], previous?.[metric.id]))
      ? 'review'
      : 'nominal';
  const c001Status: Status =
    c001Backend && c001Backend.data_label.startsWith('USER INPUT')
      ? mapBackendStatus(c001Backend.overall_alert_status)
      : c001LocalStatus;

  return [
    {
      id: 'C001', name: 'Alex Morgan',
      day: c001Backend && c001Backend.data_label.startsWith('USER INPUT') ? c001Backend.mission_day : latest ? String(latest.day) : '—',
      heart: c001Backend && c001Backend.data_label.startsWith('USER INPUT') ? c001Backend.heart_rate_bpm : latest?.heart,
      sleep: c001Backend && c001Backend.data_label.startsWith('USER INPUT') ? c001Backend.sleep_hours : latest?.sleep,
      fatigue: latest?.fatigue, mood: latest?.mood,
      pressure: c001Backend ? `${c001Backend.systolic_bp_mmhg}/${c001Backend.diastolic_bp_mmhg} mmHg` : undefined,
      temperature: c001Backend ? `${c001Backend.body_temp_c} °C` : undefined,
      glucose: c001Backend ? `${c001Backend.blood_sugar_mg_dl} mg/dL` : undefined,
      notes: latest?.notes,
      status: c001Status,
    },
    ...crew.map((member): CrewRow => {
      const apiEntry = backendVitals?.filter(record => record.astronaut_id === member.id).at(-1);
      if (apiEntry) {
        return {
          ...member,
          day: apiEntry.mission_day,
          heart: apiEntry.heart_rate_bpm,
          sleep: apiEntry.sleep_hours,
          pressure: `${apiEntry.systolic_bp_mmhg}/${apiEntry.diastolic_bp_mmhg} mmHg`,
          temperature: `${apiEntry.body_temp_c} °C`,
          glucose: `${apiEntry.blood_sugar_mg_dl} mg/dL`,
          status: mapBackendStatus(apiEntry.overall_alert_status),
        };
      }
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
