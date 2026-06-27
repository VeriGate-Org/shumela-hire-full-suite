package com.arthmatic.shumelahire.entity;

public enum SageSyncFrequency {
    EVERY_15_MINUTES("Every 15 Minutes", "0 */15 * * * *"),
    EVERY_30_MINUTES("Every 30 Minutes", "0 */30 * * * *"),
    HOURLY("Hourly", "0 0 * * * *"),
    EVERY_6_HOURS("Every 6 Hours", "0 0 */6 * * *"),
    DAILY("Daily (midnight)", "0 0 0 * * *"),
    WEEKLY("Weekly (Sunday midnight)", "0 0 0 * * SUN"),
    MONTHLY("Monthly (1st at midnight)", "0 0 0 1 * *"),
    CUSTOM("Custom Cron Expression", "");

    private final String displayName;
    private final String cronExpression;

    SageSyncFrequency(String displayName, String cronExpression) {
        this.displayName = displayName;
        this.cronExpression = cronExpression;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCronExpression() {
        return cronExpression;
    }
}
