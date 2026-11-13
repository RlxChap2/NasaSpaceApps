'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import HelmetIntro from './HelmetIntro';
import SpaceJourney from './SpaceJourney';

const subscribe = () => () => {};
const sessionSnapshot = () => { try { return sessionStorage.getItem('beyond-intro-seen') === 'yes'; } catch { return false; } };

export default function SpaceExperience() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const seen = useSyncExternalStore(subscribe, sessionSnapshot, () => false);
  const hasSectionLink = useSyncExternalStore(
    subscribe,
    () => window.location.hash.length > 1 && window.location.hash !== '#top',
    () => false,
  );
  const [completed, setCompleted] = useState(false);
  const entered = seen || completed || hasSectionLink;
  const complete = useCallback(() => {
    try { sessionStorage.setItem('beyond-intro-seen', 'yes'); } catch {}
    setCompleted(true);
  }, []);
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = entered ? '' : 'hidden';
    return () => { document.documentElement.style.overflow = previous; };
  }, [entered]);
  useEffect(() => {
    if (!ready || !entered) return;
    if (hasSectionLink) {
      try { sessionStorage.setItem('beyond-intro-seen', 'yes'); } catch {}
    }
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView();
    else if (completed) window.scrollTo(0, 0);
  }, [ready, entered, completed, hasSectionLink]);
  return <main>{!ready ? <div className="helmet-intro" /> : entered ? <SpaceJourney /> : <HelmetIntro onComplete={complete} />}</main>;
}
