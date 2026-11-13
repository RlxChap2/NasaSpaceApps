'use client';

import { usePathname } from 'next/navigation';
import MissionFooter from './MissionFooter';

export default function SiteFooter() {
  const pathname = usePathname();
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/') ? null : <MissionFooter />;
}
