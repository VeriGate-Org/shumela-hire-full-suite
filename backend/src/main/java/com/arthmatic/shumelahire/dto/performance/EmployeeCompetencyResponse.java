package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.EmployeeCompetency;

import java.time.LocalDateTime;

public class EmployeeCompetencyResponse {

    private String id;
    private String employeeId;
    private String employeeName;
    private String competencyId;
    private String competencyName;
    private String category;
    private Integer currentLevel;
    private Integer targetLevel;
    private LocalDateTime assessedAt;
    private String assessorId;
    private String assessorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmployeeCompetencyResponse() {}

    public static EmployeeCompetencyResponse fromEntity(EmployeeCompetency entity) {
        EmployeeCompetencyResponse r = new EmployeeCompetencyResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.competencyId = entity.getCompetency() != null ? entity.getCompetency().getId() : null;
        r.competencyName = entity.getCompetency() != null ? entity.getCompetency().getName() : null;
        r.category = entity.getCompetency() != null ? entity.getCompetency().getCategory() : null;
        r.currentLevel = entity.getCurrentLevel();
        r.targetLevel = entity.getTargetLevel();
        r.assessedAt = entity.getAssessedAt();
        r.assessorId = entity.getAssessor() != null ? entity.getAssessor().getId() : null;
        r.assessorName = entity.getAssessor() != null ?
                entity.getAssessor().getFirstName() + " " + entity.getAssessor().getLastName() : null;
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getCompetencyId() { return competencyId; }
    public void setCompetencyId(String competencyId) { this.competencyId = competencyId; }
    public String getCompetencyName() { return competencyName; }
    public void setCompetencyName(String competencyName) { this.competencyName = competencyName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(Integer currentLevel) { this.currentLevel = currentLevel; }
    public Integer getTargetLevel() { return targetLevel; }
    public void setTargetLevel(Integer targetLevel) { this.targetLevel = targetLevel; }
    public LocalDateTime getAssessedAt() { return assessedAt; }
    public void setAssessedAt(LocalDateTime assessedAt) { this.assessedAt = assessedAt; }
    public String getAssessorId() { return assessorId; }
    public void setAssessorId(String assessorId) { this.assessorId = assessorId; }
    public String getAssessorName() { return assessorName; }
    public void setAssessorName(String assessorName) { this.assessorName = assessorName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
