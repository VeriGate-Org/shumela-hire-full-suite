package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Counts describing the whole applicant base.
 *
 * <p>The question the applicants list exists to answer is <b>who keeps coming back</b>. Someone who
 * has applied four times and been rejected four times is a different proposition from a first-time
 * candidate, and until now the list could not tell them apart — {@code ApplicantResponse} describes
 * a person and says nothing about what they have applied for.
 *
 * <p><b>This is one pass over applications, not one query per applicant.</b> The batch endpoint
 * {@code GET /api/applicants/application-summaries} decorates a loaded page and caps at
 * {@code MAX_SUMMARY_BATCH} ids by design; it cannot answer a question about everybody. Grouping the
 * whole application set by applicant once is the cheaper shape for a whole-set figure, and it is the
 * only one that stays correct as the list is paged.
 *
 * <p><b>The definitions here are the same objects the per-applicant summary uses</b> — active is
 * {@code ApplicationStatus.isActive()}, hired is any application at {@code HIRED}. If they were
 * restated the strip and the rows beneath it would drift apart, and a total that disagrees with the
 * rows it sits above is worse than no total.
 */
public class ApplicantSummaryResponse {

    /** Applicant records on file, whether or not they have ever applied for anything. */
    private long registered;

    /**
     * Registered and has never submitted an application.
     *
     * <p>A real and useful segment — people who created a profile and stopped — and it is invisible
     * from the applications side of the product, because an applicant with no applications appears
     * in no application query.
     */
    private long neverApplied;

    /** Exactly one application, ever. */
    private long appliedOnce;

    /** Two or more applications. The segment the page is organised around. */
    private long repeatApplicants;

    /** Has at least one application still live, by {@code ApplicationStatus.isActive()}. */
    private long inProcessNow;

    /** Has been hired at least once. Not mutually exclusive with the above — people are re-hired. */
    private long previouslyHired;

    /** Applications counted, across everybody. The denominator for all of the above. */
    private long applicationsRecorded;

    /**
     * Applications whose applicant is not in the registered set.
     *
     * <p>Reported rather than absorbed. It should be zero; if it is not, the applicant was deleted
     * and their applications were left behind, and {@link #neverApplied} is being computed against a
     * base that no longer matches. Silently clamping that to zero would make a data fault look like
     * a healthy tenant.
     */
    private long orphanedApplications;

    /**
     * @param registeredApplicantIds every applicant id on file — ids, not a count, so that
     *                               "never applied" is a set difference rather than a subtraction
     *                               that can go negative and be quietly clamped
     * @param applications           every application, ungrouped
     */
    public static ApplicantSummaryResponse from(Collection<String> registeredApplicantIds,
                                                List<Application> applications) {
        ApplicantSummaryResponse summary = new ApplicantSummaryResponse();

        Set<String> registeredIds = registeredApplicantIds == null
                ? Set.of()
                : new HashSet<>(registeredApplicantIds);
        summary.registered = registeredIds.size();

        if (applications == null || applications.isEmpty()) {
            summary.neverApplied = summary.registered;
            return summary;
        }

        Map<String, Tally> byApplicant = new HashMap<>();

        for (Application application : applications) {
            // The entity holds the Applicant itself, not a bare id — the applicantId the DynamoDB
            // GSI4 index is built on lives on the stored item, not here.
            String applicantId = application.getApplicant() == null
                    ? null
                    : application.getApplicant().getId();
            if (applicantId == null || applicantId.isBlank()) {
                // An application that names no applicant cannot be attributed to anybody. It still
                // happened, so it counts towards the total and towards the orphan figure.
                summary.applicationsRecorded++;
                summary.orphanedApplications++;
                continue;
            }

            summary.applicationsRecorded++;
            if (!registeredIds.contains(applicantId)) {
                summary.orphanedApplications++;
            }

            Tally tally = byApplicant.computeIfAbsent(applicantId, id -> new Tally());
            tally.total++;

            ApplicationStatus status = application.getStatus();
            if (status != null) {
                if (status.isActive()) {
                    tally.active++;
                }
                if (status == ApplicationStatus.HIRED) {
                    tally.hired = true;
                }
            }
        }

        for (Map.Entry<String, Tally> entry : byApplicant.entrySet()) {
            // Only registered applicants are described. An orphaned application's applicant is not
            // in the base being reported on, so counting them would make the segments sum past the
            // registered total.
            if (!registeredIds.contains(entry.getKey())) {
                continue;
            }

            Tally tally = entry.getValue();
            if (tally.total == 1) {
                summary.appliedOnce++;
            } else if (tally.total > 1) {
                summary.repeatApplicants++;
            }
            if (tally.active > 0) {
                summary.inProcessNow++;
            }
            if (tally.hired) {
                summary.previouslyHired++;
            }
        }

        summary.neverApplied = summary.registered - summary.appliedOnce - summary.repeatApplicants;

        return summary;
    }

    /** One applicant's running totals while the single pass is in progress. */
    private static final class Tally {
        private int total;
        private int active;
        private boolean hired;
    }

    public long getRegistered() { return registered; }
    public void setRegistered(long registered) { this.registered = registered; }

    public long getNeverApplied() { return neverApplied; }
    public void setNeverApplied(long neverApplied) { this.neverApplied = neverApplied; }

    public long getAppliedOnce() { return appliedOnce; }
    public void setAppliedOnce(long appliedOnce) { this.appliedOnce = appliedOnce; }

    public long getRepeatApplicants() { return repeatApplicants; }
    public void setRepeatApplicants(long repeatApplicants) { this.repeatApplicants = repeatApplicants; }

    public long getInProcessNow() { return inProcessNow; }
    public void setInProcessNow(long inProcessNow) { this.inProcessNow = inProcessNow; }

    public long getPreviouslyHired() { return previouslyHired; }
    public void setPreviouslyHired(long previouslyHired) { this.previouslyHired = previouslyHired; }

    public long getApplicationsRecorded() { return applicationsRecorded; }
    public void setApplicationsRecorded(long applicationsRecorded) { this.applicationsRecorded = applicationsRecorded; }

    public long getOrphanedApplications() { return orphanedApplications; }
    public void setOrphanedApplications(long orphanedApplications) { this.orphanedApplications = orphanedApplications; }
}
