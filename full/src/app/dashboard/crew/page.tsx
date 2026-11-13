import type { Metadata } from 'next';
import CrewDashboard from '@/components/dashboard/CrewDashboard';

export const metadata: Metadata = { title: 'Crew Profiles | Crew State Health' };

export default function CrewPage() {
  return <CrewDashboard view="crew" />;
}
