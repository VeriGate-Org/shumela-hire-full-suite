package com.arthmatic.shumelahire.entity;

import java.time.LocalDateTime;

public class SapPayrollTransmission extends TenantAwareEntity {

    private Long id;

    private Offer offer;

    private String transmissionId;

    private String sapEmployeeNumber;

    private TransmissionStatus status = TransmissionStatus.PENDING;

    private String payloadJson;

    private String responseJson;

    private String errorMessage;

    private Integer retryCount = 0;

    private Integer maxRetries = 3;

    private LocalDateTime nextRetryAt;

    private Long initiatedBy;

    private String sapCompanyCode;

    private String sapPayrollArea;

    private String validationErrors;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime transmittedAt;

    private LocalDateTime confirmedAt;

    private LocalDateTime cancelledAt;

    private Long cancelledBy;

    private String cancellationReason;

    // Constructors
    public SapPayrollTransmission() {
        this.createdAt = LocalDateTime.now();
    }

    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean canBeRetried() {
        return status.isRetryable() && retryCount < maxRetries;
    }

    public boolean canBeCancelled() {
        return status.canBeCancelled();
    }

    public boolean isComplete() {
        return status == TransmissionStatus.CONFIRMED;
    }

    public boolean hasFailed() {
        return status == TransmissionStatus.FAILED;
    }

    public void incrementRetryCount() {
        this.retryCount++;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Offer getOffer() { return offer; }
    public void setOffer(Offer offer) { this.offer = offer; }

    public String getTransmissionId() { return transmissionId; }
    public void setTransmissionId(String transmissionId) { this.transmissionId = transmissionId; }

    public String getSapEmployeeNumber() { return sapEmployeeNumber; }
    public void setSapEmployeeNumber(String sapEmployeeNumber) { this.sapEmployeeNumber = sapEmployeeNumber; }

    public TransmissionStatus getStatus() { return status; }
    public void setStatus(TransmissionStatus status) { this.status = status; }

    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }

    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }

    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }

    public LocalDateTime getNextRetryAt() { return nextRetryAt; }
    public void setNextRetryAt(LocalDateTime nextRetryAt) { this.nextRetryAt = nextRetryAt; }

    public Long getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(Long initiatedBy) { this.initiatedBy = initiatedBy; }

    public String getSapCompanyCode() { return sapCompanyCode; }
    public void setSapCompanyCode(String sapCompanyCode) { this.sapCompanyCode = sapCompanyCode; }

    public String getSapPayrollArea() { return sapPayrollArea; }
    public void setSapPayrollArea(String sapPayrollArea) { this.sapPayrollArea = sapPayrollArea; }

    public String getValidationErrors() { return validationErrors; }
    public void setValidationErrors(String validationErrors) { this.validationErrors = validationErrors; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getTransmittedAt() { return transmittedAt; }
    public void setTransmittedAt(LocalDateTime transmittedAt) { this.transmittedAt = transmittedAt; }

    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public Long getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(Long cancelledBy) { this.cancelledBy = cancelledBy; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
}
