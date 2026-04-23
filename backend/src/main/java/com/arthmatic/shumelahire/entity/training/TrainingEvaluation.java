package com.arthmatic.shumelahire.entity.training;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class TrainingEvaluation extends TenantAwareEntity {

    private String id;

    @NotNull
    private String sessionId;

    @NotNull
    private String employeeId;

    @NotNull
    @Min(1) @Max(5)
    private Integer overallRating;

    @Min(1) @Max(5)
    private Integer contentRating;

    @Min(1) @Max(5)
    private Integer instructorRating;

    @Min(1) @Max(5)
    private Integer relevanceRating;

    private String comments;

    private LocalDateTime createdAt;

    public TrainingEvaluation() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public Integer getOverallRating() { return overallRating; }
    public void setOverallRating(Integer overallRating) { this.overallRating = overallRating; }

    public Integer getContentRating() { return contentRating; }
    public void setContentRating(Integer contentRating) { this.contentRating = contentRating; }

    public Integer getInstructorRating() { return instructorRating; }
    public void setInstructorRating(Integer instructorRating) { this.instructorRating = instructorRating; }

    public Integer getRelevanceRating() { return relevanceRating; }
    public void setRelevanceRating(Integer relevanceRating) { this.relevanceRating = relevanceRating; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
