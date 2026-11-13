import type { ReactNode } from 'react';
import { LuPlus } from 'react-icons/lu';

export default function MissionActionContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span>{children}</span>
      <span className="mission-link-icon" aria-hidden="true"><LuPlus size={16} /></span>
    </>
  );
}
