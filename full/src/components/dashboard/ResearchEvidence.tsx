'use client';

import { useEffect, useState } from 'react';
import { fetchOsdrFiles, fetchThresholds, type OsdrFileRecord, type ThresholdRecord } from '@/lib/api';
import MissionLink from '../MissionLink';
import { evidence } from './evidence';
import styles from './CrewDashboard.module.css';

const groups = [
  { title: 'Spaceflight Hazards', sources: [
    { name: 'Five Hazards of Human Spaceflight', url: evidence.hazards, summary: 'NASA outlines five hazards crews face during spaceflight, including radiation, isolation and changes in gravity.', use: 'Provides context for the Body Explorer and its separate radiation section.' },
  ] },
  { title: 'Human Health Risks', sources: [
    { name: 'Risks of Human Spaceflight', url: evidence.risks, summary: 'NASA connects mission hazards to risks involving physiology, behavior and radiation exposure.', use: 'Helps distinguish measurable indicators from research topics that require dedicated instruments.' },
    { name: 'Cardiovascular Adaptations', url: evidence.cardiovascular, summary: 'NASA examines how spaceflight can affect the heart and blood vessels during and after a mission.', use: 'Provides research context for heart rate and blood pressure in the Body Explorer.' },
  ] },
  { title: 'Ongoing Human Research', sources: [
    { name: 'ARCHeR', url: evidence.archer, summary: 'The Artemis study tracks well-being, activity, sleep patterns and crew interactions.', use: 'Informed the decision to track sleep and behavioral changes over successive check-ins.' },
    { name: 'Spaceflight Standard Measures', url: evidence.standardMeasures, summary: 'NASA collects a consistent set of measurements across missions to study how people adapt to spaceflight.', use: 'Informed the daily check-in and the way the dashboard compares repeated measurements over time.' },
  ] },
  { title: 'Additional Space Agency Research', sources: [
    { name: 'ESA EasyMotion-2', url: evidence.esa, summary: 'ESA is testing whether electrical muscle stimulation alongside exercise helps preserve muscle function in space.', use: 'Provides context for the research-only muscle and bone section.' },
  ] },
];

export default function ResearchEvidence() {
  const [thresholds, setThresholds] = useState<ThresholdRecord[]>([]);
  const [osdrFiles, setOsdrFiles] = useState<OsdrFileRecord[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchThresholds(), fetchOsdrFiles()])
      .then(([thresholdRows, osdrRows]) => {
        if (!active) return;
        setThresholds(thresholdRows);
        setOsdrFiles(osdrRows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.evidence}>
      <div className={styles.heading}>
        <div><h1>Research &amp; Evidence</h1></div>
        <div className={styles.actions}>
          <MissionLink href="https://drive.google.com/drive/u/0/folders/1XmD-l9rsSQS5XVYig2B3VjddPPOlAppr" external>Google Drive</MissionLink>
          <MissionLink href="/dashboard/check-in">Daily Check-in</MissionLink>
        </div>
      </div>
      <section className={styles.panel}>
        <h2>Built on Publicly Available Space Health Research</h2>
        <p>We used public sources from NASA’s Human Research Program to understand long-duration spaceflight hazards and why health indicators are tracked across a mission.</p>
      </section>
      {groups.map(group => (
        <section className={styles.evidenceGroup} key={group.title}>
          <h2>{group.title}</h2>
          <div>
            {group.sources.map(source => (
              <article className={styles.panel} key={source.name}>
                <h3>{source.name}</h3>
                <p>{source.summary}</p>
                <h4>How We Used It</h4>
                <p>{source.use}</p>
                <MissionLink href={source.url} external>View Original Source</MissionLink>
              </article>
            ))}
          </div>
        </section>
      ))}
      {thresholds.length > 0 && (
        <section className={styles.panel}>
          <h2>NASA-STD-3001 &amp; Inspiration4 Reference Thresholds ({thresholds.length})</h2>
          <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="NASA reference thresholds">
            <table>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Indicator</th>
                  <th scope="col">Green</th>
                  <th scope="col">Yellow</th>
                  <th scope="col">Red</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map(item => (
                  <tr key={item.indicator_id}>
                    <th scope="row">{item.indicator_id}</th>
                    <td>{item.health_or_cabin_indicator} ({item.unit})</td>
                    <td>{item.normal_green_range}</td>
                    <td>{item.warning_yellow_range}</td>
                    <td>{item.critical_red_threshold}</td>
                    <td><a href={item.source_url} target="_blank" rel="noreferrer">{item.source_label}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {osdrFiles.length > 0 && (
        <section className={styles.panel}>
          <h2>Verified NASA OSDR &amp; Benchmark Repository ({osdrFiles.length})</h2>
          <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="NASA OSDR files">
            <table>
              <thead>
                <tr>
                  <th scope="col">File ID</th>
                  <th scope="col">Study</th>
                  <th scope="col">File</th>
                  <th scope="col">Origin Label</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {osdrFiles.map(file => (
                  <tr key={file.file_id}>
                    <th scope="row">{file.file_id}</th>
                    <td>{file.repository_and_study}</td>
                    <td>{file.exact_file_name}</td>
                    <td>{file.data_origin_label}</td>
                    <td><a href={file.source_url} target="_blank" rel="noreferrer">{file.source_label}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className={styles.panel}>
        <h2>Data &amp; Limitations</h2>
        <p>Demo measurements are simulated and calibrated to NASA-STD-3001 and Inspiration4 findings. Manual entries are evaluated and persisted by the local FastAPI + SQLite backend. Crew State Health is a research prototype and is not intended for medical diagnosis or treatment.</p>
      </section>
    </div>
  );
}
