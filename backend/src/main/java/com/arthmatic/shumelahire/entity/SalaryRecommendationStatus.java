package com.arthmatic.shumelahire.entity;

public enum SalaryRecommendationStatus {
    DRAFT("Draft"),
    PENDING_REVIEW("Pending Review"),
    RECOMMENDED("Recommended"),
    PENDING_APPROVAL("Pending Approval"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    RETURNED("Returned"),
    IMPLEMENTED("Implemented");

    private final String displayName;

    SalaryRecommendationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
