package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class JobPostingCreateRequest {
    
    @NotBlank(message = "Job title is required")
    private String title;
    
    @NotBlank(message = "Department is required")
    private String department;
    
    private String location;
    
    @NotNull(message = "Employment type is required")
    private EmploymentType employmentType;
    
    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;
    
    @NotBlank(message = "Job description is required")
    @Size(min = 100, message = "Job description must be at least 100 characters")
    private String description;
    
    private String requirements;
    
    private String responsibilities;
    
    private String qualifications;
    
    private String benefits;
    
    private BigDecimal salaryMin;
    
    private BigDecimal salaryMax;
    
    private String salaryCurrency = "ZAR";
    
    private Boolean remoteWorkAllowed = false;
    
    private Boolean travelRequired = false;
    
    private LocalDateTime applicationDeadline;
    
    @Min(value = 1, message = "At least one position must be available")
    private Integer positionsAvailable = 1;
    
    private String internalNotes;
    
    private String externalJobBoards;

    private String requiredCheckTypes;

    private Boolean enforceCheckCompletion = false;

    private String seoTitle;
    
    private String seoDescription;
    
    private String seoKeywords;
    
    private Boolean featured = false;
    
    private Boolean urgent = false;
    
    // Constructors
    public JobPostingCreateRequest() {}
    
    // Getters and Setters
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public EmploymentType getEmploymentType() {
        return employmentType;
    }
    
    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }
    
    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }
    
    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getRequirements() {
        return requirements;
    }
    
    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }
    
    public String getResponsibilities() {
        return responsibilities;
    }
    
    public void setResponsibilities(String responsibilities) {
        this.responsibilities = responsibilities;
    }
    
    public String getQualifications() {
        return qualifications;
    }
    
    public void setQualifications(String qualifications) {
        this.qualifications = qualifications;
    }
    
    public String getBenefits() {
        return benefits;
    }
    
    public void setBenefits(String benefits) {
        this.benefits = benefits;
    }
    
    public BigDecimal getSalaryMin() {
        return salaryMin;
    }
    
    public void setSalaryMin(BigDecimal salaryMin) {
        this.salaryMin = salaryMin;
    }
    
    public BigDecimal getSalaryMax() {
        return salaryMax;
    }
    
    public void setSalaryMax(BigDecimal salaryMax) {
        this.salaryMax = salaryMax;
    }
    
    public String getSalaryCurrency() {
        return salaryCurrency;
    }
    
    public void setSalaryCurrency(String salaryCurrency) {
        this.salaryCurrency = salaryCurrency;
    }
    
    public Boolean getRemoteWorkAllowed() {
        return remoteWorkAllowed;
    }
    
    public void setRemoteWorkAllowed(Boolean remoteWorkAllowed) {
        this.remoteWorkAllowed = remoteWorkAllowed;
    }
    
    public Boolean getTravelRequired() {
        return travelRequired;
    }
    
    public void setTravelRequired(Boolean travelRequired) {
        this.travelRequired = travelRequired;
    }
    
    public LocalDateTime getApplicationDeadline() {
        return applicationDeadline;
    }
    
    public void setApplicationDeadline(LocalDateTime applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }
    
    public Integer getPositionsAvailable() {
        return positionsAvailable;
    }
    
    public void setPositionsAvailable(Integer positionsAvailable) {
        this.positionsAvailable = positionsAvailable;
    }
    
    public String getInternalNotes() {
        return internalNotes;
    }
    
    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }
    
    public String getExternalJobBoards() {
        return externalJobBoards;
    }
    
    public void setExternalJobBoards(String externalJobBoards) {
        this.externalJobBoards = externalJobBoards;
    }

    public String getRequiredCheckTypes() {
        return requiredCheckTypes;
    }

    public void setRequiredCheckTypes(String requiredCheckTypes) {
        this.requiredCheckTypes = requiredCheckTypes;
    }

    public Boolean getEnforceCheckCompletion() {
        return enforceCheckCompletion;
    }

    public void setEnforceCheckCompletion(Boolean enforceCheckCompletion) {
        this.enforceCheckCompletion = enforceCheckCompletion;
    }

    public String getSeoTitle() {
        return seoTitle;
    }
    
    public void setSeoTitle(String seoTitle) {
        this.seoTitle = seoTitle;
    }
    
    public String getSeoDescription() {
        return seoDescription;
    }
    
    public void setSeoDescription(String seoDescription) {
        this.seoDescription = seoDescription;
    }
    
    public String getSeoKeywords() {
        return seoKeywords;
    }
    
    public void setSeoKeywords(String seoKeywords) {
        this.seoKeywords = seoKeywords;
    }
    
    public Boolean getFeatured() {
        return featured;
    }
    
    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }
    
    public Boolean getUrgent() {
        return urgent;
    }
    
    public void setUrgent(Boolean urgent) {
        this.urgent = urgent;
    }
}