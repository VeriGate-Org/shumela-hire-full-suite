package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * Represents a background/verification check initiated for a candidate
 * through an external verification provider (e.g. Dots Africa).
 */
public class BackgroundCheck extends TenantAwareEntity {

    private String id;

    @JsonIgnore
    @NotNull(message = "Application is required")
    private Application application;

    private String referenceId;

    @NotBlank(message = "Candidate ID number is required")
    private String candidateIdNumber;

    private String candidateName;

    private String candidateEmail;

    private String checkTypes; // JSON array of check type strings

    private BackgroundCheckStatus status = BackgroundCheckStatus.INITIATED;

    private BackgroundCheckResult overallResult;

    private String resultsJson; // JSON object with per-check-type results

    private Boolean consentObtained = false;

    private LocalDateTime consentObtainedAt;

    @NotNull(message = "Initiator is required")
    private String initiatedBy; // User ID who initiated the check

    private String provider; // e.g. "dots-africa"

    private String externalScreeningId; // Provider's internal screening reference

    private String reportUrl;

    private String errorMessage;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime submittedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;

    // Constructors
    public BackgroundCheck() {
        this.createdAt = LocalDateTime.now();
    }

    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean canBeCancelled() {
        return status == BackgroundCheckStatus.INITIATED
                || status == BackgroundCheckStatus.PENDING_CONSENT
                || status == BackgroundCheckStatus.IN_PROGRESS;
    }

    public boolean isComplete() {
        return status == BackgroundCheckStatus.COMPLETED;
    }

    public boolean hasFailed() {
        return status == BackgroundCheckStatus.FAILED;
    }

    public boolean hasAdverseFindings() {
        return overallResult == BackgroundCheckResult.ADVERSE;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getCandidateIdNumber() {
        return candidateIdNumber;
    }

    public void setCandidateIdNumber(String candidateIdNumber) {
        this.candidateIdNumber = candidateIdNumber;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getCandidateEmail() {
        return candidateEmail;
    }

    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public String getCheckTypes() {
        return checkTypes;
    }

    public void setCheckTypes(String checkTypes) {
        this.checkTypes = checkTypes;
    }

    public BackgroundCheckStatus getStatus() {
        return status;
    }

    public void setStatus(BackgroundCheckStatus status) {
        this.status = status;
    }

    public BackgroundCheckResult getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(BackgroundCheckResult overallResult) {
        this.overallResult = overallResult;
    }

    public String getResultsJson() {
        return resultsJson;
    }

    public void setResultsJson(String resultsJson) {
        this.resultsJson = resultsJson;
    }

    public Boolean getConsentObtained() {
        return consentObtained;
    }

    public void setConsentObtained(Boolean consentObtained) {
        this.consentObtained = consentObtained;
    }

    public LocalDateTime getConsentObtainedAt() {
        return consentObtainedAt;
    }

    public void setConsentObtainedAt(LocalDateTime consentObtainedAt) {
        this.consentObtainedAt = consentObtainedAt;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getExternalScreeningId() {
        return externalScreeningId;
    }

    public void setExternalScreeningId(String externalScreeningId) {
        this.externalScreeningId = externalScreeningId;
    }

    public String getReportUrl() {
        return reportUrl;
    }

    public void setReportUrl(String reportUrl) {
        this.reportUrl = reportUrl;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }
}
