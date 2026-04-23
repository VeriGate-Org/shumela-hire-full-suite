package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotNull;

public class LinkedInPostRequest {

    @NotNull
    private String jobPostingId;

    private String customText;

    public String getJobPostingId() {
        return jobPostingId;
    }

    public void setJobPostingId(String jobPostingId) {
        this.jobPostingId = jobPostingId;
    }

    public String getCustomText() {
        return customText;
    }

    public void setCustomText(String customText) {
        this.customText = customText;
    }
}
