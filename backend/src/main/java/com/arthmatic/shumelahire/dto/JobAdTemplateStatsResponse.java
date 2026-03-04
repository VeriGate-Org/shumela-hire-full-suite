package com.arthmatic.shumelahire.dto;

import java.util.List;

public class JobAdTemplateStatsResponse {

    private long totalTemplates;
    private long activeTemplates;
    private long archivedTemplates;
    private JobAdTemplateResponse mostUsedTemplate;
    private List<JobAdTemplateResponse> recentlyCreated;

    public JobAdTemplateStatsResponse() {}

    // Getters and Setters
    public long getTotalTemplates() { return totalTemplates; }
    public void setTotalTemplates(long totalTemplates) { this.totalTemplates = totalTemplates; }

    public long getActiveTemplates() { return activeTemplates; }
    public void setActiveTemplates(long activeTemplates) { this.activeTemplates = activeTemplates; }

    public long getArchivedTemplates() { return archivedTemplates; }
    public void setArchivedTemplates(long archivedTemplates) { this.archivedTemplates = archivedTemplates; }

    public JobAdTemplateResponse getMostUsedTemplate() { return mostUsedTemplate; }
    public void setMostUsedTemplate(JobAdTemplateResponse mostUsedTemplate) { this.mostUsedTemplate = mostUsedTemplate; }

    public List<JobAdTemplateResponse> getRecentlyCreated() { return recentlyCreated; }
    public void setRecentlyCreated(List<JobAdTemplateResponse> recentlyCreated) { this.recentlyCreated = recentlyCreated; }
}
