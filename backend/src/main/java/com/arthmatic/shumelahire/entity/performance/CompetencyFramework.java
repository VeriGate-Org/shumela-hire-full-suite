package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CompetencyFramework extends TenantAwareEntity {

    private Long id;

    private String name;

    private String description;

    private Boolean isActive = true;

    private List<Competency> competencies = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public List<Competency> getCompetencies() { return competencies; }
    public void setCompetencies(List<Competency> competencies) { this.competencies = competencies; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
