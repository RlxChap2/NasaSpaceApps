import { useState } from 'react';
import MissionLink from '../MissionLink';
import { DashboardSelect } from './DashboardControls';
import TrendChart from './TrendChart';
import { metrics, type CheckIn, type MetricId } from './check-ins';
import styles from './CrewDashboard.module.css';

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const dayMs = 86_400_000;

export default function HealthHistory({ records }: { records: CheckIn[] }) {
  const [indicator, setIndicator] = useState<MetricId>('heart');
  const [period, setPeriod] = useState(7);
  const metric = metrics.find(item => item.id === indicator)!;
  const ordered = [...records].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || a.day - b.day);
  const end = ordered.at(-1);
  const endDay = end ? Math.floor(Date.parse(end.recordedAt) / dayMs) : 0;
  const entries = ordered.filter(entry => Math.floor(Date.parse(entry.recordedAt) / dayMs) > endDay - period);
  const latest = entries.at(-1);
  const previous = entries.at(-2);
  const first = entries[0];
  const change = latest && previous ? Number((latest[indicator] - first[indicator]).toFixed(1)) : undefined;
  const days = new Set(entries.map(entry => entry.recordedAt.slice(0, 10))).size;
  const values = entries.map(entry => entry[indicator]);
  const manual = entries.filter(entry => entry.source === 'manual').length;
  const formatStat = (value: number) => values.length ? `${Number(value.toFixed(1))} ${metric.unit}` : '—';
  const value = (entry?: CheckIn) => entry ? `${entry[indicator]} ${metric.unit}` : '—';

  return (
    <div className={styles.history}>
      <div className={styles.heading}>
        <div><h1>Health Trends</h1><p>Compare recorded check-ins by indicator and period. Dates are shown in UTC.</p></div>
        <MissionLink href="/dashboard/check-in">Daily Check-in</MissionLink>
      </div>
      <section className={styles.panel} aria-label="Trend chart">
        <div className={styles.panelHeading}>
          <h2>{metric.name}</h2>
          <div className={styles.filters}>
            <DashboardSelect label="Indicator" value={indicator} onChange={event => setIndicator(event.target.value as MetricId)}>
              {metrics.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </DashboardSelect>
            <DashboardSelect label="Period" value={period} onChange={event => setPeriod(Number(event.target.value))}>
              {[7, 14].map(days => <option key={days} value={days}>Last {days} Days</option>)}
            </DashboardSelect>
          </div>
        </div>
        {end && <p className={styles.muted}>Period ending {dateTime.format(new Date(end.recordedAt))} UTC</p>}
        {entries.length > 0 && <TrendChart metric={metric} records={entries} monochrome />}
        <dl className={styles.chartStats}>
          <div><dt>Latest Recorded Value</dt><dd>{value(latest)}</dd></div>
          <div><dt>Previous Value</dt><dd>{value(previous)}</dd></div>
          <div><dt>Change Over Time</dt><dd>{change === undefined ? '—' : `${change > 0 ? '+' : ''}${change} ${metric.unit}`}</dd></div>
          <div><dt>Number of Recorded Days</dt><dd>{days}</dd></div>
          <div><dt>Period Average</dt><dd>{formatStat(values.reduce((sum, entry) => sum + entry, 0) / values.length)}</dd></div>
          <div><dt>Lowest Value</dt><dd>{formatStat(Math.min(...values))}</dd></div>
          <div><dt>Highest Value</dt><dd>{formatStat(Math.max(...values))}</dd></div>
          <div><dt>Total Readings</dt><dd>{entries.length}</dd></div>
          <div><dt>Manual Entries</dt><dd>{manual}</dd></div>
          <div><dt>Simulated Entries</dt><dd>{entries.length - manual}</dd></div>
        </dl>
        {entries.length < 2 && <p role="status">Not Enough Data Yet</p>}
        <p className={styles.muted}><a href={metric.source} target="_blank" rel="noreferrer">Research behind {metric.name}</a></p>
      </section>
      <section className={`${styles.panel} ${styles.crewHealthRecord}`} aria-labelledby="history-title">
        <h2 id="history-title">Recording History</h2>
        {entries.length ? <div className={`${styles.tableScroll} ${styles.historyTable}`}>
          <table>
            <thead><tr><th scope="col">Recorded at (UTC)</th><th scope="col">Value</th><th scope="col">Source</th></tr></thead>
            <tbody>{[...entries].reverse().map(entry => (
              <tr key={entry.day}>
                <td><time dateTime={entry.recordedAt}>{dateTime.format(new Date(entry.recordedAt))}</time></td>
                <td>{value(entry)}</td>
                <td>{entry.source === 'manual' ? 'Manual Input' : 'Simulated Data'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div> : <p>No recordings in this period.</p>}
      </section>
    </div>
  );
}
