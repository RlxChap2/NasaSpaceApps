import Link from 'next/link';
import type { ReactNode } from 'react';
import MissionActionContent from './MissionActionContent';

export default function MissionLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  const Anchor = external || href.startsWith('#') ? 'a' : Link;
  return (
    <Anchor className="mission-link" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      <MissionActionContent>{children}</MissionActionContent>
    </Anchor>
  );
}
