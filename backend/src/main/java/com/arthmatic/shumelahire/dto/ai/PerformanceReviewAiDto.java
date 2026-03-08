package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class PerformanceReviewAiDto {

    public static class ReviewDraftRequest {
        private String employeeName;
        private String jobTitle;
        private String department;
        private String reviewPeriod;
        private List<String> goals;
        private List<String> achievements;
        private List<String> feedbackSummaries;
        private Integer overallRating;
        private String managerNotes;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getReviewPeriod() { return reviewPeriod; }
        public void setReviewPeriod(String reviewPeriod) { this.reviewPeriod = reviewPeriod; }
        public List<String> getGoals() { return goals; }
        public void setGoals(List<String> goals) { this.goals = goals; }
        public List<String> getAchievements() { return achievements; }
        public void setAchievements(List<String> achievements) { this.achievements = achievements; }
        public List<String> getFeedbackSummaries() { return feedbackSummaries; }
        public void setFeedbackSummaries(List<String> feedbackSummaries) { this.feedbackSummaries = feedbackSummaries; }
        public Integer getOverallRating() { return overallRating; }
        public void setOverallRating(Integer overallRating) { this.overallRating = overallRating; }
        public String getManagerNotes() { return managerNotes; }
        public void setManagerNotes(String managerNotes) { this.managerNotes = managerNotes; }
    }

    public static class ReviewDraftResult {
        private String narrative;
        private String strengthsSummary;
        private String developmentAreas;
        private List<String> suggestedGoals;
        private String overallAssessment;
        private String ratingJustification;

        public String getNarrative() { return narrative; }
        public void setNarrative(String narrative) { this.narrative = narrative; }
        public String getStrengthsSummary() { return strengthsSummary; }
        public void setStrengthsSummary(String strengthsSummary) { this.strengthsSummary = strengthsSummary; }
        public String getDevelopmentAreas() { return developmentAreas; }
        public void setDevelopmentAreas(String developmentAreas) { this.developmentAreas = developmentAreas; }
        public List<String> getSuggestedGoals() { return suggestedGoals; }
        public void setSuggestedGoals(List<String> suggestedGoals) { this.suggestedGoals = suggestedGoals; }
        public String getOverallAssessment() { return overallAssessment; }
        public void setOverallAssessment(String overallAssessment) { this.overallAssessment = overallAssessment; }
        public String getRatingJustification() { return ratingJustification; }
        public void setRatingJustification(String ratingJustification) { this.ratingJustification = ratingJustification; }
    }

    public static class FeedbackSummaryRequest {
        private String employeeName;
        private List<FeedbackEntry> feedbackEntries;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public List<FeedbackEntry> getFeedbackEntries() { return feedbackEntries; }
        public void setFeedbackEntries(List<FeedbackEntry> feedbackEntries) { this.feedbackEntries = feedbackEntries; }
    }

    public static class FeedbackEntry {
        private String respondentRole;
        private String ratings;
        private String comments;
        private String strengths;
        private String improvements;

        public String getRespondentRole() { return respondentRole; }
        public void setRespondentRole(String respondentRole) { this.respondentRole = respondentRole; }
        public String getRatings() { return ratings; }
        public void setRatings(String ratings) { this.ratings = ratings; }
        public String getComments() { return comments; }
        public void setComments(String comments) { this.comments = comments; }
        public String getStrengths() { return strengths; }
        public void setStrengths(String strengths) { this.strengths = strengths; }
        public String getImprovements() { return improvements; }
        public void setImprovements(String improvements) { this.improvements = improvements; }
    }

    public static class FeedbackSummaryResult {
        private String executiveSummary;
        private List<String> consensusStrengths;
        private List<String> consensusDevelopmentAreas;
        private List<String> blindSpots;
        private List<String> actionableRecommendations;
        private String sentimentOverview;

        public String getExecutiveSummary() { return executiveSummary; }
        public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
        public List<String> getConsensusStrengths() { return consensusStrengths; }
        public void setConsensusStrengths(List<String> consensusStrengths) { this.consensusStrengths = consensusStrengths; }
        public List<String> getConsensusDevelopmentAreas() { return consensusDevelopmentAreas; }
        public void setConsensusDevelopmentAreas(List<String> consensusDevelopmentAreas) { this.consensusDevelopmentAreas = consensusDevelopmentAreas; }
        public List<String> getBlindSpots() { return blindSpots; }
        public void setBlindSpots(List<String> blindSpots) { this.blindSpots = blindSpots; }
        public List<String> getActionableRecommendations() { return actionableRecommendations; }
        public void setActionableRecommendations(List<String> actionableRecommendations) { this.actionableRecommendations = actionableRecommendations; }
        public String getSentimentOverview() { return sentimentOverview; }
        public void setSentimentOverview(String sentimentOverview) { this.sentimentOverview = sentimentOverview; }
    }

    public static class GoalSuggestionRequest {
        private String employeeName;
        private String jobTitle;
        private String department;
        private List<String> competencyGaps;
        private List<String> previousGoals;
        private String careerAspiration;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public List<String> getCompetencyGaps() { return competencyGaps; }
        public void setCompetencyGaps(List<String> competencyGaps) { this.competencyGaps = competencyGaps; }
        public List<String> getPreviousGoals() { return previousGoals; }
        public void setPreviousGoals(List<String> previousGoals) { this.previousGoals = previousGoals; }
        public String getCareerAspiration() { return careerAspiration; }
        public void setCareerAspiration(String careerAspiration) { this.careerAspiration = careerAspiration; }
    }

    public static class GoalSuggestionResult {
        private List<SuggestedGoal> goals;

        public List<SuggestedGoal> getGoals() { return goals; }
        public void setGoals(List<SuggestedGoal> goals) { this.goals = goals; }
    }

    public static class SuggestedGoal {
        private String goal;
        private String category;
        private String measurableTarget;
        private String timeframe;
        private String rationale;

        public String getGoal() { return goal; }
        public void setGoal(String goal) { this.goal = goal; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getMeasurableTarget() { return measurableTarget; }
        public void setMeasurableTarget(String measurableTarget) { this.measurableTarget = measurableTarget; }
        public String getTimeframe() { return timeframe; }
        public void setTimeframe(String timeframe) { this.timeframe = timeframe; }
        public String getRationale() { return rationale; }
        public void setRationale(String rationale) { this.rationale = rationale; }
    }
}
