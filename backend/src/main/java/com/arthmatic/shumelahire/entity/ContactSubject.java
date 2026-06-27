package com.arthmatic.shumelahire.entity;

public enum ContactSubject {
    GENERAL_ENQUIRY("General Enquiry"),
    SALES("Sales"),
    SUPPORT("Support"),
    PARTNERSHIP("Partnership");

    private final String displayName;

    ContactSubject(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
