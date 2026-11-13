import type { Metadata } from 'next';
import MissionLink from '@/components/MissionLink';
import styles from './credits.module.css';

export const metadata: Metadata = { title: 'Credits | Crew State Health' };

const team = [
  { name: 'Mohammed Mahmoud', location: 'Egypt', x: 28, y: 77, role: 'Team Owner' },
  { name: 'simon gando', location: 'Iraqi Kurdistan Region', x: 536, y: 77 },
  { name: 'Abdulerhman Maher', location: 'Iraq', x: 28, y: 301 },
  { name: 'Devon Alexander', location: 'Germany', x: 536, y: 301 },
  { name: 'Gamz', location: 'France', x: 28, y: 484 },
];

export default function CreditsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <h1>Credits</h1>
        <MissionLink href="/#moon">Back to the mission</MissionLink>
      </header>
      <section aria-labelledby="team-heading">
        <h2 id="team-heading">Team Members</h2>
        <ul className={styles.team}>
          {team.map(({ name, location, role, x, y }) => (
            <li key={name}>
              <div className={styles.avatar} aria-hidden="true" style={{ backgroundPosition: `-${x}px -${y}px` }} />
              <div>
                <h3>{name}</h3>
                <p>{location}</p>
                {role && <span>{role}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
