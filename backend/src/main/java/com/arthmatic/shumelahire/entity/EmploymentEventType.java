package com.arthmatic.shumelahire.entity;

public enum EmploymentEventType {
    HIRE("Hire"),
    PROMOTION("Promotion"),
    TRANSFER("Transfer"),
    DEMOTION("Demotion"),
    SUSPENSION("Suspension"),
    REINSTATEMENT("Reinstatement"),
    RESIGNATION("Resignation"),
    DISMISSAL("Dismissal"),
    RETIREMENT("Retirement"),
    CONTRACT_END("Contract End");

    private final String displayName;

    EmploymentEventType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
