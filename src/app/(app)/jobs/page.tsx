import { Metadata } from 'next';
import IDCJobListClient from '@/components/jobs/IDCJobListClient';

export const metadata: Metadata = {
  title: 'Careers | Industrial Development Corporation',
  description:
    'Explore career opportunities at the Industrial Development Corporation of South Africa.',
  openGraph: {
    title: 'Careers | Industrial Development Corporation',
    description:
      'Explore career opportunities at the Industrial Development Corporation of South Africa.',
    type: 'website',
    url: '/jobs',
  },
};

// Jobs are fetched client-side by IDCJobListClient, not at build time — see
// its component comment for why (this is a multi-tenant static export).
export default function JobsPage() {
  return <IDCJobListClient />;
}
