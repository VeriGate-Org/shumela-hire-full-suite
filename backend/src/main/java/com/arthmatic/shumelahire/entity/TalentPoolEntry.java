package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TalentPoolEntry extends TenantAwareEntity {

    private Long id;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private TalentPool talentPool;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Applicant applicant;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Application sourceApplication;

    private String sourceType; // MANUAL, AUTO_REJECTED, AGENCY

    private String notes;

    private Integer rating; // 1-5

    private Boolean isAvailable = true;

    private LocalDateTime lastContactedAt;

    private Long addedBy;

    private LocalDateTime addedAt;

    private LocalDateTime removedAt;

    private String removalReason;

    public TalentPoolEntry() {
        this.addedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TalentPool getTalentPool() { return talentPool; }
    public void setTalentPool(TalentPool talentPool) { this.talentPool = talentPool; }

    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

    public Application getSourceApplication() { return sourceApplication; }
    public void setSourceApplication(Application sourceApplication) { this.sourceApplication = sourceApplication; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public LocalDateTime getLastContactedAt() { return lastContactedAt; }
    public void setLastContactedAt(LocalDateTime lastContactedAt) { this.lastContactedAt = lastContactedAt; }

    public Long getAddedBy() { return addedBy; }
    public void setAddedBy(Long addedBy) { this.addedBy = addedBy; }

    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }

    public LocalDateTime getRemovedAt() { return removedAt; }
    public void setRemovedAt(LocalDateTime removedAt) { this.removedAt = removedAt; }

    public String getRemovalReason() { return removalReason; }
    public void setRemovalReason(String removalReason) { this.removalReason = removalReason; }
}
