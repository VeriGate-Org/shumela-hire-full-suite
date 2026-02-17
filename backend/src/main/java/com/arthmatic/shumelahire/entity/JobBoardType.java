package com.arthmatic.shumelahire.entity;

public enum JobBoardType {
    LINKEDIN("LinkedIn", true),
    INDEED("Indeed", true),
    PNET("PNet", false),
    CAREER_JUNCTION("CareerJunction", false),
    GLASSDOOR("Glassdoor", true),
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
