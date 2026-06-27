package com.arthmatic.shumelahire.entity;

public enum SageSyncDirection {
    INBOUND("Inbound (Sage to ShumelaHire)"),
    OUTBOUND("Outbound (ShumelaHire to Sage)"),
    BIDIRECTIONAL("Bidirectional");

    private final String displayName;

    SageSyncDirection(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
