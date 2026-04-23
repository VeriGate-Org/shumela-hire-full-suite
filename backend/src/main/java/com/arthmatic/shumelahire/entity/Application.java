package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Application extends TenantAwareEntity {

    private String id;

    @NotNull(message = "Applicant is required")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Applicant applicant;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private JobPosting jobPosting;

    private String jobPostingId;

    private String jobTitle;

    private String jobId;

    private String department;

    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    private PipelineStage pipelineStage = PipelineStage.APPLICATION_RECEIVED;

    private LocalDateTime pipelineStageEnteredAt;

    private String coverLetter;

    private String applicationSource;

    private LocalDateTime submittedAt;

    private LocalDateTime withdrawnAt;

    private String withdrawalReason;

    private String screeningNotes;

    private String interviewFeedback;

    private Integer rating;

    private String rejectionReason;

    private String offerDetails;

    private LocalDateTime startDate;

    private Double salaryExpectation;

    private LocalDateTime availabilityDate;

    private LocalDateTime interviewedAt;

    private LocalDateTime offerExtendedAt;

    private LocalDateTime responseDeadline;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @JsonIgnore
    private List<Document> applicationDocuments;

    // Constructors
    public Application() {
        this.submittedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.pipelineStageEnteredAt = LocalDateTime.now();
    }

    public Application(Applicant applicant, JobPosting jobPosting, String coverLetter) {
        this();
        this.applicant = applicant;
        this.jobPosting = jobPosting;
        this.jobTitle = jobPosting.getTitle();
        this.department = jobPosting.getDepartment();
        this.coverLetter = coverLetter;
    }

    public Application(Applicant applicant, String jobTitle) {
        this();
        this.applicant = applicant;
        this.jobTitle = jobTitle;
    }

    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

    public JobPosting getJobPosting() { return jobPosting; }
    public void setJobPosting(JobPosting jobPosting) { this.jobPosting = jobPosting; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public PipelineStage getPipelineStage() { return pipelineStage; }
    public void setPipelineStage(PipelineStage pipelineStage) { this.pipelineStage = pipelineStage; }

    public LocalDateTime getPipelineStageEnteredAt() { return pipelineStageEnteredAt; }
    public void setPipelineStageEnteredAt(LocalDateTime pipelineStageEnteredAt) { this.pipelineStageEnteredAt = pipelineStageEnteredAt; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public String getApplicationSource() { return applicationSource; }
    public void setApplicationSource(String applicationSource) { this.applicationSource = applicationSource; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getWithdrawnAt() { return withdrawnAt; }
    public void setWithdrawnAt(LocalDateTime withdrawnAt) { this.withdrawnAt = withdrawnAt; }

    public String getWithdrawalReason() { return withdrawalReason; }
    public void setWithdrawalReason(String withdrawalReason) { this.withdrawalReason = withdrawalReason; }

    public String getScreeningNotes() { return screeningNotes; }
    public void setScreeningNotes(String screeningNotes) { this.screeningNotes = screeningNotes; }

    public String getInterviewFeedback() { return interviewFeedback; }
    public void setInterviewFeedback(String interviewFeedback) { this.interviewFeedback = interviewFeedback; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getOfferDetails() { return offerDetails; }
    public void setOfferDetails(String offerDetails) { this.offerDetails = offerDetails; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public Double getSalaryExpectation() { return salaryExpectation; }
    public void setSalaryExpectation(Double salaryExpectation) { this.salaryExpectation = salaryExpectation; }

    public LocalDateTime getAvailabilityDate() { return availabilityDate; }
    public void setAvailabilityDate(LocalDateTime availabilityDate) { this.availabilityDate = availabilityDate; }

    public LocalDateTime getInterviewedAt() { return interviewedAt; }
    public void setInterviewedAt(LocalDateTime interviewedAt) { this.interviewedAt = interviewedAt; }

    public LocalDateTime getOfferExtendedAt() { return offerExtendedAt; }
    public void setOfferExtendedAt(LocalDateTime offerExtendedAt) { this.offerExtendedAt = offerExtendedAt; }

    public LocalDateTime getResponseDeadline() { return responseDeadline; }
    public void setResponseDeadline(LocalDateTime responseDeadline) { this.responseDeadline = responseDeadline; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Document> getApplicationDocuments() { return applicationDocuments; }
    public void setApplicationDocuments(List<Document> applicationDocuments) { this.applicationDocuments = applicationDocuments; }

    // Helper methods
    public boolean canBeWithdrawn() {
        return status == ApplicationStatus.SUBMITTED ||
               status == ApplicationStatus.SCREENING ||
               status == ApplicationStatus.INTERVIEW_SCHEDULED;
    }

    public boolean isActive() {
        return status != ApplicationStatus.WITHDRAWN &&
               status != ApplicationStatus.REJECTED &&
               status != ApplicationStatus.OFFERED;
    }

    public String getStatusDisplayName() {
        return status.getDisplayName();
    }

    public long getDaysFromSubmission() {
        return java.time.temporal.ChronoUnit.DAYS.between(submittedAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }

    public long getDaysInCurrentStage() {
        return java.time.temporal.ChronoUnit.DAYS.between(pipelineStageEnteredAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }

    public boolean canProgressToStage(PipelineStage targetStage) {
        return pipelineStage != null && pipelineStage.canProgressTo(targetStage);
    }

    public boolean isInActiveStage() {
        return pipelineStage != null && pipelineStage.isActive();
    }

    public boolean isInTerminalStage() {
        return pipelineStage != null && pipelineStage.isTerminal();
    }

    public double getPipelineProgress() {
        return pipelineStage != null ? pipelineStage.getProgressPercentage() : 0.0;
    }

    public String getPipelineStageDisplayName() {
        return pipelineStage != null ? pipelineStage.getDisplayName() : "Unknown";
    }

    public String getPipelineStageIcon() {
        return pipelineStage != null ? pipelineStage.getStatusIcon() : "?";
    }

    public String getPipelineStageCssClass() {
        return pipelineStage != null ? pipelineStage.getCssClass() : "bg-gray-100 text-gray-800";
    }

    public static final String STATUS_SUBMITTED = "SUBMITTED";
    public static final String STATUS_SCREENING = "SCREENING";
    public static final String STATUS_INTERVIEWING = "INTERVIEWING";
    public static final String STATUS_OFFERED = "OFFERED";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_WITHDRAWN = "WITHDRAWN";

    @Override
    public String toString() {
        return "Application{" +
                "id=" + id +
                ", jobTitle='" + jobTitle + '\'' +
                ", status=" + status +
                ", rating=" + rating +
                ", submittedAt=" + submittedAt +
                '}';
    }
}
