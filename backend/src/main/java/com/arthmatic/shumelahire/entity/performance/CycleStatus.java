package com.arthmatic.shumelahire.entity.performance;

public enum CycleStatus {
    PLANNING("Planning"),
    ACTIVE("Active"),
    MID_YEAR("Mid-Year Review"),
    FINAL_REVIEW("Final Review"),
    CLOSED("Closed");
    
    private final String displayName;
    
    CycleStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isActive() {
        return this == ACTIVE || this == MID_YEAR || this == FINAL_REVIEW;
    }
}