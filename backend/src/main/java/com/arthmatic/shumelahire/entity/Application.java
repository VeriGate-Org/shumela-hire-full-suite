package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "applications")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Application extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    @NotNull(message = "Applicant is required")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Applicant applicant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private JobPosting jobPosting;

    @Column(name = "job_posting_id", insertable = false, updatable = false)
    private Long jobPostingId;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "job_id")
    private String jobId;

    @Column(name = "department")
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "pipeline_stage", nullable = false)
    private PipelineStage pipelineStage = PipelineStage.APPLICATION_RECEIVED;

    @Column(name = "pipeline_stage_entered_at", nullable = false)
    private LocalDateTime pipelineStageEnteredAt;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "application_source")
    private String applicationSource;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    @Column(name = "withdrawal_reason", columnDefinition = "TEXT")
    private String withdrawalReason;

    @Column(name = "screening_notes", columnDefinition = "TEXT")
    private String screeningNotes;

    @Column(name = "interview_feedback", columnDefinition = "TEXT")
    private String interviewFeedback;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "offer_details", columnDefinition = "TEXT")
    private String offerDetails;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "salary_expectation")
    private Double salaryExpectation;

    @Column(name = "availability_date")
    private LocalDateTime availabilityDate;

    @Column(name = "interviewed_at")
    private LocalDateTime interviewedAt;

    @Column(name = "offer_extended_at")
    private LocalDateTime offerExtendedAt;

    @Column(name = "response_deadline")
    private LocalDateTime responseDeadline;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
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

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

    public JobPosting getJobPosting() { return jobPosting; }
    public void setJobPosting(JobPosting jobPosting) { this.jobPosting = jobPosting; }

    public Long getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(Long jobPostingId) { this.jobPostingId = jobPostingId; }

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
