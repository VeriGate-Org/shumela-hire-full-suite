package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Department;

import java.time.LocalDateTime;

public class DepartmentResponse {

    private String id;
    private String name;
    private String code;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DepartmentResponse() {}

    public DepartmentResponse(Department department) {
        this.id = department.getId();
        this.name = department.getName();
        this.code = department.getCode();
        this.description = department.getDescription();
        this.isActive = department.getIsActive();
        this.createdAt = department.getCreatedAt();
        this.updatedAt = department.getUpdatedAt();
    }

    public static DepartmentResponse fromEntity(Department department) {
        return new DepartmentResponse(department);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
