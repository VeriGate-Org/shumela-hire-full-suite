package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * An applicant's application history, summarised.
 *
 * <p>The link this reads has always existed — {@code Application} holds an {@code applicantId},
 * DynamoDB indexes it as {@code GSI4 (APP_APPLICANT#{applicantId})}, and
 * {@code ApplicationDataRepository} exposes both
 * {@code findByApplicantIdOrderBySubmittedAtDesc} and {@code countByApplicantId}. What did not exist
 * was any way for a client to see it: {@code ApplicantResponse} describes a person and says nothing
 * about what they have applied for, so an applicant who has applied five times and been rejected
 * five times is indistinguishable from a first-time candidate.
 *
 * <p>Nothing here is inferred. Counts are counts, {@code lastAppliedAt} is a stored timestamp, and
 * an applicant with no applications returns {@code total = 0} rather than an absent object, so
 * callers can tell "never applied" from "not loaded".
 *
 * <p>Deliberately not included: a "furthest stage reached". {@code ApplicationStatus} carries no
 * ordering — {@code isTerminal()} and {@code isActive()} are the only predicates on it — so ranking
 * the statuses would mean inventing a progression the domain has not declared.
 */
public class ApplicantApplicationSummary {

    private int total;
    private int active;
    private boolean hired;
    private LocalDateTime lastAppliedAt;
    private Map<String, Integer> byStatus = new LinkedHashMap<>();
    private List<Entry> applications = new ArrayList<>();

    public ApplicantApplicationSummary() {
    }

    /**
     * @param applications this applicant's applications, newest first
     *                     (as returned by {@code findByApplicantIdOrderBySubmittedAtDesc})
     */
    public static ApplicantApplicationSummary from(List<Application> applications) {
        ApplicantApplicationSummary summary = new ApplicantApplicationSummary();
        if (applications == null || applications.isEmpty()) {
            return summary;
        }

        summary.total = applications.size();

        for (Application application : applications) {
            ApplicationStatus status = application.getStatus();

            if (status != null) {
                if (status.isActive()) {
                    summary.active++;
                }
                if (status == ApplicationStatus.HIRED) {
                    summary.hired = true;
                }
                summary.byStatus.merge(status.name(), 1, Integer::sum);
            }

            LocalDateTime submittedAt = application.getSubmittedAt();
            if (submittedAt != null
                    && (summary.lastAppliedAt == null || submittedAt.isAfter(summary.lastAppliedAt))) {
                summary.lastAppliedAt = submittedAt;
            }

            summary.applications.add(new Entry(application));
        }

        return summary;
    }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public int getActive() { return active; }
    public void setActive(int active) { this.active = active; }

    public boolean isHired() { return hired; }
    public void setHired(boolean hired) { this.hired = hired; }

    public LocalDateTime getLastAppliedAt() { return lastAppliedAt; }
    public void setLastAppliedAt(LocalDateTime lastAppliedAt) { this.lastAppliedAt = lastAppliedAt; }

    public Map<String, Integer> getByStatus() { return byStatus; }
    public void setByStatus(Map<String, Integer> byStatus) { this.byStatus = byStatus; }

    public List<Entry> getApplications() { return applications; }
    public void setApplications(List<Entry> applications) { this.applications = applications; }

    /**
     * One application, reduced to what a candidate-centric view needs.
     *
     * <p>Carries no {@code statusCssClass}. {@code ApplicationStatus.getCssClass()} returns raw
     * Tailwind utilities ({@code bg-blue-100 text-blue-800}) that sit outside the ShumelaHire
     * palette and do not survive dark mode, so presentation stays with the client.
     */
    public static class Entry {
        private String id;
        private String jobPostingId;
        private String jobTitle;
        private String department;
        private String status;
        private String statusDisplayName;
        private LocalDateTime submittedAt;

        public Entry() {
        }

        public Entry(Application application) {
            this.id = application.getId();
            this.jobPostingId = application.getJobPostingId();
            this.jobTitle = application.getJobTitle();
            this.department = application.getDepartment();
            this.submittedAt = application.getSubmittedAt();
            if (application.getStatus() != null) {
                this.status = application.getStatus().name();
                this.statusDisplayName = application.getStatus().getDisplayName();
            }
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getJobPostingId() { return jobPostingId; }
        public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getStatusDisplayName() { return statusDisplayName; }
        public void setStatusDisplayName(String statusDisplayName) { this.statusDisplayName = statusDisplayName; }

        public LocalDateTime getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    }
}
