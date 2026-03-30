package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ReviewEvidence extends TenantAwareEntity {
    
    private Long id;
    
    @NotNull(message = "Performance review is required")
    private PerformanceReview review;
    
    private String fileName;
    
    private String filePath;
    
    private Long fileSize;
    
    private String contentType;
    
    private String description;
    
    private EvidenceType evidenceType;
    
    private String uploadedBy;
    
    private LocalDateTime uploadedAt;
    
    // Constructors
    public ReviewEvidence() {
        this.uploadedAt = LocalDateTime.now();
    }
    
    public ReviewEvidence(PerformanceReview review, String fileName, String filePath, String uploadedBy) {
        this();
        this.review = review;
        this.fileName = fileName;
        this.filePath = filePath;
        this.uploadedBy = uploadedBy;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public PerformanceReview getReview() { return review; }
    public void setReview(PerformanceReview review) { this.review = review; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public EvidenceType getEvidenceType() { return evidenceType; }
    public void setEvidenceType(EvidenceType evidenceType) { this.evidenceType = evidenceType; }
    
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}