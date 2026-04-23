package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Document extends TenantAwareEntity {
    
    private String id;
    
    @NotNull(message = "Applicant is required")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Applicant applicant;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "applicationDocuments"})
    private Application application; // Optional - links to specific application
    
    private String applicationId; // For convenience and backwards compatibility
    
    private DocumentType type;
    
    @NotBlank(message = "Filename is required")
    private String filename;
    
    @NotBlank(message = "File URL is required")
    private String url;
    
    private Long fileSize; // Size in bytes
    
    private String contentType; // MIME type
    
    private LocalDateTime uploadedAt;
    
    // Constructors
    public Document() {}
    
    public Document(Applicant applicant, DocumentType type, String filename, String url) {
        this.applicant = applicant;
        this.type = type;
        this.filename = filename;
        this.url = url;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public Applicant getApplicant() {
        return applicant;
    }
    
    public void setApplicant(Applicant applicant) {
        this.applicant = applicant;
    }
    
    public Application getApplication() {
        return application;
    }
    
    public void setApplication(Application application) {
        this.application = application;
    }
    
    public String getApplicationId() {
        return applicationId;
    }
    
    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }
    
    public DocumentType getType() {
        return type;
    }
    
    public void setType(DocumentType type) {
        this.type = type;
    }
    
    public String getFilename() {
        return filename;
    }
    
    public void setFilename(String filename) {
        this.filename = filename;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
    
    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
    
    // Helper methods
    public String getFileSizeFormatted() {
        if (fileSize == null) return "Unknown";
        
        if (fileSize < 1024) return fileSize + " B";
        if (fileSize < 1024 * 1024) return String.format("%.1f KB", fileSize / 1024.0);
        return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
    }
    
    public boolean isCv() {
        return type == DocumentType.CV;
    }
    
    public boolean isSupporting() {
        return type == DocumentType.SUPPORT;
    }
    
    @Override
    public String toString() {
        return "Document{" +
                "id=" + id +
                ", type=" + type +
                ", filename='" + filename + '\'' +
                ", fileSize=" + fileSize +
                '}';
    }
}