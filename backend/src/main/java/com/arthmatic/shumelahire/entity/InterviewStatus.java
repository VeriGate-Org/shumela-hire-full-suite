package com.arthmatic.shumelahire.entity;

public enum InterviewStatus {
    SCHEDULED("Scheduled"),
    RESCHEDULED("Rescheduled"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled"),
    NO_SHOW("No Show"),
    POSTPONED("Postponed");

    private final String displayName;

    InterviewStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isActive() {
        return this == SCHEDULED || this == RESCHEDULED || this == IN_PROGRESS;
    }

    public boolean isCompleted() {
        return this == COMPLETED;
    }

    public boolean canBeRescheduled() {
        return this == SCHEDULED || this == POSTPONED;
    }

    public boolean canBeCancelled() {
        return this == SCHEDULED || this == RESCHEDULED || this == POSTPONED;
    }

    public boolean canBePostponed() {
        return this == SCHEDULED || this == RESCHEDULED;
    }

    public boolean canBeStarted() {
        return this == SCHEDULED;
    }

    public boolean canBeCompleted() {
        return this == IN_PROGRESS;
    }

    public boolean requiresFeedback() {
        return this == COMPLETED;
    }
}