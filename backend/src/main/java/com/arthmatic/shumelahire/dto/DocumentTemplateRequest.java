package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotBlank;

public class DocumentTemplateRequest {

    public static class Create {
        @NotBlank(message = "Template type is required")
        private String type;

        @NotBlank(message = "Template name is required")
        private String name;

        private String subject;

        @NotBlank(message = "Template content is required")
        private String content;

        private String placeholders;
        private Boolean isDefault = false;

        @NotBlank(message = "Created by is required")
        private String createdBy;

        // Getters and Setters
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

        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    }

    public static class Update {
        private String type;
        private String name;
        private String subject;
        private String content;
        private String placeholders;
        private Boolean isDefault;
        private Boolean isArchived;

        // Getters and Setters
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
    }
}
