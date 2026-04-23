package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Skill;

import java.time.LocalDateTime;

public class SkillResponse {

    private String id;
    private String name;
    private String code;
    private String category;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SkillResponse() {}

    public SkillResponse(Skill skill) {
        this.id = skill.getId();
        this.name = skill.getName();
        this.code = skill.getCode();
        this.category = skill.getCategory();
        this.description = skill.getDescription();
        this.isActive = skill.getIsActive();
        this.createdAt = skill.getCreatedAt();
        this.updatedAt = skill.getUpdatedAt();
    }

    public static SkillResponse fromEntity(Skill skill) {
        return new SkillResponse(skill);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
