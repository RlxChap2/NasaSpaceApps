import type { Metadata } from 'next';
import SiteFooter from '@/components/SiteFooter';
import './complete-site.css';
import './mission-end.css';
import './mission-stories.css';

export const metadata: Metadata = {
  title: 'Crew State Health | NASA Space Apps',
  description: 'Explore human health and the conditions that shape life beyond Earth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
