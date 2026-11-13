import type { Metadata } from 'next';
import CrewDashboard from '@/components/dashboard/CrewDashboard';

export const metadata: Metadata = { title: 'Crew Health Overview | Crew State Health' };

export default function DashboardPage() {
  return <CrewDashboard view="overview" />;
}
