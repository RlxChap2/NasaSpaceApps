'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import HelmetIntro from './HelmetIntro';
import SpaceJourney from './SpaceJourney';

const subscribe = () => () => {};
const sessionSnapshot = () => { try { return sessionStorage.getItem('beyond-intro-seen') === 'yes'; } catch { return false; } };

export default function SpaceExperience() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const seen = useSyncExternalStore(subscribe, sessionSnapshot, () => false);
  const [completed, setCompleted] = useState(false);
  const entered = seen || completed;
  const complete = useCallback(() => {
    try { sessionStorage.setItem('beyond-intro-seen', 'yes'); } catch {}
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
    setCompleted(true);
  }, []);
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = entered ? '' : 'hidden';
    return () => { document.documentElement.style.overflow = previous; };
  }, [entered]);
  return <main>{!ready ? <div className="helmet-intro" /> : entered ? <SpaceJourney /> : <HelmetIntro onComplete={complete} />}</main>;
}
