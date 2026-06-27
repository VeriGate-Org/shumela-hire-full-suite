package com.arthmatic.shumelahire.entity;

public enum PositionLevel {
    JUNIOR("Junior"),
    MID("Mid"),
    SENIOR("Senior"),
    LEAD("Lead"),
    PRINCIPAL("Principal"),
    DIRECTOR("Director"),
    VP("VP"),
    C_SUITE("C-Suite");

    private final String displayName;

    PositionLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
