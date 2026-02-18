package com.arthmatic.shumelahire.entity;

public enum NotificationChannel {
    IN_APP("In-App", "In-application notification"),
    EMAIL("Email", "Email notification"),
    PUSH("Push", "Push notification"),
    MS_TEAMS("MS Teams", "Microsoft Teams notification"),
    WEBHOOK("Webhook", "Webhook notification"),
    BROWSER("Browser", "Browser notification");

    private final String displayName;
    private final String description;

    NotificationChannel(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean requiresExternalService() {
        return this == EMAIL || this == MS_TEAMS || this == WEBHOOK;
    }

    public boolean isRealTime() {
        return this == IN_APP || this == PUSH || this == BROWSER;
    }

    public boolean supportsRichContent() {
        return this == IN_APP || this == EMAIL || this == MS_TEAMS;
    }

    public boolean requiresDeviceToken() {
        return this == PUSH;
    }

    public boolean requiresEmailAddress() {
        return this == EMAIL;
    }

    public int getDeliveryPriority() {
        return switch (this) {
            case IN_APP -> 1;
            case PUSH -> 2;
            case EMAIL -> 3;
            case MS_TEAMS -> 4;
            case WEBHOOK -> 5;
            case BROWSER -> 6;
        };
    }
}
