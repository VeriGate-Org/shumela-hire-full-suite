package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class SkillGapAiDto {

    public static class SkillGapAiRequest {
        private String employeeName;
        private String jobTitle;
        private String department;
        private List<GapEntry> gaps;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public List<GapEntry> getGaps() { return gaps; }
        public void setGaps(List<GapEntry> gaps) { this.gaps = gaps; }
    }

    public static class GapEntry {
        private String competencyName;
        private String category;
        private int currentLevel;
        private int targetLevel;

        public String getCompetencyName() { return competencyName; }
        public void setCompetencyName(String competencyName) { this.competencyName = competencyName; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public int getCurrentLevel() { return currentLevel; }
        public void setCurrentLevel(int currentLevel) { this.currentLevel = currentLevel; }
        public int getTargetLevel() { return targetLevel; }
        public void setTargetLevel(int targetLevel) { this.targetLevel = targetLevel; }
    }

    public static class SkillGapAiResult {
        private String overallAssessment;
        private List<String> priorityActions;
        private List<LearningPathItem> suggestedLearningPath;
        private String estimatedTimeframe;
        private List<String> riskFactors;
        private List<String> strengths;

        public String getOverallAssessment() { return overallAssessment; }
        public void setOverallAssessment(String overallAssessment) { this.overallAssessment = overallAssessment; }
        public List<String> getPriorityActions() { return priorityActions; }
        public void setPriorityActions(List<String> priorityActions) { this.priorityActions = priorityActions; }
        public List<LearningPathItem> getSuggestedLearningPath() { return suggestedLearningPath; }
        public void setSuggestedLearningPath(List<LearningPathItem> suggestedLearningPath) { this.suggestedLearningPath = suggestedLearningPath; }
        public String getEstimatedTimeframe() { return estimatedTimeframe; }
        public void setEstimatedTimeframe(String estimatedTimeframe) { this.estimatedTimeframe = estimatedTimeframe; }
        public List<String> getRiskFactors() { return riskFactors; }
        public void setRiskFactors(List<String> riskFactors) { this.riskFactors = riskFactors; }
        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> strengths) { this.strengths = strengths; }
    }

    public static class LearningPathItem {
        private int order;
        private String competency;
        private String activity;
        private String method;
        private String duration;
        private String rationale;

        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }
        public String getCompetency() { return competency; }
        public void setCompetency(String competency) { this.competency = competency; }
        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }
        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public String getRationale() { return rationale; }
        public void setRationale(String rationale) { this.rationale = rationale; }
    }
}
