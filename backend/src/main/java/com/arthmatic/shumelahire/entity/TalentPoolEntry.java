package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TalentPoolEntry extends TenantAwareEntity {

    private String id;

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

    private String addedBy;

    private LocalDateTime addedAt;

    private LocalDateTime removedAt;

    private String removalReason;

    /**
     * The date this entry becomes eligible for deletion.
     *
     * <p>Stored per record rather than derived at purge time so that retention is <b>auditable</b>:
     * you can look at one candidate and say when their data is due to go, instead of inferring it
     * from a cron expression and a config value that may have changed since.
     *
     * <p><b>Null means no expiry, never "expired".</b> Every entry written before a retention period
     * was configured carries null, and reading that as "due" would delete the entire pool base on
     * the first run. Same rule as agency contract expiry, for the same reason.
     *
     * <p>A {@code LocalDate} rather than a timestamp: retention is a policy expressed in months, and
     * a candidate's data does not become deletable at 14:32.
     */
    private LocalDate retainUntil;

    /**
     * When the candidate was told their entry is due to be removed.
     *
     * <p>Null means no notice has gone out, and a purge must not delete an entry that has not been
     * warned — the notice exists so a candidate can ask to stay, which turns a compliance liability
     * into a live pool. It is a timestamp rather than a date because it records something that
     * happened, not a policy boundary.
     */
    private LocalDateTime retentionNoticeSentAt;

    public TalentPoolEntry() {
        this.addedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public String getAddedBy() { return addedBy; }
    public void setAddedBy(String addedBy) { this.addedBy = addedBy; }

    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }

    public LocalDateTime getRemovedAt() { return removedAt; }
    public void setRemovedAt(LocalDateTime removedAt) { this.removedAt = removedAt; }

    public LocalDate getRetainUntil() { return retainUntil; }
    public void setRetainUntil(LocalDate retainUntil) { this.retainUntil = retainUntil; }

    public LocalDateTime getRetentionNoticeSentAt() { return retentionNoticeSentAt; }
    public void setRetentionNoticeSentAt(LocalDateTime retentionNoticeSentAt) { this.retentionNoticeSentAt = retentionNoticeSentAt; }

    public String getRemovalReason() { return removalReason; }
    public void setRemovalReason(String removalReason) { this.removalReason = removalReason; }
}
