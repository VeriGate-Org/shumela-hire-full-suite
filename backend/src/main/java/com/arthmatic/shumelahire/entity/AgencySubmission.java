package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class AgencySubmission extends TenantAwareEntity {

    private Long id;

    private AgencyProfile agency;

    private JobPosting jobPosting;

    @NotBlank
    private String candidateName;

    @NotBlank
    @Email
    private String candidateEmail;

    private String candidatePhone;

    private String cvFileKey;

    private String coverNote;

    private AgencySubmissionStatus status = AgencySubmissionStatus.SUBMITTED;

    private Application linkedApplication;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private Long reviewedBy;

    public AgencySubmission() {
        this.submittedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AgencyProfile getAgency() { return agency; }
    public void setAgency(AgencyProfile agency) { this.agency = agency; }

    public JobPosting getJobPosting() { return jobPosting; }
    public void setJobPosting(JobPosting jobPosting) { this.jobPosting = jobPosting; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public String getCandidatePhone() { return candidatePhone; }
    public void setCandidatePhone(String candidatePhone) { this.candidatePhone = candidatePhone; }

    public String getCvFileKey() { return cvFileKey; }
    public void setCvFileKey(String cvFileKey) { this.cvFileKey = cvFileKey; }

    public String getCoverNote() { return coverNote; }
    public void setCoverNote(String coverNote) { this.coverNote = coverNote; }

    public AgencySubmissionStatus getStatus() { return status; }
    public void setStatus(AgencySubmissionStatus status) { this.status = status; }

    public Application getLinkedApplication() { return linkedApplication; }
    public void setLinkedApplication(Application linkedApplication) { this.linkedApplication = linkedApplication; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public Long getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }
}
