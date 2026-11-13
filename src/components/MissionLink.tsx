import Link from 'next/link';
import type { ReactNode } from 'react';
import MissionActionContent from './MissionActionContent';

export default function MissionLink({ href, children }: { href: string; children: ReactNode }) {
  const Anchor = href.startsWith('#') ? 'a' : Link;
  return (
    <Anchor className="mission-link" href={href}>
      <MissionActionContent>{children}</MissionActionContent>
    </Anchor>
  );
}
