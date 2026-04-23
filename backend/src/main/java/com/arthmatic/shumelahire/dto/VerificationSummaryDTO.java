package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.BackgroundCheck;
import com.arthmatic.shumelahire.entity.BackgroundCheckResult;
import com.arthmatic.shumelahire.entity.BackgroundCheckStatus;

import java.util.List;

public class VerificationSummaryDTO {

    private String applicationId;
    private List<String> requiredCheckTypes;
    private boolean enforceCheckCompletion;
    private List<CheckSummary> checks;
    private int clearCount;
    private int totalRequired;
    private boolean hasAdverse;
    private boolean allClear;
    private boolean noneStarted;

    public VerificationSummaryDTO() {}

    public VerificationSummaryDTO(String applicationId, List<String> requiredCheckTypes,
                                   boolean enforceCheckCompletion, List<BackgroundCheck> backgroundChecks) {
        this.applicationId = applicationId;
        this.requiredCheckTypes = requiredCheckTypes;
        this.enforceCheckCompletion = enforceCheckCompletion;
        this.totalRequired = requiredCheckTypes.size();

        this.checks = backgroundChecks.stream().map(bc -> {
            CheckSummary cs = new CheckSummary();
            cs.setId(bc.getId());
            cs.setReferenceId(bc.getReferenceId());
            cs.setCheckTypes(bc.getCheckTypes());
            cs.setStatus(bc.getStatus() != null ? bc.getStatus().name() : null);
            cs.setOverallResult(bc.getOverallResult() != null ? bc.getOverallResult().name() : null);
            return cs;
        }).toList();

        // Count clear checks by check type
        java.util.Set<String> clearedTypes = new java.util.HashSet<>();
        boolean adverse = false;
        for (BackgroundCheck bc : backgroundChecks) {
            if (bc.getStatus() == BackgroundCheckStatus.COMPLETED
                    && bc.getOverallResult() == BackgroundCheckResult.CLEAR) {
                List<String> types = parseCheckTypes(bc.getCheckTypes());
                clearedTypes.addAll(types);
            }
            if (bc.getOverallResult() == BackgroundCheckResult.ADVERSE) {
                adverse = true;
            }
        }

        this.hasAdverse = adverse;
        this.clearCount = (int) requiredCheckTypes.stream().filter(clearedTypes::contains).count();
        this.allClear = this.clearCount >= this.totalRequired && this.totalRequired > 0;
        this.noneStarted = backgroundChecks.isEmpty();
    }

    private static List<String> parseCheckTypes(String checkTypesJson) {
        if (checkTypesJson == null || checkTypesJson.isBlank()) return List.of();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(checkTypesJson,
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    // Getters and setters
    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public List<String> getRequiredCheckTypes() { return requiredCheckTypes; }
    public void setRequiredCheckTypes(List<String> requiredCheckTypes) { this.requiredCheckTypes = requiredCheckTypes; }
    public boolean isEnforceCheckCompletion() { return enforceCheckCompletion; }
    public void setEnforceCheckCompletion(boolean enforceCheckCompletion) { this.enforceCheckCompletion = enforceCheckCompletion; }
    public List<CheckSummary> getChecks() { return checks; }
    public void setChecks(List<CheckSummary> checks) { this.checks = checks; }
    public int getClearCount() { return clearCount; }
    public void setClearCount(int clearCount) { this.clearCount = clearCount; }
    public int getTotalRequired() { return totalRequired; }
    public void setTotalRequired(int totalRequired) { this.totalRequired = totalRequired; }
    public boolean isHasAdverse() { return hasAdverse; }
    public void setHasAdverse(boolean hasAdverse) { this.hasAdverse = hasAdverse; }
    public boolean isAllClear() { return allClear; }
    public void setAllClear(boolean allClear) { this.allClear = allClear; }
    public boolean isNoneStarted() { return noneStarted; }
    public void setNoneStarted(boolean noneStarted) { this.noneStarted = noneStarted; }

    public static class CheckSummary {
        private String id;
        private String referenceId;
        private String checkTypes;
        private String status;
        private String overallResult;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getReferenceId() { return referenceId; }
        public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
        public String getCheckTypes() { return checkTypes; }
        public void setCheckTypes(String checkTypes) { this.checkTypes = checkTypes; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getOverallResult() { return overallResult; }
        public void setOverallResult(String overallResult) { this.overallResult = overallResult; }
    }
}
