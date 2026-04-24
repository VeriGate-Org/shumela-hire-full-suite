package com.arthmatic.shumelahire.entity;

public enum CompanyDocumentCategory {
    POLICY("Policy"),
    HANDBOOK("Handbook"),
    PROCEDURE("Procedure"),
    FORM("Form"),
    TEMPLATE("Template"),
    ANNOUNCEMENT("Announcement");

    private final String displayName;

    CompanyDocumentCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
