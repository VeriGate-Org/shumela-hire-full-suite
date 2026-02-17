package com.arthmatic.shumelahire.entity.performance;

public enum ReviewType {
    MID_YEAR("Mid-Year Review"),
    FINAL("Final Review");
    
    private final String displayName;
    
    ReviewType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}