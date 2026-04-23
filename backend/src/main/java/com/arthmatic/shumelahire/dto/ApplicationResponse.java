package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ApplicationResponse {
    
    private String id;
    private String applicantId;
    private String applicantName;
    private String applicantEmail;
    private String jobAdId;
    private String jobTitle;
    private String department;
    private ApplicationStatus status;
    private String statusDisplayName;
    private String statusCssClass;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DocumentResponse> applicationDocuments;
    private long daysFromSubmission;
    private boolean canBeWithdrawn;
    private boolean isActive;
    
    // Constructors
    public ApplicationResponse() {}
    
    public ApplicationResponse(Application application) {
        this.id = application.getId();
        this.applicantId = application.getApplicant().getId();
        this.applicantName = application.getApplicant().getFullName();
        this.applicantEmail = application.getApplicant().getEmail();
        this.jobAdId = application.getJobPosting() != null ? application.getJobPosting().getId() : application.getJobPostingId();
        this.jobTitle = application.getJobTitle();
        this.department = application.getDepartment();
        this.status = application.getStatus();
        this.statusDisplayName = application.getStatusDisplayName();
        this.statusCssClass = application.getStatus().getCssClass();
        this.coverLetter = application.getCoverLetter();
        this.applicationSource = application.getApplicationSource();
        this.submittedAt = application.getSubmittedAt();
        this.withdrawnAt = application.getWithdrawnAt();
        this.withdrawalReason = application.getWithdrawalReason();
        this.screeningNotes = application.getScreeningNotes();
        this.interviewFeedback = application.getInterviewFeedback();
        this.rating = application.getRating();
        this.rejectionReason = application.getRejectionReason();
        this.offerDetails = application.getOfferDetails();
        this.startDate = application.getStartDate();
        this.createdAt = application.getCreatedAt();
        this.updatedAt = application.getUpdatedAt();
        this.daysFromSubmission = application.getDaysFromSubmission();
        this.canBeWithdrawn = application.canBeWithdrawn();
        this.isActive = application.isActive();
        
        if (application.getApplicationDocuments() != null) {
            this.applicationDocuments = application.getApplicationDocuments().stream()
                    .map(DocumentResponse::fromEntity)
                    .collect(Collectors.toList());
        }
    }
    
    // Static factory method
    public static ApplicationResponse fromEntity(Application application) {
        return new ApplicationResponse(application);
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getApplicantId() {
        return applicantId;
    }
    
    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }
    
    public String getApplicantName() {
        return applicantName;
    }
    
    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }
    
    public String getApplicantEmail() {
        return applicantEmail;
    }
    
    public void setApplicantEmail(String applicantEmail) {
        this.applicantEmail = applicantEmail;
    }
    
    public String getJobAdId() {
        return jobAdId;
    }
    
    public void setJobAdId(String jobAdId) {
        this.jobAdId = jobAdId;
    }
    
    public String getJobTitle() {
        return jobTitle;
    }
    
    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public ApplicationStatus getStatus() {
        return status;
    }
    
    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }
    
    public String getStatusDisplayName() {
        return statusDisplayName;
    }
    
    public void setStatusDisplayName(String statusDisplayName) {
        this.statusDisplayName = statusDisplayName;
    }
    
    public String getStatusCssClass() {
        return statusCssClass;
    }
    
    public void setStatusCssClass(String statusCssClass) {
        this.statusCssClass = statusCssClass;
    }
    
    public String getCoverLetter() {
        return coverLetter;
    }
    
    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
    
    public String getApplicationSource() {
        return applicationSource;
    }
    
    public void setApplicationSource(String applicationSource) {
        this.applicationSource = applicationSource;
    }
    
    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public LocalDateTime getWithdrawnAt() {
        return withdrawnAt;
    }
    
    public void setWithdrawnAt(LocalDateTime withdrawnAt) {
        this.withdrawnAt = withdrawnAt;
    }
    
    public String getWithdrawalReason() {
        return withdrawalReason;
    }
    
    public void setWithdrawalReason(String withdrawalReason) {
        this.withdrawalReason = withdrawalReason;
    }
    
    public String getScreeningNotes() {
        return screeningNotes;
    }
    
    public void setScreeningNotes(String screeningNotes) {
        this.screeningNotes = screeningNotes;
    }
    
    public String getInterviewFeedback() {
        return interviewFeedback;
    }
    
    public void setInterviewFeedback(String interviewFeedback) {
        this.interviewFeedback = interviewFeedback;
    }
    
    public Integer getRating() {
        return rating;
    }
    
    public void setRating(Integer rating) {
        this.rating = rating;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    public String getOfferDetails() {
        return offerDetails;
    }
    
    public void setOfferDetails(String offerDetails) {
        this.offerDetails = offerDetails;
    }
    
    public LocalDateTime getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
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
    
    public List<DocumentResponse> getApplicationDocuments() {
        return applicationDocuments;
    }
    
    public void setApplicationDocuments(List<DocumentResponse> applicationDocuments) {
        this.applicationDocuments = applicationDocuments;
    }
    
    public long getDaysFromSubmission() {
        return daysFromSubmission;
    }
    
    public void setDaysFromSubmission(long daysFromSubmission) {
        this.daysFromSubmission = daysFromSubmission;
    }
    
    public boolean isCanBeWithdrawn() {
        return canBeWithdrawn;
    }
    
    public void setCanBeWithdrawn(boolean canBeWithdrawn) {
        this.canBeWithdrawn = canBeWithdrawn;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
}