package com.arthmatic.shumelahire.entity;

import java.time.LocalDateTime;

public class CompanyDocumentAcknowledgement extends TenantAwareEntity {

    private String id;
    private String documentId;
    private String employeeId;
    private LocalDateTime acknowledgedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
}
