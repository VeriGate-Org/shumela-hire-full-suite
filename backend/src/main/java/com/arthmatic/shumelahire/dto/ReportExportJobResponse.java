package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.ReportExportJob;

import java.time.LocalDateTime;

public class ReportExportJobResponse {

    private String id;
    private String reportType;
    private String format;
    private String status;
    private String fileUrl;
    private Long fileSize;
    private String parameters;
    private String requestedById;
    private String requestedByName;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public ReportExportJobResponse() {}

    public static ReportExportJobResponse fromEntity(ReportExportJob entity) {
        ReportExportJobResponse r = new ReportExportJobResponse();
        r.id = entity.getId();
        r.reportType = entity.getReportType();
        r.format = entity.getFormat() != null ? entity.getFormat().name() : null;
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.fileUrl = entity.getFileUrl();
        r.fileSize = entity.getFileSize();
        r.parameters = entity.getParameters();
        r.requestedById = entity.getRequestedBy() != null ? entity.getRequestedBy().getId() : null;
        r.requestedByName = entity.getRequestedBy() != null ? entity.getRequestedBy().getFullName() : null;
        r.errorMessage = entity.getErrorMessage();
        r.createdAt = entity.getCreatedAt();
        r.completedAt = entity.getCompletedAt();
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getParameters() { return parameters; }
    public void setParameters(String parameters) { this.parameters = parameters; }

    public String getRequestedById() { return requestedById; }
    public void setRequestedById(String requestedById) { this.requestedById = requestedById; }

    public String getRequestedByName() { return requestedByName; }
    public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
