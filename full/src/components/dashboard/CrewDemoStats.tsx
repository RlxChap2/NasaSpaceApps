import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './CrewDashboard.module.css';

const activities = [
  { key: 'mobility', label: 'Mobility', color: '#5ed6c0' },
  { key: 'endurance', label: 'Endurance', color: '#ad9bff' },
  { key: 'strength', label: 'Strength', color: '#ffac65' },
] as const;

const restColor = '#82b8ff';
const tooltip = { background: '#252525', border: 0, color: '#fff' };
const tick = { fill: '#aaa', fontSize: 11 };

function makeDays(memberId: string) {
  let seed = Number(memberId.slice(1)) || 1;
  const next = (min: number, span: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return min + seed % span;
  };
  return Array.from({ length: 14 }, (_, index) => ({
    day: index + 1,
    mobility: next(8, 18),
    endurance: next(15, 26),
    strength: next(10, 23),
    rest: next(58, 29) / 10,
  }));
}

export default function CrewDemoStats({ memberId }: { memberId: string }) {
  const [period, setPeriod] = useState(7);
  const [hidden, setHidden] = useState<string[]>([]);
  const days = makeDays(memberId).slice(-period);
  const visible = activities.filter(item => !hidden.includes(item.key));
  const totals = days.map(day => visible.reduce((sum, item) => sum + day[item.key], 0));
  const total = totals.reduce((sum, minutes) => sum + minutes, 0);
  const averageRest = days.reduce((sum, day) => sum + day.rest, 0) / days.length;

  return (
    <section className={styles.panel} aria-labelledby="demo-stats">
      <div className={styles.panelHeading}>
        <div><h2 id="demo-stats">Activity &amp; Recovery</h2><p className={styles.muted}>Simulated activity data</p></div>
        <div className={styles.crewTabs} role="group" aria-label="Activity period">
          {[7, 14].map(days => <button key={days} type="button" aria-pressed={period === days} onClick={() => setPeriod(days)}>{days} days</button>)}
        </div>
      </div>
      <dl className={styles.chartStats}>
        <div><dt>Selected activity</dt><dd>{total} <small>min</small></dd></div>
        <div><dt>Average per day</dt><dd>{Math.round(total / days.length)} <small>min</small></dd></div>
        <div><dt>Most active day</dt><dd>{visible.length ? `Day ${days[totals.indexOf(Math.max(...totals))].day}` : '—'}</dd></div>
        <div><dt>Average rest</dt><dd>{averageRest.toFixed(1)} <small>h</small></dd></div>
      </dl>
      <div className={styles.crewTabs} role="group" aria-label="Activity series">
        {activities.map(item => <button key={item.key} type="button" aria-pressed={!hidden.includes(item.key)}
          onClick={() => setHidden(current => current.includes(item.key) ? current.filter(key => key !== item.key) : [...current, item.key])}>
          <i className={styles.demoSeriesDot} style={{ background: item.color }} aria-hidden="true" />{item.label}
        </button>)}
      </div>
      <div className={styles.demoPlots}>
        <div><h3>Training minutes</h3>
          {visible.length ? <div className={styles.chartCanvas}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={days} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="#333" />
                <XAxis dataKey="day" tickFormatter={day => `D${day}`} tick={tick} tickLine={false} axisLine={false} />
                <YAxis width={32} tick={tick} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={day => `Demo day ${day}`} contentStyle={tooltip} />
                {visible.map(item => <Area key={item.key} type="monotone" stackId="activity" dataKey={item.key} name={item.label} unit=" min" stroke={item.color} fill={item.color} fillOpacity={.75} isAnimationActive={false} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div> : <p>Select an activity to show its readings.</p>}
        </div>
        <div><h3><i className={styles.demoSeriesDot} style={{ background: restColor }} aria-hidden="true" /> Rest hours</h3>
          <div className={styles.chartCanvas}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={days} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="#333" />
                <XAxis dataKey="day" tickFormatter={day => `D${day}`} tick={tick} tickLine={false} axisLine={false} />
                <YAxis width={25} tick={tick} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={day => `Demo day ${day}`} contentStyle={tooltip} cursor={{ fill: '#ffffff14' }} />
                <Bar dataKey="rest" name="Rest" unit=" h" fill={restColor} maxBarSize={12} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
