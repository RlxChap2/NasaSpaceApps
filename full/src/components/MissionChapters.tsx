import Image from 'next/image';
import MissionLink from './MissionLink';
import styles from './MissionChapters.module.css';

export default function MissionChapters() {
  return (
    <>
      <section id="mission-briefing" className={styles.briefing} aria-labelledby="briefing-title">
        <div className={styles.intro} data-reveal>
          <h2 id="briefing-title">THE MISSION<br />BRIEFING.</h2>
          <p>Follow the mission from the systems that make a spacewalk possible to the observations a crew brings back inside.</p>
        </div>
        <nav aria-label="Mission chapters" className={styles.chapterLinks} data-reveal>
          <MissionLink href="#outside-the-habitat">Outside the habitat</MissionLink>
          <MissionLink href="#crew-handoff">The crew handoff</MissionLink>
        </nav>
      </section>

      <section id="outside-the-habitat" className={styles.chapter} aria-labelledby="outside-title">
        <div className={styles.intro} data-reveal>
          <h2 id="outside-title">OUTSIDE THE<br />HABITAT.</h2>
          <p>During a spacewalk, the suit becomes a small spacecraft. It supplies oxygen, maintains pressure, and circulates water to carry heat away from the astronaut.</p>
        </div>
        <figure className={styles.gallery}>
          <div className={`mission-story-photo ${styles.widePhoto}`}>
            <Image src="/images/astronaut-spacewalk.jpg" alt="Astronaut outside a spacecraft during a spacewalk" fill sizes="(max-width: 700px) 88vw, 66vw" />
          </div>
          <div className={`mission-story-photo ${styles.insetPhoto}`}>
            <Image src="/images/astronaut-mmu.jpg" alt="Astronaut using a maneuvering unit above Earth" fill sizes="(max-width: 700px) 47vw, 28vw" />
          </div>
          <figcaption>Orbital spacewalk photographs. The suit and maneuvering unit show different systems that support work outside a spacecraft.</figcaption>
        </figure>
      </section>

      <section id="crew-handoff" className={styles.handoff} aria-labelledby="handoff-title">
        <div className={styles.intro} data-reveal>
          <h2 id="handoff-title">THE CREW<br />HANDOFF.</h2>
          <p>A short night can matter more when it follows several short nights. Here’s what a crew member could pass to the next shift.</p>
        </div>
        <ol className={styles.steps} data-reveal>
          <li>
            <h3>Record what happened</h3>
            <p>Note the sleep duration and the mission day. Include interruptions, such as an overnight equipment check.</p>
          </li>
          <li>
            <h3>Add context</h3>
            <p>Compare the entry with recent nights and note any fatigue reported during the shift.</p>
          </li>
          <li>
            <h3>Leave a follow-up</h3>
            <p>Flag what the next shift should check and record the next sleep observation at handoff.</p>
          </li>
        </ol>
        <div className={styles.chapterLinks}>
          <MissionLink href="/crew-health#daily-log">View sample crew records</MissionLink>
        </div>
      </section>
    </>
  );
}
