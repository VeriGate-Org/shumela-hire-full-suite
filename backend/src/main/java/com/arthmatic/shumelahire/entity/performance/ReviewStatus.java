package com.arthmatic.shumelahire.entity.performance;

public enum ReviewStatus {
    PENDING("Pending"),
    EMPLOYEE_SUBMITTED("Employee Self-Assessment Submitted"),
    MANAGER_SUBMITTED("Manager Assessment Submitted"),
    COMPLETED("Completed");
    
    private final String displayName;
    
    ReviewStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isCompleted() {
        return this == COMPLETED;
    }
}