package com.arthmatic.shumelahire.entity;

public enum SalaryCurrency {
    ZAR("ZAR", "South African Rand"),
    USD("USD", "US Dollar"),
    EUR("EUR", "Euro"),
    GBP("GBP", "British Pound");

    private final String code;
    private final String displayName;

    SalaryCurrency(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }
}
