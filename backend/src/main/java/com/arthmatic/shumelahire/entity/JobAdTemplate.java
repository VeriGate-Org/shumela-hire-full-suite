package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class JobAdTemplate extends TenantAwareEntity {

    private Long id;

    @NotBlank(message = "Template name is required")
    private String name;

    private String description;

    @NotBlank(message = "Title template is required")
    private String title;

    private String intro;

    private String responsibilities;

    private String requirements;

    private String benefits;

    private String location;

    private String employmentType;

    private BigDecimal salaryRangeMin;

    private BigDecimal salaryRangeMax;

    private LocalDate closingDate;

    @NotBlank(message = "Contact email is required")
    private String contactEmail;

    private Boolean isArchived = false;

    private Integer usageCount = 0;

    @NotBlank(message = "Created by is required")
    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public JobAdTemplate() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }

    public String getResponsibilities() { return responsibilities; }
    public void setResponsibilities(String responsibilities) { this.responsibilities = responsibilities; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public BigDecimal getSalaryRangeMin() { return salaryRangeMin; }
    public void setSalaryRangeMin(BigDecimal salaryRangeMin) { this.salaryRangeMin = salaryRangeMin; }

    public BigDecimal getSalaryRangeMax() { return salaryRangeMax; }
    public void setSalaryRangeMax(BigDecimal salaryRangeMax) { this.salaryRangeMax = salaryRangeMax; }

    public LocalDate getClosingDate() { return closingDate; }
    public void setClosingDate(LocalDate closingDate) { this.closingDate = closingDate; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return "JobAdTemplate{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", title='" + title + '\'' +
                ", isArchived=" + isArchived +
                ", createdBy='" + createdBy + '\'' +
                '}';
    }
}
