package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ReportExportRequest {

    @NotBlank
    private String reportType;

    @NotBlank
    private String format;

    @NotNull
    private String requestedBy;

    private String parameters;

    public ReportExportRequest() {}

    // Getters and Setters
    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getParameters() { return parameters; }
    public void setParameters(String parameters) { this.parameters = parameters; }
}
