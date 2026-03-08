package com.arthmatic.shumelahire.dto.compliance;

import com.arthmatic.shumelahire.entity.compliance.ConsentRecord;

import java.time.LocalDateTime;

public class ConsentRecordResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String consentType;
    private String purpose;
    private Boolean isGranted;
    private LocalDateTime grantedAt;
    private LocalDateTime withdrawnAt;
    private String ipAddress;
    private LocalDateTime createdAt;

    public ConsentRecordResponse() {}

    public static ConsentRecordResponse fromEntity(ConsentRecord entity) {
        ConsentRecordResponse r = new ConsentRecordResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.consentType = entity.getConsentType();
        r.purpose = entity.getPurpose();
        r.isGranted = entity.getIsGranted();
        r.grantedAt = entity.getGrantedAt();
        r.withdrawnAt = entity.getWithdrawnAt();
        r.ipAddress = entity.getIpAddress();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getConsentType() { return consentType; }
    public void setConsentType(String consentType) { this.consentType = consentType; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public Boolean getIsGranted() { return isGranted; }
    public void setIsGranted(Boolean isGranted) { this.isGranted = isGranted; }
    public LocalDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(LocalDateTime grantedAt) { this.grantedAt = grantedAt; }
    public LocalDateTime getWithdrawnAt() { return withdrawnAt; }
    public void setWithdrawnAt(LocalDateTime withdrawnAt) { this.withdrawnAt = withdrawnAt; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
