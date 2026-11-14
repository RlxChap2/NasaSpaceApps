'use client';
import { useEffect, useState } from 'react';
import fallbackEntries from '@/data/crew-log.json';
import { fetchVitals } from '@/lib/api';

interface DailyLogEntry {
  record: string;
  crew: string;
  phase: string;
  day: string;
  label: string;
  sleep: string;
  stress: string;
  mood: string;
  heart: string;
  systolic: string;
  diastolic: string;
  temperature: string;
  glucose: string;
  co2: string;
  status: string;
  action?: string;
}

export default function CrewDailyLog() {
  const [entries, setEntries] = useState<DailyLogEntry[]>(fallbackEntries);
  const [crew, setCrew] = useState(fallbackEntries[0].crew);
  const [recordId, setRecordId] = useState(fallbackEntries[0].record);
  const [liveBackend, setLiveBackend] = useState(false);

  useEffect(() => {
    let active = true;
    fetchVitals()
      .then(vitals => {
        if (!active || !vitals.length) return;
        setEntries(
          vitals.map(v => ({
            record: v.record_id,
            crew: v.astronaut_id,
            phase: v.mission_phase,
            day: v.mission_day,
            label: v.data_label,
            sleep: String(v.sleep_hours),
            stress: String(v.stress_score_0_10),
            mood: String(v.mood_unhappiness_0_10),
            heart: String(v.heart_rate_bpm),
            systolic: String(v.systolic_bp_mmhg),
            diastolic: String(v.diastolic_bp_mmhg),
            temperature: String(v.body_temp_c),
            glucose: String(v.blood_sugar_mg_dl),
            co2: String(v.cabin_co2_mmhg),
            status: v.overall_alert_status,
            action: v.recommended_action,
          })),
        );
        setLiveBackend(true);
      })
      .catch(() => {
        // Keep static fallback if backend is offline.
      });
    return () => {
      active = false;
    };
  }, []);

  const crewIds = [...new Set(entries.map(e => e.crew))];
  const history = entries.filter(e => e.crew === crew);
  const record = history.find(e => e.record === recordId) || history[0];
  const status = record.status.startsWith('GREEN') ? 'green' : record.status.startsWith('YELLOW') ? 'yellow' : 'red';
  const metrics = [
    ['Sleep duration', record.sleep, 'hours'],
    ['Resting heart rate', record.heart, 'bpm'],
    ['Blood pressure', `${record.systolic}/${record.diastolic}`, 'mmHg'],
    ['Body temperature', record.temperature, '°C'],
    ['Blood glucose', record.glucose, 'mg/dL'],
    ['Stress', record.stress, '/ 10'],
    ['Mood · unhappiness', record.mood, '/ 10'],
    ['Cabin CO₂', record.co2, 'mmHg'],
  ];

  return (
    <section className="daily-log" id="daily-log">
      <div className="section-intro">
        <h2>A DAY.<br /><span>IN DETAIL.</span></h2>
        <div>
          <p>Sleep, vital signs and how the crew feels.<br />Together, in one daily record.</p>
          <a className="log-source" href="https://docs.google.com/spreadsheets/d/1Udl4Lahc4AHnlVe9jr79_ztFN5UjsfSO/edit?gid=592434522" target="_blank" rel="noreferrer">View source dataset</a>
        </div>
      </div>
      <div className="log-toolbar">
        <label>Crew member
          <select className="log-select" value={crew} onChange={e => { setCrew(e.target.value); setRecordId(entries.find(r => r.crew === e.target.value)!.record); }}>
            {crewIds.map(id => <option key={id}>{id}</option>)}
          </select>
        </label>
        <label>Mission day
          <select className="log-select" value={record.record} onChange={e => setRecordId(e.target.value)}>
            {history.map(r => <option key={r.record} value={r.record}>{r.day} · {r.phase}</option>)}
          </select>
        </label>
        <div className={`log-status ${status}`}>
          <i />{status === 'green' ? 'Good · nominal' : status === 'yellow' ? 'Moderate · review' : 'Poor · attention needed'}
          <small>{liveBackend ? `${record.label} · Live SQLite` : 'Source-assigned overall status'}</small>
        </div>
      </div>
      <div className="daily-metrics" key={record.record}>
        {metrics.map(([label, value, unit]) => (
          <article key={label}>
            <p>{label}</p>
            <strong>{value}<small>{unit}</small></strong>
            {label.startsWith('Mood') && <span>0 = happy · 10 = unhappy</span>}
            {label === 'Stress' && <span>0 = no stress · 10 = high stress</span>}
          </article>
        ))}
      </div>
      {record.action && <p className="data-note">Recommended action: {record.action}</p>}
      <div className="sleep-history">
        <div>
          <h3>How much did they sleep?</h3>
          <p>Every bar is one observation in the source log. Select a day to see the complete record.</p>
          <p className="sleep-total">{record.sleep}<small>hours on {record.day}</small></p>
        </div>
        <div className="sleep-bars">
          {history.map(r => (
            <button key={r.record} aria-pressed={r.record === record.record} aria-label={`${r.day}: ${r.sleep} hours of sleep`} onClick={() => setRecordId(r.record)}>
              <span>{r.sleep}h</span><i style={{ height: `${Number(r.sleep) / 10 * 150}px` }} /><small>{r.day}</small>
            </button>
          ))}
        </div>
      </div>
      <p className="data-note">Simulated observations supplied in the reference workbook. Values and overall status are reproduced from the log; this page does not validate its claimed clinical thresholds. Individual organ conditions are separate illustrative scenarios.</p>
    </section>
  );
}
