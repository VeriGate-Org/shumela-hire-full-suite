import { apiFetch, refusalMessage } from '@/lib/api-fetch';

export interface VerificationCheck {
  id: string | number;
  referenceId: string;
  candidateName: string;
  candidateIdNumber: string;
  checkTypes: string;
  status: string;
  overallResult: string | null;
  provider: string;
  createdAt: string;
  completedAt: string | null;
}

/**
 * An error that remembers the status it came from.
 *
 * <p>Callers need to tell "you may not see these" from "these do not exist", and matching on the
 * text of a message is the wrong way to learn that — the wording is the server's to change.
 */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Reads and downloads verification reports for an application.
 *
 * The report endpoint is shared by every surface that offers the download, so the auth, tenant
 * and error handling live here once. A bare `fetch` against a relative path reaches the Next.js
 * origin rather than the API, and without an `ok` check its 404 page is saved as a PDF — a
 * download that looks successful and produces a file that will not open.
 */
export const verificationReportService = {
  async getChecksForApplication(applicationId: string | number): Promise<VerificationCheck[]> {
    const response = await apiFetch(`/api/background-checks/applications/${applicationId}`);
    if (!response.ok) throw new ApiError(await refusalMessage(response), response.status);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async downloadReport(referenceId: string): Promise<void> {
    const response = await apiFetch(`/api/background-checks/${referenceId}/report`, {
      headers: { Accept: 'application/pdf' },
    });
    if (!response.ok) throw new ApiError(await refusalMessage(response), response.status);

    const blob = await response.blob();
    if (blob.size === 0) throw new Error('The verification report came back empty.');

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${referenceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};

/** A report exists only once the provider has returned findings. */
export function hasDownloadableReport(check: VerificationCheck): boolean {
  return check.status === 'COMPLETED' || check.status === 'PARTIAL_RESULTS';
}
