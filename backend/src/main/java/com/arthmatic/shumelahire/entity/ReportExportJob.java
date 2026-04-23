package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class ReportExportJob extends TenantAwareEntity {

    private String id;

    @NotBlank
    private String reportType;

    private ExportFormat format = ExportFormat.PDF;

    private ExportStatus status = ExportStatus.QUEUED;

    private String fileUrl;

    private Long fileSize;

    private String parameters;

    private Employee requestedBy;

    private String errorMessage;

    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public ExportFormat getFormat() { return format; }
    public void setFormat(ExportFormat format) { this.format = format; }

    public ExportStatus getStatus() { return status; }
    public void setStatus(ExportStatus status) { this.status = status; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getParameters() { return parameters; }
    public void setParameters(String parameters) { this.parameters = parameters; }

    public Employee getRequestedBy() { return requestedBy; }
    public void setRequestedBy(Employee requestedBy) { this.requestedBy = requestedBy; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
