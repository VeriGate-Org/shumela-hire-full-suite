package com.arthmatic.shumelahire.entity;

public enum EmployeeStatus {
    ACTIVE("Active"),
    PROBATION("Probation"),
    SUSPENDED("Suspended"),
    TERMINATED("Terminated"),
    RESIGNED("Resigned"),
    RETIRED("Retired");

    private final String displayName;

    EmployeeStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
