package com.arthmatic.shumelahire.entity;

public enum JobBoardType {
    LINKEDIN("LinkedIn", true),
    INDEED("Indeed", true),
    PNET("PNet", true),
    CAREER_JUNCTION("CareerJunction", true),
    CUSTOM("Custom", false);

    private final String displayName;
    private final boolean requiresApiIntegration;

    JobBoardType(String displayName, boolean requiresApiIntegration) {
        this.displayName = displayName;
        this.requiresApiIntegration = requiresApiIntegration;
    }

    public String getDisplayName() { return displayName; }
    public boolean isRequiresApiIntegration() { return requiresApiIntegration; }
}
