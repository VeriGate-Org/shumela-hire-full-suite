package com.arthmatic.shumelahire.dto.engagement;

import com.arthmatic.shumelahire.entity.engagement.WellnessProgram;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class WellnessProgramResponse {

    private String id;
    private String name;
    private String description;
    private String programType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
    private Integer maxParticipants;
    private Long currentParticipants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WellnessProgramResponse() {}

    public static WellnessProgramResponse fromEntity(WellnessProgram entity) {
        WellnessProgramResponse r = new WellnessProgramResponse();
        r.id = entity.getId();
        r.name = entity.getName();
        r.description = entity.getDescription();
        r.programType = entity.getProgramType() != null ? entity.getProgramType().name() : null;
        r.startDate = entity.getStartDate();
        r.endDate = entity.getEndDate();
        r.isActive = entity.getIsActive();
        r.maxParticipants = entity.getMaxParticipants();
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getProgramType() { return programType; }
    public void setProgramType(String programType) { this.programType = programType; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public Long getCurrentParticipants() { return currentParticipants; }
    public void setCurrentParticipants(Long currentParticipants) { this.currentParticipants = currentParticipants; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
