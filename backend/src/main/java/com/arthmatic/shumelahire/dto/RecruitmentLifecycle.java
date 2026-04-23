package com.arthmatic.shumelahire.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Full recruitment lifecycle for an application — aggregates events
 * from Requisition, JobAd, Application, Interview, Offer,
 * SalaryRecommendation, PipelineTransition, and AuditLog entities.
 */
public class RecruitmentLifecycle {

    private String applicationId;
    private String applicantName;
    private String jobTitle;
    private String department;
    private String currentStage;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long totalDurationHours;

    private List<LifecycleEvent> timeline;

    // Summary counts per entity type
    private Map<String, Integer> eventCounts;

    // Quick stats
    private int totalEvents;
    private int interviewCount;
    private int offerCount;
    private int stageTransitionCount;

    public RecruitmentLifecycle() {}

    // Getters and Setters
    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public Long getTotalDurationHours() { return totalDurationHours; }
    public void setTotalDurationHours(Long totalDurationHours) { this.totalDurationHours = totalDurationHours; }

    public List<LifecycleEvent> getTimeline() { return timeline; }
    public void setTimeline(List<LifecycleEvent> timeline) { this.timeline = timeline; }

    public Map<String, Integer> getEventCounts() { return eventCounts; }
    public void setEventCounts(Map<String, Integer> eventCounts) { this.eventCounts = eventCounts; }

    public int getTotalEvents() { return totalEvents; }
    public void setTotalEvents(int totalEvents) { this.totalEvents = totalEvents; }

    public int getInterviewCount() { return interviewCount; }
    public void setInterviewCount(int interviewCount) { this.interviewCount = interviewCount; }

    public int getOfferCount() { return offerCount; }
    public void setOfferCount(int offerCount) { this.offerCount = offerCount; }

    public int getStageTransitionCount() { return stageTransitionCount; }
    public void setStageTransitionCount(int stageTransitionCount) { this.stageTransitionCount = stageTransitionCount; }
}
