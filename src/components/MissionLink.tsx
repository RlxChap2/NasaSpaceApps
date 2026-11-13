import Link from 'next/link';
import type { ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';

export default function MissionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="mission-link" href={href}>
      <span>{children}</span>
      <span className="mission-link-icon" aria-hidden="true"><LuPlus size={16} /></span>
    </Link>
  );
}
