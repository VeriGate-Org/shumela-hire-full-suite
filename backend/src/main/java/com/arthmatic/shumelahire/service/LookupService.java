package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class LookupService {

    @Cacheable("lookups")
    public Map<String, Object> getAllLookups() {
        Map<String, Object> lookups = new LinkedHashMap<>();

        lookups.put("employmentTypes", buildEmploymentTypes());
        lookups.put("experienceLevels", buildExperienceLevels());
        lookups.put("interviewTypes", buildInterviewTypes());
        lookups.put("interviewRounds", buildInterviewRounds());
        lookups.put("applicationStatuses", buildApplicationStatuses());
        lookups.put("positionLevels", buildPositionLevels());
        lookups.put("applicationSources", buildApplicationSources());
        lookups.put("salaryCurrencies", buildSalaryCurrencies());
        lookups.put("leaveAccrualMethods", buildLeaveAccrualMethods());
        lookups.put("sageEntityTypes", buildSageEntityTypes());
        lookups.put("sageSyncDirections", buildSageSyncDirections());
        lookups.put("sageSyncFrequencies", buildSageSyncFrequencies());
        lookups.put("contactSubjects", buildContactSubjects());
        lookups.put("workflowTriggers", buildWorkflowTriggers());
        lookups.put("workflowActionTypes", buildWorkflowActionTypes());

        return lookups;
    }

    public Object getLookupByCategory(String category) {
        Map<String, Object> all = getAllLookups();
        return all.get(category);
    }

    private List<Map<String, Object>> buildEmploymentTypes() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (EmploymentType e : EmploymentType.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("description", e.getDescription());
            item.put("cssClass", e.getCssClass());
            item.put("icon", e.getIcon());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildExperienceLevels() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (ExperienceLevel e : ExperienceLevel.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("description", e.getDescription());
            item.put("minYears", e.getMinYears());
            item.put("maxYears", e.getMaxYears());
            item.put("cssClass", e.getCssClass());
            item.put("icon", e.getIcon());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildInterviewTypes() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (InterviewType e : InterviewType.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("isRemote", e.isRemote());
            item.put("requiresLocation", e.requiresLocation());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildInterviewRounds() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (InterviewRound e : InterviewRound.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("order", e.getOrder());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildApplicationStatuses() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (ApplicationStatus e : ApplicationStatus.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("description", e.getDescription());
            item.put("cssClass", e.getCssClass());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildPositionLevels() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (PositionLevel e : PositionLevel.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildApplicationSources() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (ApplicationSource e : ApplicationSource.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("category", e.getCategory());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildSalaryCurrencies() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (SalaryCurrency e : SalaryCurrency.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getCode() + " (" + e.getDisplayName() + ")");
            item.put("code", e.getCode());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildLeaveAccrualMethods() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (LeaveAccrualMethod e : LeaveAccrualMethod.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildSageEntityTypes() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (SageEntityType e : SageEntityType.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildSageSyncDirections() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (SageSyncDirection e : SageSyncDirection.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildSageSyncFrequencies() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (SageSyncFrequency e : SageSyncFrequency.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            item.put("cronExpression", e.getCronExpression());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildContactSubjects() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (ContactSubject e : ContactSubject.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", e.name());
            item.put("label", e.getDisplayName());
            list.add(item);
        }
        return list;
    }

    private List<Map<String, Object>> buildWorkflowTriggers() {
        List<Map<String, Object>> list = new ArrayList<>();

        list.add(buildWorkflowTrigger("app_received", "application_received", "Application Received", "Triggered when a new job application is submitted"));
        list.add(buildWorkflowTrigger("interview_scheduled", "interview_scheduled", "Interview Scheduled", "Triggered when an interview is scheduled with a candidate"));
        list.add(buildWorkflowTrigger("interview_completed", "interview_completed", "Interview Completed", "Triggered when an interview is marked as completed"));
        list.add(buildWorkflowTrigger("offer_extended", "offer_extended", "Offer Extended", "Triggered when a job offer is extended to a candidate"));
        list.add(buildWorkflowTrigger("offer_accepted", "offer_accepted", "Offer Accepted", "Triggered when a candidate accepts a job offer"));
        list.add(buildWorkflowTrigger("manual", "manual", "Manual Trigger", "Manually triggered by a user when needed"));

        return list;
    }

    private Map<String, Object> buildWorkflowTrigger(String id, String type, String name, String description) {
        Map<String, Object> trigger = new LinkedHashMap<>();
        trigger.put("id", id);
        trigger.put("type", type);
        trigger.put("name", name);
        trigger.put("description", description);
        return trigger;
    }

    private List<Map<String, Object>> buildWorkflowActionTypes() {
        List<Map<String, Object>> list = new ArrayList<>();

        list.add(buildActionType("send_email", "Send Email", "Send automated email to specified recipients", "\uD83D\uDCE7",
                Map.of("recipients", buildConfigField("array", "Recipients", true),
                       "subject", buildConfigField("string", "Subject", true),
                       "template", buildConfigField("select", "Email Template", true))));

        list.add(buildActionType("create_task", "Create Task", "Create a task for team members", "\u2705",
                Map.of("assignee", buildConfigField("select", "Assignee", true),
                       "title", buildConfigField("string", "Task Title", true),
                       "description", buildConfigField("text", "Description", false),
                       "dueDate", buildConfigField("number", "Due in (days)", false))));

        list.add(buildActionType("update_status", "Update Status", "Update application or candidate status", "\uD83D\uDD04",
                Map.of("entity", buildConfigField("select", "Entity Type", true),
                       "status", buildConfigField("select", "New Status", true))));

        list.add(buildActionType("schedule_interview", "Schedule Interview", "Automatically schedule interview with candidate", "\uD83D\uDCC5",
                Map.of("interviewer", buildConfigField("select", "Interviewer", true),
                       "duration", buildConfigField("number", "Duration (minutes)", true),
                       "type", buildConfigField("select", "Interview Type", true))));

        list.add(buildActionType("generate_report", "Generate Report", "Generate and send automated report", "\uD83D\uDCCA",
                Map.of("reportTemplate", buildConfigField("select", "Report Template", true),
                       "recipients", buildConfigField("array", "Recipients", true))));

        list.add(buildActionType("approve_request", "Approve Request", "Automatically approve pending requests", "\u2705",
                Map.of("requestType", buildConfigField("select", "Request Type", true))));

        list.add(buildActionType("notify_team", "Notify Team", "Send notification to team members", "\uD83D\uDD14",
                Map.of("team", buildConfigField("select", "Team", true),
                       "message", buildConfigField("text", "Message", true),
                       "channel", buildConfigField("select", "Notification Channel", true))));

        return list;
    }

    private Map<String, Object> buildActionType(String type, String name, String description, String icon, Map<String, Object> config) {
        Map<String, Object> actionType = new LinkedHashMap<>();
        actionType.put("type", type);
        actionType.put("name", name);
        actionType.put("description", description);
        actionType.put("icon", icon);
        actionType.put("config", config);
        return actionType;
    }

    private Map<String, Object> buildConfigField(String type, String label, boolean required) {
        Map<String, Object> field = new LinkedHashMap<>();
        field.put("type", type);
        field.put("label", label);
        field.put("required", required);
        return field;
    }
}
