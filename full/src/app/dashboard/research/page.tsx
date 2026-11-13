import type { Metadata } from 'next';
import CrewDashboard from '@/components/dashboard/CrewDashboard';

export const metadata: Metadata = { title: 'Research & Evidence | Crew State Health' };

export default function ResearchPage() {
  return <CrewDashboard view="research" />;
}
