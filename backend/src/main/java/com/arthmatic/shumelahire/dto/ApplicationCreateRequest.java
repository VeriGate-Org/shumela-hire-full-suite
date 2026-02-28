package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ApplicationCreateRequest {

    @NotNull(message = "Applicant ID is required")
    private Long applicantId;

    @NotNull(message = "Job ad ID is required")
    private Long jobAdId;

    private String jobTitle;

    private String department;

    @Size(max = 5000, message = "Cover letter must not exceed 5000 characters")
    private String coverLetter;

    @Pattern(regexp = "^(INTERNAL|EXTERNAL|REFERRAL|AGENCY|JOB_BOARD)$", message = "Invalid application source")
    private String applicationSource = "EXTERNAL";
    
    // Constructors
    public ApplicationCreateRequest() {}
    
    public ApplicationCreateRequest(Long applicantId, Long jobAdId, String coverLetter) {
        this.applicantId = applicantId;
        this.jobAdId = jobAdId;
        this.coverLetter = coverLetter;
    }
    
    // Getters and Setters
    public Long getApplicantId() {
        return applicantId;
    }
    
    public void setApplicantId(Long applicantId) {
        this.applicantId = applicantId;
    }
    
    public Long getJobAdId() {
        return jobAdId;
    }
    
    public void setJobAdId(Long jobAdId) {
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
}