package com.arthmatic.shumelahire.entity;

public enum ApplicationSource {
    EXTERNAL("Job Board / Website", "BOTH"),
    INTERNAL("Internal Posting", "BOTH"),
    REFERRAL("Employee Referral", "BOTH"),
    RECRUITER("Recruiter Contact", "BOTH"),
    SOCIAL_MEDIA("Social Media", "BOTH"),
    LINKEDIN("LinkedIn", "REPORT"),
    INDEED("Indeed", "REPORT"),
    PNET("PNet", "REPORT"),
    CAREER_JUNCTION("CareerJunction", "REPORT"),
    CAREER_FAIR("Career Fair", "REPORT"),
    COMPANY_WEBSITE("Company Website", "REPORT"),
    DIRECT_APPLICATION("Direct Application", "REPORT"),
    OTHER("Other", "FORM");

    private final String displayName;
    private final String category;

    ApplicationSource(String displayName, String category) {
        this.displayName = displayName;
        this.category = category;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCategory() {
        return category;
    }
}
