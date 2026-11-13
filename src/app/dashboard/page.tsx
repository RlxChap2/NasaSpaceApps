import type { Metadata } from 'next';
import DashboardStarter from '@/components/dashboard/DashboardStarter';

export const metadata: Metadata = { title: 'Dashboard | BEYOND' };

export default function DashboardPage() {
  return <DashboardStarter />;
}
