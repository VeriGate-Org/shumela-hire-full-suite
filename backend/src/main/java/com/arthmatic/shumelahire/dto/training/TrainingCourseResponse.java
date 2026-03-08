package com.arthmatic.shumelahire.dto.training;

import com.arthmatic.shumelahire.entity.training.TrainingCourse;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TrainingCourseResponse {

    private Long id;
    private String title;
    private String code;
    private String description;
    private String deliveryMethod;
    private String category;
    private String provider;
    private BigDecimal durationHours;
    private Integer maxParticipants;
    private BigDecimal cost;
    private Boolean isMandatory;
    private Boolean isActive;
    private int sessionCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TrainingCourseResponse() {}

    public static TrainingCourseResponse fromEntity(TrainingCourse entity) {
        TrainingCourseResponse r = new TrainingCourseResponse();
        r.id = entity.getId();
        r.title = entity.getTitle();
        r.code = entity.getCode();
        r.description = entity.getDescription();
        r.deliveryMethod = entity.getDeliveryMethod() != null ? entity.getDeliveryMethod().name() : null;
        r.category = entity.getCategory();
        r.provider = entity.getProvider();
        r.durationHours = entity.getDurationHours();
        r.maxParticipants = entity.getMaxParticipants();
        r.cost = entity.getCost();
        r.isMandatory = entity.getIsMandatory();
        r.isActive = entity.getIsActive();
        r.sessionCount = entity.getSessions() != null ? entity.getSessions().size() : 0;
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDeliveryMethod() { return deliveryMethod; }
    public void setDeliveryMethod(String deliveryMethod) { this.deliveryMethod = deliveryMethod; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public BigDecimal getDurationHours() { return durationHours; }
    public void setDurationHours(BigDecimal durationHours) { this.durationHours = durationHours; }

    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public Boolean getIsMandatory() { return isMandatory; }
    public void setIsMandatory(Boolean isMandatory) { this.isMandatory = isMandatory; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public int getSessionCount() { return sessionCount; }
    public void setSessionCount(int sessionCount) { this.sessionCount = sessionCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
