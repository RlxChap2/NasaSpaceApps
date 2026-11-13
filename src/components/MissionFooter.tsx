import Link from 'next/link';
import { LuArrowUpRight, LuGithub, LuOrbit } from 'react-icons/lu';
import MissionLink from './MissionLink';

export default function MissionFooter() {
  return (
    <footer className="mission-footer">
      <div className="mission-footer-main">
        <div className="mission-footer-feature">
          <a className="mission-footer-brand" href="#moon">
            <LuOrbit aria-hidden="true" />
            BEYOND
          </a>
          <p>Farther into space.<br />Closer to the human.</p>
          <MissionLink href="/crew-health#body">Explore the body</MissionLink>
        </div>
        <nav className="mission-footer-nav" aria-label="Mission footer">
          <div>
            <h2>Explore</h2>
            <ul>
              <li><a href="#moon">The mission</a></li>
              <li><Link href="/crew-health">Crew health</Link></li>
              <li><Link href="/crew-health#daily-log">Daily records</Link></li>
              <li><Link href="/crew-health#signals">Health trends</Link></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#mission-briefing">Mission briefing</a></li>
              <li><a href="#questions">Questions</a></li>
            </ul>
          </div>
          <div>
            <h2>References</h2>
            <ul>
              <li><a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">NASA spaceflight hazards <LuArrowUpRight aria-hidden="true" /></a></li>
              <li><a href="https://docs.google.com/spreadsheets/d/1Udl4Lahc4AHnlVe9jr79_ztFN5UjsfSO/edit" target="_blank" rel="noreferrer">Reference dataset <LuArrowUpRight aria-hidden="true" /></a></li>
              <li><a href="https://github.com/RlxChap2/NasaSpaceApps" target="_blank" rel="noreferrer"><LuGithub aria-hidden="true" /> GitHub <LuArrowUpRight aria-hidden="true" /></a></li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="mission-footer-meta">
        <p>Independent hackathon concept · simulated health records</p>
        <MissionLink href="#moon">Back to top</MissionLink>
      </div>
    </footer>
  );
}
