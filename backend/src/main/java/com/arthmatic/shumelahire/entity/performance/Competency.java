package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class Competency extends TenantAwareEntity {

    private Long id;

    private CompetencyFramework framework;

    private String name;

    private String description;

    private String category;

    private String proficiencyLevels;

    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CompetencyFramework getFramework() { return framework; }
    public void setFramework(CompetencyFramework framework) { this.framework = framework; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getProficiencyLevels() { return proficiencyLevels; }
    public void setProficiencyLevels(String proficiencyLevels) { this.proficiencyLevels = proficiencyLevels; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
