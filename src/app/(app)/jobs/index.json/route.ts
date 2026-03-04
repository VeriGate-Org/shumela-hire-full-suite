import { NextRequest, NextResponse } from 'next/server';
import { fetchActiveJobs } from '@/lib/jobs-api';

interface JobFeedItem {
  id: number;
  title: string;
  slug: string;
  closingDate?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  companyName?: string;
  url: string;
  createdAt: string;
}

interface JobFeed {
  version: string;
  title: string;
  description: string;
  lastUpdated: string;
  totalJobs: number;
  jobs: JobFeedItem[];
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const jobs = await fetchActiveJobs();

    const feedItems: JobFeedItem[] = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      closingDate: job.closingDate,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      companyName: job.companyName,
      url: `/jobs/${job.slug}`,
      createdAt: job.createdAt,
    }));

    const feed: JobFeed = {
      version: '1.0',
      title: 'IDC Career Opportunities',
      description: 'Current job opportunities at the Industrial Development Corporation',
      lastUpdated: new Date().toISOString(),
      totalJobs: feedItems.length,
      jobs: feedItems,
    };

    return NextResponse.json(feed, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error generating job feed:', error);

    const errorFeed: JobFeed = {
      version: '1.0',
      title: 'Job Feed Error',
      description: 'Error occurred while fetching job data',
      lastUpdated: new Date().toISOString(),
      totalJobs: 0,
      jobs: [],
    };

    return NextResponse.json(errorFeed, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Last-Modified': new Date().toUTCString(),
    },
  });
}
