package com.arthmatic.shumelahire.dto.training;

import com.arthmatic.shumelahire.entity.training.Certification;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class CertificationResponse {

    private String id;
    private String employeeId;
    private String employeeName;
    private String name;
    private String issuingBody;
    private String certificationNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String status;
    private String documentUrl;
    private boolean expired;
    private boolean expiringSoon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CertificationResponse() {}

    public static CertificationResponse fromEntity(Certification entity) {
        CertificationResponse r = new CertificationResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ? entity.getEmployee().getFullName() : null;
        r.name = entity.getName();
        r.issuingBody = entity.getIssuingBody();
        r.certificationNumber = entity.getCertificationNumber();
        r.issueDate = entity.getIssueDate();
        r.expiryDate = entity.getExpiryDate();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.documentUrl = entity.getDocumentUrl();
        r.expired = entity.isExpired();
        r.expiringSoon = entity.isExpiringSoon(30);
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIssuingBody() { return issuingBody; }
    public void setIssuingBody(String issuingBody) { this.issuingBody = issuingBody; }

    public String getCertificationNumber() { return certificationNumber; }
    public void setCertificationNumber(String certificationNumber) { this.certificationNumber = certificationNumber; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public boolean isExpiringSoon() { return expiringSoon; }
    public void setExpiringSoon(boolean expiringSoon) { this.expiringSoon = expiringSoon; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
