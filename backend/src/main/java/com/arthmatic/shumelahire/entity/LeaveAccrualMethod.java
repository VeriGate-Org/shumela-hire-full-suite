package com.arthmatic.shumelahire.entity;

public enum LeaveAccrualMethod {
    ANNUAL("Annual"),
    MONTHLY("Monthly"),
    BIWEEKLY("Bi-Weekly"),
    ON_HIRE_DATE("On Hire Date");

    private final String displayName;

    LeaveAccrualMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
