'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentArrowDownIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  ApiError,
  verificationReportService,
  hasDownloadableReport,
  VerificationCheck,
} from '@/services/verificationReportService';
import { getEnumLabel } from '@/utils/enumLabels';

interface VerificationReportDownloadProps {
  applicationId: string | number;
  /** Rendered above the list. Omit on surfaces that supply their own section heading. */
  title?: string;
  /** When true, renders nothing at all if this candidate has no checks on record. */
  hideWhenEmpty?: boolean;
}

/**
 * Lists a candidate's verification checks and offers the report for each.
 *
 * <p>Previously the only route to a verification report was the full BackgroundCheckPanel, mounted
 * solely in the pipeline's Checks stage. A report on a candidate could therefore not be reached
 * from the candidate's own record, nor from the stage where a recruiter is actually deciding about
 * them. This is the read-and-download half of that panel, small enough to sit anywhere the
 * candidate appears without bringing the commissioning controls with it.
 *
 * <p>A check that has not returned yet is listed and explained rather than hidden: "no report yet
 * because the check is still running" and "no checks were ever run" are different facts, and a
 * component that renders both as nothing invites the wrong conclusion.
 */
export default function VerificationReportDownload({
  applicationId,
  title = 'Verification Report',
  hideWhenEmpty = false,
}: VerificationReportDownloadProps) {
  const [checks, setChecks] = useState<VerificationCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setChecks(await verificationReportService.getChecksForApplication(applicationId));
      setError(null);
      setForbidden(false);
    } catch (err: unknown) {
      // "None have been run" and "you are not allowed to see these" are different facts and must
      // not render the same. An interviewer opening a shared candidate link is refused this
      // endpoint by design; telling them no checks exist would be false.
      setForbidden(err instanceof ApiError && err.status === 403);
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (referenceId: string) => {
    setDownloading(referenceId);
    setError(null);
    try {
      await verificationReportService.downloadReport(referenceId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not download the verification report');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        Loading verification status...
      </div>
    );
  }

  if (checks.length === 0 && !forbidden && hideWhenEmpty) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <ShieldCheckIcon className="w-4 h-4" />
        {title}
      </h4>

      {error && (
        <div role="alert" className="mb-3 px-3 py-2 rounded-control bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {forbidden ? (
        <p className="text-sm text-muted-foreground">
          Verification results are not available to your role.
        </p>
      ) : checks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No verification checks have been run for this candidate yet.
        </p>
      ) : (
        <div className="space-y-2">
          {checks.map(check => {
            const downloadable = hasDownloadableReport(check);
            return (
              <div
                key={check.referenceId}
                className="flex items-center justify-between gap-3 bg-muted/50 rounded-control p-2.5 border border-border"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getEnumLabel('backgroundCheckStatus', check.status)}
                    {check.overallResult && (
                      <> &middot; {getEnumLabel('backgroundCheckResult', check.overallResult)}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{check.referenceId}</p>
                </div>

                {downloadable ? (
                  <button
                    onClick={() => handleDownload(check.referenceId)}
                    disabled={downloading === check.referenceId}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                    {downloading === check.referenceId ? 'Preparing...' : 'Download'}
                  </button>
                ) : (
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    Report available once complete
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
