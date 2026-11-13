import type { Metadata } from 'next';
import CrewDashboard from '@/components/dashboard/CrewDashboard';

export const metadata: Metadata = { title: 'Health Trends | Crew State Health' };

export default function HealthTrendsPage() {
  return <CrewDashboard view="trends" />;
}
