package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;

import java.time.LocalDateTime;

public class DocumentResponse {
    
    private String id;
    private String applicantId;
    private String applicationId;
    private DocumentType type;
    private String filename;
    private String url;
    private Long fileSize;
    private String contentType;
    private LocalDateTime uploadedAt;
    private String fileSizeFormatted;
    
    // Constructors
    public DocumentResponse() {}
    
    public DocumentResponse(Document document) {
        this.id = document.getId();
        this.applicantId = document.getApplicant().getId();
        this.applicationId = document.getApplicationId();
        this.type = document.getType();
        this.filename = document.getFilename();
        this.url = document.getUrl();
        this.fileSize = document.getFileSize();
        this.contentType = document.getContentType();
        this.uploadedAt = document.getUploadedAt();
        this.fileSizeFormatted = document.getFileSizeFormatted();
    }
    
    // Static factory method
    public static DocumentResponse fromEntity(Document document) {
        return new DocumentResponse(document);
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getApplicantId() {
        return applicantId;
    }
    
    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
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
    
    public String getFileSizeFormatted() {
        return fileSizeFormatted;
    }
    
    public void setFileSizeFormatted(String fileSizeFormatted) {
        this.fileSizeFormatted = fileSizeFormatted;
    }
}