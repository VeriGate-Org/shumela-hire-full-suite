package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.Competency;

import java.time.LocalDateTime;

public class CompetencyResponse {

    private Long id;
    private Long frameworkId;
    private String name;
    private String description;
    private String category;
    private String proficiencyLevels;
    private LocalDateTime createdAt;

    public CompetencyResponse() {}

    public static CompetencyResponse fromEntity(Competency entity) {
        CompetencyResponse r = new CompetencyResponse();
        r.id = entity.getId();
        r.frameworkId = entity.getFramework() != null ? entity.getFramework().getId() : null;
        r.name = entity.getName();
        r.description = entity.getDescription();
        r.category = entity.getCategory();
        r.proficiencyLevels = entity.getProficiencyLevels();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFrameworkId() { return frameworkId; }
    public void setFrameworkId(Long frameworkId) { this.frameworkId = frameworkId; }
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
