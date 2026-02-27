package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeDocumentResponse {

    private Long id;
    private Long employeeId;
    private EmployeeDocumentType documentType;
    private String title;
    private String description;
    private String filename;
    private String fileUrl;
    private Long fileSize;
    private String contentType;
    private Integer version;
    private LocalDate expiryDate;
    private Boolean isActive;
    private Boolean isExpired;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmployeeDocumentResponse() {}

    public static EmployeeDocumentResponse fromEntity(EmployeeDocument doc) {
        EmployeeDocumentResponse response = new EmployeeDocumentResponse();
        response.setId(doc.getId());
        response.setEmployeeId(doc.getEmployee().getId());
        response.setDocumentType(doc.getDocumentType());
        response.setTitle(doc.getTitle());
        response.setDescription(doc.getDescription());
        response.setFilename(doc.getFilename());
        response.setFileUrl(doc.getFileUrl());
        response.setFileSize(doc.getFileSize());
        response.setContentType(doc.getContentType());
        response.setVersion(doc.getVersion());
        response.setExpiryDate(doc.getExpiryDate());
        response.setIsActive(doc.getIsActive());
        response.setIsExpired(doc.isExpired());
        response.setUploadedBy(doc.getUploadedBy());
        response.setCreatedAt(doc.getCreatedAt());
        response.setUpdatedAt(doc.getUpdatedAt());
        return response;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public EmployeeDocumentType getDocumentType() { return documentType; }
    public void setDocumentType(EmployeeDocumentType documentType) { this.documentType = documentType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsExpired() { return isExpired; }
    public void setIsExpired(Boolean isExpired) { this.isExpired = isExpired; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
