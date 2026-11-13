import type { Metadata } from 'next';
import CrewDashboard from '@/components/dashboard/CrewDashboard';

export const metadata: Metadata = { title: 'Daily Health Check-in | Crew State Health' };

export default function DashboardPage() {
  return <CrewDashboard view="check-in" />;
}
