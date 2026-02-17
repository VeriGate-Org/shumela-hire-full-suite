package com.arthmatic.shumelahire.entity.performance;

public enum ContractStatus {
    DRAFT("Draft"),
    SUBMITTED("Submitted for Approval"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    ACTIVE("Active");
    
    private final String displayName;
    
    ContractStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isEditable() {
        return this == DRAFT || this == REJECTED;
    }
    
    public boolean isActive() {
        return this == APPROVED || this == ACTIVE;
    }
}