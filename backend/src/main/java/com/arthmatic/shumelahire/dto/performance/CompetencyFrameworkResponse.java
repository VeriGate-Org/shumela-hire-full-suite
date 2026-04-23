package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.CompetencyFramework;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class CompetencyFrameworkResponse {

    private String id;
    private String name;
    private String description;
    private Boolean isActive;
    private List<CompetencyResponse> competencies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CompetencyFrameworkResponse() {}

    public static CompetencyFrameworkResponse fromEntity(CompetencyFramework entity) {
        CompetencyFrameworkResponse r = new CompetencyFrameworkResponse();
        r.id = entity.getId();
        r.name = entity.getName();
        r.description = entity.getDescription();
        r.isActive = entity.getIsActive();
        if (entity.getCompetencies() != null) {
            r.competencies = entity.getCompetencies().stream()
                    .map(CompetencyResponse::fromEntity)
                    .collect(Collectors.toList());
        }
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
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public List<CompetencyResponse> getCompetencies() { return competencies; }
    public void setCompetencies(List<CompetencyResponse> competencies) { this.competencies = competencies; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
