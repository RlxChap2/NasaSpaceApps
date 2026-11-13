import type { Metadata } from 'next';
import './complete-site.css';
import './mission-end.css';
import './mission-stories.css';

export const metadata: Metadata = {
  title: 'BEYOND | NASA Space Apps',
  description: 'Explore human health and the conditions that shape life beyond Earth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
