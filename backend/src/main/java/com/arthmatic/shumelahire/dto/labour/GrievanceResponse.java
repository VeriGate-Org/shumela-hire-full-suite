package com.arthmatic.shumelahire.dto.labour;

import com.arthmatic.shumelahire.entity.labour.Grievance;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class GrievanceResponse {

    private String id;
    private String employeeId;
    private String employeeName;
    private String grievanceType;
    private String description;
    private String status;
    private String resolution;
    private LocalDate filedDate;
    private LocalDate resolvedDate;
    private String assignedToId;
    private String assignedToName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GrievanceResponse() {}

    public static GrievanceResponse fromEntity(Grievance entity) {
        GrievanceResponse r = new GrievanceResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.grievanceType = entity.getGrievanceType() != null ? entity.getGrievanceType().name() : null;
        r.description = entity.getDescription();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.resolution = entity.getResolution();
        r.filedDate = entity.getFiledDate();
        r.resolvedDate = entity.getResolvedDate();
        r.assignedToId = entity.getAssignedTo() != null ? entity.getAssignedTo().getId() : null;
        r.assignedToName = entity.getAssignedTo() != null ?
                entity.getAssignedTo().getFirstName() + " " + entity.getAssignedTo().getLastName() : null;
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
    public String getGrievanceType() { return grievanceType; }
    public void setGrievanceType(String grievanceType) { this.grievanceType = grievanceType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public LocalDate getFiledDate() { return filedDate; }
    public void setFiledDate(LocalDate filedDate) { this.filedDate = filedDate; }
    public LocalDate getResolvedDate() { return resolvedDate; }
    public void setResolvedDate(LocalDate resolvedDate) { this.resolvedDate = resolvedDate; }
    public String getAssignedToId() { return assignedToId; }
    public void setAssignedToId(String assignedToId) { this.assignedToId = assignedToId; }
    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
