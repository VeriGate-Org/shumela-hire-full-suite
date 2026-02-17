package com.arthmatic.shumelahire.entity;

public enum PostingStatus {
    DRAFT("Draft"),
    PENDING("Pending"),
    POSTED("Posted"),
    EXPIRED("Expired"),
    FAILED("Failed"),
    REMOVED("Removed");

    private final String displayName;

    PostingStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() { return displayName; }
}
