import { Metadata } from 'next';
import { fetchActiveJobs } from '@/lib/jobs-api';
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

export default async function JobsPage() {
  const jobs = await fetchActiveJobs();

  return <IDCJobListClient jobs={jobs} />;
}
