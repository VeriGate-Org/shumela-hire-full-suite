package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class TrainingPathAiDto {

    public static class LearningPathRequest {
        private String employeeName;
        private String currentRole;
        private String targetRole;
        private String department;
        private List<String> currentSkills;
        private List<String> skillGaps;
        private List<String> completedCourses;
        private String careerGoal;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getCurrentRole() { return currentRole; }
        public void setCurrentRole(String currentRole) { this.currentRole = currentRole; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public List<String> getCurrentSkills() { return currentSkills; }
        public void setCurrentSkills(List<String> currentSkills) { this.currentSkills = currentSkills; }
        public List<String> getSkillGaps() { return skillGaps; }
        public void setSkillGaps(List<String> skillGaps) { this.skillGaps = skillGaps; }
        public List<String> getCompletedCourses() { return completedCourses; }
        public void setCompletedCourses(List<String> completedCourses) { this.completedCourses = completedCourses; }
        public String getCareerGoal() { return careerGoal; }
        public void setCareerGoal(String careerGoal) { this.careerGoal = careerGoal; }
    }

    public static class LearningPathResult {
        private String summary;
        private String estimatedDuration;
        private List<PathPhase> phases;
        private List<String> certificationRecommendations;
        private List<String> mentorshipSuggestions;
        private String readinessAssessment;

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public String getEstimatedDuration() { return estimatedDuration; }
        public void setEstimatedDuration(String estimatedDuration) { this.estimatedDuration = estimatedDuration; }
        public List<PathPhase> getPhases() { return phases; }
        public void setPhases(List<PathPhase> phases) { this.phases = phases; }
        public List<String> getCertificationRecommendations() { return certificationRecommendations; }
        public void setCertificationRecommendations(List<String> certificationRecommendations) { this.certificationRecommendations = certificationRecommendations; }
        public List<String> getMentorshipSuggestions() { return mentorshipSuggestions; }
        public void setMentorshipSuggestions(List<String> mentorshipSuggestions) { this.mentorshipSuggestions = mentorshipSuggestions; }
        public String getReadinessAssessment() { return readinessAssessment; }
        public void setReadinessAssessment(String readinessAssessment) { this.readinessAssessment = readinessAssessment; }
    }

    public static class PathPhase {
        private int phase;
        private String name;
        private String duration;
        private List<PathActivity> activities;
        private String milestone;

        public int getPhase() { return phase; }
        public void setPhase(int phase) { this.phase = phase; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public List<PathActivity> getActivities() { return activities; }
        public void setActivities(List<PathActivity> activities) { this.activities = activities; }
        public String getMilestone() { return milestone; }
        public void setMilestone(String milestone) { this.milestone = milestone; }
    }

    public static class PathActivity {
        private String activity;
        private String type;
        private String provider;
        private String duration;
        private String skillAddressed;

        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public String getSkillAddressed() { return skillAddressed; }
        public void setSkillAddressed(String skillAddressed) { this.skillAddressed = skillAddressed; }
    }

    public static class TrainingRoiRequest {
        private String courseName;
        private int enrollmentCount;
        private int completionCount;
        private double totalCost;
        private List<String> preTrainingMetrics;
        private List<String> postTrainingMetrics;
        private String department;

        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }
        public int getEnrollmentCount() { return enrollmentCount; }
        public void setEnrollmentCount(int enrollmentCount) { this.enrollmentCount = enrollmentCount; }
        public int getCompletionCount() { return completionCount; }
        public void setCompletionCount(int completionCount) { this.completionCount = completionCount; }
        public double getTotalCost() { return totalCost; }
        public void setTotalCost(double totalCost) { this.totalCost = totalCost; }
        public List<String> getPreTrainingMetrics() { return preTrainingMetrics; }
        public void setPreTrainingMetrics(List<String> preTrainingMetrics) { this.preTrainingMetrics = preTrainingMetrics; }
        public List<String> getPostTrainingMetrics() { return postTrainingMetrics; }
        public void setPostTrainingMetrics(List<String> postTrainingMetrics) { this.postTrainingMetrics = postTrainingMetrics; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
    }

    public static class TrainingRoiResult {
        private String roiSummary;
        private double estimatedRoiPercentage;
        private List<String> keyFindings;
        private List<String> recommendations;
        private String effectivenessRating;

        public String getRoiSummary() { return roiSummary; }
        public void setRoiSummary(String roiSummary) { this.roiSummary = roiSummary; }
        public double getEstimatedRoiPercentage() { return estimatedRoiPercentage; }
        public void setEstimatedRoiPercentage(double estimatedRoiPercentage) { this.estimatedRoiPercentage = estimatedRoiPercentage; }
        public List<String> getKeyFindings() { return keyFindings; }
        public void setKeyFindings(List<String> keyFindings) { this.keyFindings = keyFindings; }
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
        public String getEffectivenessRating() { return effectivenessRating; }
        public void setEffectivenessRating(String effectivenessRating) { this.effectivenessRating = effectivenessRating; }
    }
}
