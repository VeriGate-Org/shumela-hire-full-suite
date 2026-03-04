package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobAdTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class JobAdTemplateResponse {

    private Long id;
    private String name;
    private String description;
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
    private String contactEmail;
    private Boolean isArchived;
    private Integer usageCount;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public JobAdTemplateResponse() {}

    public static JobAdTemplateResponse fromEntity(JobAdTemplate entity) {
        JobAdTemplateResponse dto = new JobAdTemplateResponse();
        dto.id = entity.getId();
        dto.name = entity.getName();
        dto.description = entity.getDescription();
        dto.title = entity.getTitle();
        dto.intro = entity.getIntro();
        dto.responsibilities = entity.getResponsibilities();
        dto.requirements = entity.getRequirements();
        dto.benefits = entity.getBenefits();
        dto.location = entity.getLocation();
        dto.employmentType = entity.getEmploymentType();
        dto.salaryRangeMin = entity.getSalaryRangeMin();
        dto.salaryRangeMax = entity.getSalaryRangeMax();
        dto.closingDate = entity.getClosingDate();
        dto.contactEmail = entity.getContactEmail();
        dto.isArchived = entity.getIsArchived();
        dto.usageCount = entity.getUsageCount();
        dto.createdBy = entity.getCreatedBy();
        dto.createdAt = entity.getCreatedAt();
        dto.updatedAt = entity.getUpdatedAt();
        return dto;
    }

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
}
