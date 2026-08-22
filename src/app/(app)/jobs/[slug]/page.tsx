import { Metadata } from 'next';
import IDCJobDetailClient from '@/components/jobs/IDCJobDetailClient';

/**
 * Static export only ever pre-renders this one placeholder ("_") page.
 * Every real /jobs/<slug> URL is served this same file via a CloudFront
 * "/jobs/*" rewrite (see ShumelaHireFrontendStack.cs) — S3 has no object
 * for arbitrary slugs, and CloudFront can't fix that up on the way out
 * (viewer-response functions are skipped for any 400+ origin response).
 * IDCJobDetailClient reads the real slug from the browser URL and fetches
 * the job client-side, tenant-aware, instead of at build time.
 */
export function generateStaticParams() {
  return [{ slug: '_' }];
}

export const metadata: Metadata = {
  title: 'Careers | Industrial Development Corporation',
  description:
    'Explore career opportunities at the Industrial Development Corporation of South Africa.',
};

export default function JobDetailPage() {
  return <IDCJobDetailClient />;
}
