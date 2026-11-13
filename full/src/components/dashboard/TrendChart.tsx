import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown2 } from 'iconsax-react';
import type { CheckIn, MetricId } from './check-ins';
import styles from './CrewDashboard.module.css';

export default function TrendChart({ metric, records, series, compact = false, monochrome = false, bars = false, showStats = false }: {
  metric: { id?: MetricId; name: string; unit: string; color: string; max?: number };
  records?: CheckIn[];
  series?: Array<{ day: string; value: number }>;
  compact?: boolean;
  monochrome?: boolean;
  bars?: boolean;
  showStats?: boolean;
}) {
  const id = metric.id;
  const data = series ?? (id ? records?.map(record => ({ day: String(record.day), value: record[id] })) : undefined) ?? [];
  if (!data.length) return <p>No measurement available</p>;

  const color = monochrome ? '#dedede' : metric.color;
  const Chart = bars ? BarChart : LineChart;
  const values = data.map(entry => entry.value);
  const format = (value: number) => `${Number(value.toFixed(1))} ${metric.unit}`;

  return (
    <figure className={compact ? styles.sparkline : styles.chart}>
      {showStats && <dl className={styles.chartStats}>
        <div><dt>Average</dt><dd>{format(values.reduce((sum, value) => sum + value, 0) / values.length)}</dd></div>
        <div><dt>Minimum</dt><dd>{format(Math.min(...values))}</dd></div>
        <div><dt>Maximum</dt><dd>{format(Math.max(...values))}</dd></div>
        <div><dt>Readings</dt><dd>{values.length}</dd></div>
      </dl>}
      <div className={styles.chartCanvas} aria-hidden={compact || undefined}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <Chart data={data} accessibilityLayer={!compact} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
            {!compact && <CartesianGrid vertical={false} stroke="#ffffff20" strokeDasharray="3 5" />}
            <XAxis dataKey="day" hide={compact} tickFormatter={day => `Day ${day}`} tickLine={false} axisLine={false} tick={{ fill: '#b8b8b8', fontSize: 12 }} />
            <YAxis hide={compact} width={34} tickLine={false} axisLine={false} domain={[bars ? 0 : 'auto', metric.max === 5 || metric.max === 10 ? metric.max : 'auto']} />
            {!compact && <Tooltip labelFormatter={day => `Mission Day ${day}`} contentStyle={{ background: '#222', color: '#eee', border: 0 }} />}
            {bars
              ? <Bar dataKey="value" name={metric.name} unit={` ${metric.unit}`} fill={color} maxBarSize={6} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              : <Line dataKey="value" name={metric.name} unit={` ${metric.unit}`} stroke={color} strokeWidth={2} dot={!compact} isAnimationActive={false} />}
          </Chart>
        </ResponsiveContainer>
      </div>
      {!compact && <details className={styles.chartDisclosure}>
        <summary>
          <span>View chart data</span>
          <ArrowDown2 size={14} color="currentColor" aria-hidden="true" />
        </summary>
        <table>
          <thead><tr><th>Mission day</th><th>{metric.name} ({metric.unit})</th></tr></thead>
          <tbody>{data.map(({ day, value }) => <tr key={day}><td>{day}</td><td>{value}</td></tr>)}</tbody>
        </table>
      </details>}
    </figure>
  );
}
