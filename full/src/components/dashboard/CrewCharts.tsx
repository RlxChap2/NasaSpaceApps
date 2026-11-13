import { useState } from 'react';
import { Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import CrewStatus, { type Status } from './CrewStatus';
import type { getCrewRows } from './CrewStatsTable';
import type { CheckIn } from './check-ins';
import styles from './CrewDashboard.module.css';

const statuses: Status[] = ['nominal', 'review', 'critical', 'missing'];
const statusColors: Record<Status, string> = { nominal: '#ddd', review: '#f4d375', critical: '#ff9292', missing: '#aaa' };

export default function CrewCharts({ rows, records }: { rows: ReturnType<typeof getCrewRows>; records: CheckIn[] }) {
  const [previewDay, setPreviewDay] = useState<number>();
  const [selectedDay, setSelectedDay] = useState<number>();
  const [activeStatus, setActiveStatus] = useState<Status>();
  const [selectedStatus, setSelectedStatus] = useState<Status>();
  const breakdown = statuses.map(status => ({
    status,
    value: rows.filter(row => row.status === status).length,
    fill: (activeStatus ?? selectedStatus) && (activeStatus ?? selectedStatus) !== status ? '#484848' : statusColors[status],
  }));
  const sectors = breakdown.filter(item => item.value > 0);
  const active = breakdown.find(item => item.status === (activeStatus ?? selectedStatus));
  const recent = records.slice(-7);
  const latest = recent.at(-1);
  const displayed = recent.find(record => record.day === (previewDay ?? selectedDay)) ?? latest;
  const hours = recent.map(record => record.sleep);
  const stats = hours.length ? [
    { label: 'Average', value: (hours.reduce((sum, value) => sum + value, 0) / hours.length).toFixed(1) },
    { label: 'Shortest', value: Math.min(...hours) },
    { label: 'Longest', value: Math.max(...hours) },
  ] : [];

  return (
    <div className={styles.crewCharts}>
      <section className={styles.panel} aria-labelledby="sleep-summary-title">
        <div className={styles.panelHeading}>
          <h2 id="sleep-summary-title">Sleep and Recovery</h2>
          {latest && <span className={styles.muted}>Last {recent.length} check-ins</span>}
        </div>
        {latest ? <>
          <dl className={styles.recoveryStats}>
            {stats.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value} <small>h</small></dd></div>)}
          </dl>
          <div className={styles.sleepDots} aria-label="Sleep readings">
            {recent.map(record => (
              <button key={record.day} type="button" title={`Day ${record.day}: ${record.sleep} h`}
                aria-label={`Day ${record.day}: ${record.sleep} hours`}
                aria-pressed={(selectedDay ?? latest.day) === record.day}
                onMouseEnter={() => setPreviewDay(record.day)} onMouseLeave={() => setPreviewDay(undefined)}
                onFocus={() => setPreviewDay(record.day)} onBlur={() => setPreviewDay(undefined)}
                onClick={() => setSelectedDay(record.day)}>
                <span aria-hidden="true">{Array.from({ length: 6 }, (_, index) => (
                  <i key={index} data-filled={index < Math.ceil(record.sleep / 4)} />
                ))}</span>
                <small>{record.day}</small>
              </button>
            ))}
          </div>
        </> : <p>No measurement available</p>}
      </section>
      <section className={styles.panel} aria-labelledby="crew-status-title">
        <h2 id="crew-status-title">Crew status</h2>
        <ul className={styles.recoveryStatuses}>
          {statuses.map(status => (
            <li key={status}><CrewStatus status={status} /><strong>{rows.filter(row => row.status === status).length}</strong></li>
          ))}
        </ul>
      </section>
      <section className={`${styles.panel} ${styles.sleepGauge}`} aria-labelledby="sleep-gauge-title">
        <div className={styles.panelHeading}>
          <h2 id="sleep-gauge-title">Sleep Tracking</h2>
          <span className={styles.muted}>Alex Morgan</span>
        </div>
        {displayed ? <>
          <p className={styles.muted}>Mission Day {displayed.day}</p>
          <div className={styles.gaugePlot} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <RadialBarChart data={[{ hours: displayed.sleep }]} startAngle={180} endAngle={0}
                cx="50%" cy="88%" innerRadius="70%" outerRadius="87%" barSize={12}>
                <PolarAngleAxis type="number" domain={[0, 24]} tick={false} />
                <RadialBar dataKey="hours" fill="#b7b7b7" background={{ fill: '#303030' }} cornerRadius={6} isAnimationActive={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className={styles.gaugeTicks}>
              {Array.from({ length: 49 }, (_, index) => <i key={index} style={{ rotate: `${index * 3.75 - 90}deg` }} />)}
            </div>
          </div>
          <p className={styles.gaugeReading}><strong>{displayed.sleep}</strong> / 24 h <span>Recorded sleep</span></p>
        </> : <p>No measurement available</p>}
      </section>
      <section className={`${styles.panel} ${styles.crewBreakdown}`} aria-labelledby="crew-breakdown-title">
        <div>
          <h2 id="crew-breakdown-title">Status breakdown</h2>
          <div className={styles.crewTabs} role="group" aria-label="Highlight a crew status">
            {breakdown.map(({ status, value }) => (
              <button key={status} type="button" aria-pressed={selectedStatus === status}
                onMouseEnter={() => setActiveStatus(status)} onMouseLeave={() => setActiveStatus(undefined)}
                onFocus={() => setActiveStatus(status)} onBlur={() => setActiveStatus(undefined)}
                onClick={() => setSelectedStatus(current => current === status ? undefined : status)}>
                <CrewStatus status={status} /> {value}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.breakdownPlot}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart accessibilityLayer={false}>
              <Pie data={sectors} dataKey="value" nameKey="status" innerRadius="68%" outerRadius="94%"
                cornerRadius={7} paddingAngle={5} stroke="none" isAnimationActive={false}
                onMouseEnter={(_, index) => setActiveStatus(sectors[index]?.status)}
                onMouseLeave={() => setActiveStatus(undefined)}
                onClick={(_, index) => setSelectedStatus(current => current === sectors[index]?.status ? undefined : sectors[index]?.status)} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.breakdownValue} aria-live="polite">
            <strong>{active && rows.length ? `${Math.round(active.value / rows.length * 100)}%` : rows.length}</strong>
            <small>{active ? `${active.value} of ${rows.length}` : 'Crew members'}</small>
          </div>
        </div>
      </section>
    </div>
  );
}
