'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import JobPostingForm from '@/components/JobPostingForm';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Creating, editing or cloning a vacancy — as a page.
 *
 * <p>This wizard used to live in a modal on the job-postings list, which meant a half-written
 * vacancy could not be linked to, resumed from history, or handed to a colleague. It also could not
 * be reached at all except by clicking through the list.
 *
 * <p>One route with query parameters rather than `[id]` segments. Each dynamic segment in this app
 * needs its own CloudFront rewrite function to survive static export — about thirty-five lines of
 * CDK and a deploy per route. A query parameter is just as linkable and costs neither.
 *
 * <p>`?edit=<id>` edits, `?cloneFrom=<id>` starts from an existing vacancy, and neither starts
 * blank.
 */
function NewJobPostingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const editId = params.get('edit') ?? undefined;
  const cloneFrom = params.get('cloneFrom') ?? undefined;

  const [cloneData, setCloneData] = useState<Record<string, unknown> | undefined>();
  // Only meaningful while a clone is being fetched. A blank create must not wait on anything.
  const [loadingClone, setLoadingClone] = useState(Boolean(cloneFrom));

  const loadClone = useCallback(async () => {
    if (!cloneFrom) return;
    try {
      const response = await apiFetch(`/api/job-postings/${cloneFrom}`);
      if (!response.ok) {
        toast('Could not load that vacancy to copy from', 'error');
        return;
      }
      const data = await response.json();
      // Everything the server owns is dropped: a clone is a new vacancy, not a copy of one that
      // has already been approved, published and applied to.
      const {
        id: _id, status: _status, statusDisplayName: _sdn, statusCssClass: _scc, statusIcon: _si,
        canBeEdited: _cbe, canBeSubmittedForApproval: _cbsa, canBeApproved: _cba,
        canBeRejected: _cbr, canBePublished: _cbp, canBeUnpublished: _cbu, canBeClosed: _cbc,
        createdAt: _ca, submittedForApprovalAt: _sfaa, approvedAt: _aa, publishedAt: _pa,
        unpublishedAt: _ua, closedAt: _cla, approvalNotes: _an, rejectionReason: _rr,
        createdBy: _cb, approvedBy: _ab, publishedBy: _pb,
        daysFromCreation: _dfc, daysFromPublication: _dfp, applicationsCount: _ac,
        viewsCount: _vc,
        ...formFields
      } = data;
      setCloneData(formFields);
    } catch {
      toast('Could not load that vacancy to copy from', 'error');
    } finally {
      setLoadingClone(false);
    }
  }, [cloneFrom, toast]);

  useEffect(() => {
    loadClone();
  }, [loadClone]);

  const title = editId ? 'Edit vacancy' : cloneFrom ? 'Copy vacancy' : 'New vacancy';
  const subtitle = editId
    ? 'Changes take effect once saved.'
    : cloneFrom
      ? 'Starts from an existing vacancy. Nothing is copied that the server owns — approvals, publication and applications all begin again.'
      : 'Describe the role, then choose who may see it.';

  if (loadingClone) {
    return (
      <PageWrapper>
        <IdentityBand
          eyebrow="Recruitment"
          title={title}
          subtitle={subtitle}
        />
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Recruitment"
        title={title}
        subtitle={subtitle}
      />
      <JobPostingForm
        jobPostingId={editId}
        initialData={cloneData}
        currentUserId={user?.id}
        onSuccess={() => router.push('/job-postings')}
        onCancel={() => router.push('/job-postings')}
      />
    </PageWrapper>
  );
}

export default function Page() {
  // useSearchParams needs a Suspense boundary for a statically exported route.
  return (
    <Suspense fallback={null}>
      <NewJobPostingPage />
    </Suspense>
  );
}
