package com.arthmatic.shumelahire.entity;

public enum SageEntityType {
    EMPLOYEE("Employee"),
    DEPARTMENT("Department"),
    POSITION("Position"),
    SALARY("Salary"),
    LEAVE("Leave"),
    COST_CENTRE("Cost Centre"),
    TAX("Tax"),
    BENEFITS("Benefits");

    private final String displayName;

    SageEntityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
