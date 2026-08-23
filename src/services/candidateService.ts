import { apiFetch } from '@/lib/api-fetch';

// Cache applicant ID to avoid repeated lookups
let cachedApplicantId: string | null = null;
let cachedEmail: string | null = null;

export async function getApplicantByEmail(email: string) {
  const response = await apiFetch(`/api/applicants?search=${encodeURIComponent(email)}&size=1`);
  if (!response.ok) throw new Error(`Failed to find applicant: HTTP ${response.status}`);
  const result = await response.json();
  const applicants = result.content || result.data || result || [];
  if (applicants.length === 0) return null;
  return applicants[0];
}

export async function getApplicantId(email: string): Promise<string | null> {
  if (cachedApplicantId && cachedEmail === email) return cachedApplicantId;
  const applicant = await getApplicantByEmail(email);
  if (applicant) {
    cachedApplicantId = applicant.id;
    cachedEmail = email;
  }
  return applicant?.id || null;
}

export async function getApplicant(applicantId: string) {
  const response = await apiFetch(`/api/applicants/${applicantId}`);
  if (!response.ok) throw new Error(`Failed to fetch applicant: HTTP ${response.status}`);
  return response.json();
}

export async function getDocuments(applicantId: string) {
  const response = await apiFetch(`/api/applicants/${applicantId}/documents`);
  if (!response.ok) throw new Error(`Failed to fetch documents: HTTP ${response.status}`);
  const result = await response.json();
  return result.content || result.data || result || [];
}

export async function getApplications(applicantId: string) {
  const response = await apiFetch(`/api/applications/applicant/${applicantId}`);
  if (!response.ok) throw new Error(`Failed to fetch applications: HTTP ${response.status}`);
  const result = await response.json();
  return result.content || result.data || result || [];
}

export async function getInterviewsForApplication(applicationId: string) {
  const response = await apiFetch(`/api/interviews/application/${applicationId}`);
  if (!response.ok) throw new Error(`Failed to fetch interviews: HTTP ${response.status}`);
  const result = await response.json();
  return result.content || result.data || result || [];
}

export async function getOffersForApplication(applicationId: string) {
  const response = await apiFetch(`/api/offers/applications/${applicationId}`);
  if (!response.ok) throw new Error(`Failed to fetch offers: HTTP ${response.status}`);
  const result = await response.json();
  return result.content || result.data || result || [];
}

export async function getOffersForApplicant(applicantId: string) {
  const response = await apiFetch(`/api/offers/applicant/${applicantId}`);
  if (!response.ok) throw new Error(`Failed to fetch offers: HTTP ${response.status}`);
  const result = await response.json();
  return result.content || result.data || result || [];
}

/**
 * Applicant- and Employee-dashboard summary: the caller's own applications
 * plus their scheduled interviews across all of them.
 *
 * Deliberately does NOT use GET /api/applications or GET /api/interviews —
 * those are staff-only search endpoints (no self-service role has ever had
 * access, including Applicant) and 403 for a signed-in candidate. The
 * correct self-service path is applicant-id -> their applications ->
 * per-application interviews, via the endpoints actually opened up for
 * APPLICANT/EMPLOYEE.
 */
export async function getMyDashboardData(email: string): Promise<{ applications: any[]; upcomingInterviews: any[] }> {
  const applicantId = await getApplicantId(email);
  if (!applicantId) return { applications: [], upcomingInterviews: [] };

  const applications = await getApplications(applicantId).catch(() => []);

  const interviewLists = await Promise.all(
    applications.map((app: Record<string, unknown>) =>
      getInterviewsForApplication(String(app.id)).catch(() => [])
    )
  );
  const upcomingInterviews = interviewLists
    .flat()
    .filter((interview: Record<string, unknown>) => interview.status === 'SCHEDULED');

  return { applications, upcomingInterviews };
}
