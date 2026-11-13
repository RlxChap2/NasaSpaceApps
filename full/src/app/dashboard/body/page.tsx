import type { Metadata } from 'next';
import CrewDashboard from '@/components/dashboard/CrewDashboard';

export const metadata: Metadata = { title: 'Body Explorer | Crew State Health' };

export default function DashboardPage() {
  return <CrewDashboard view="body" />;
}
