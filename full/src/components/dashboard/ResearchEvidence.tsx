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
      <section className={styles.panel}>
        <h2>Data &amp; Limitations</h2>
        <p>Demo measurements are simulated and do not come from NASA. Manual entries are saved locally in this browser. Crew State Health is a research prototype and is not intended for medical diagnosis or treatment.</p>
      </section>
    </div>
  );
}
