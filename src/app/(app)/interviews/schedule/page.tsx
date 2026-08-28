'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import InterviewScheduler from '@/components/InterviewScheduler';

/**
 * Scheduling or rescheduling an interview — as a page.
 *
 * <p>This wizard was mounted in two modals: one on the interviews list, and one launched from
 * inside the candidate detail modal on the pipeline board. That second case was a modal opened from
 * a modal, which the standard forbids for a reason — cancelling it left you unsure which of the two
 * layers you had just dismissed.
 *
 * <p>Query parameters rather than `[id]` segments: every dynamic segment here needs its own
 * CloudFront rewrite to survive static export, and a query parameter is just as linkable.
 *
 * <p>`?interviewId=` reschedules an existing interview, `?applicationId=` books one against a
 * candidate, and `?returnTo=` sends you back where you came from — the board, the candidate record,
 * or the list.
 */
function ScheduleInterviewPage() {
  const router = useRouter();
  const params = useSearchParams();

  // The component types this as a number while URLs carry strings. Parsed rather than cast, so a
  // malformed ?interviewId= opens a blank scheduler instead of one bound to NaN.
  const rawInterviewId = params.get('interviewId');
  const parsedInterviewId = rawInterviewId ? Number(rawInterviewId) : undefined;
  const interviewId = Number.isFinite(parsedInterviewId) ? parsedInterviewId : undefined;
  const applicationId = params.get('applicationId') ?? undefined;
  // Only ever an internal path. Taking an absolute URL here would let a crafted link bounce
  // someone off this product entirely after they finish scheduling.
  const rawReturn = params.get('returnTo');
  const returnTo = rawReturn && rawReturn.startsWith('/') && !rawReturn.startsWith('//')
    ? rawReturn
    : '/interviews';

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Recruitment"
        title={interviewId ? 'Reschedule interview' : 'Schedule interview'}
        subtitle={
        interviewId
          ? 'Everyone already invited is notified of the change.'
          : 'Pick the round, the time and who sits on the panel.'
      }
      />
      <InterviewScheduler
        interviewId={interviewId}
        applicationId={applicationId}
        onSuccess={() => router.push(returnTo)}
        onCancel={() => router.push(returnTo)}
      />
    </PageWrapper>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScheduleInterviewPage />
    </Suspense>
  );
}
