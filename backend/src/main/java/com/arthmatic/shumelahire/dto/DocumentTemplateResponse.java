package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.DocumentTemplate;

import java.time.LocalDateTime;

public class DocumentTemplateResponse {

    private String id;
    private String type;
    private String name;
    private String subject;
    private String content;
    private String placeholders;
    private Boolean isDefault;
    private Boolean isArchived;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DocumentTemplateResponse() {}

    public static DocumentTemplateResponse fromEntity(DocumentTemplate entity) {
        DocumentTemplateResponse dto = new DocumentTemplateResponse();
        dto.id = entity.getId();
        dto.type = entity.getType();
        dto.name = entity.getName();
        dto.subject = entity.getSubject();
        dto.content = entity.getContent();
        dto.placeholders = entity.getPlaceholders();
        dto.isDefault = entity.getIsDefault();
        dto.isArchived = entity.getIsArchived();
        dto.createdBy = entity.getCreatedBy();
        dto.createdAt = entity.getCreatedAt();
        dto.updatedAt = entity.getUpdatedAt();
        return dto;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPlaceholders() { return placeholders; }
    public void setPlaceholders(String placeholders) { this.placeholders = placeholders; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
