package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class EngagementAiDto {

    public static class SentimentAnalysisRequest {
        private String surveyName;
        private String surveyType;
        private int totalResponses;
        private double eNpsScore;
        private List<SurveyResponseEntry> responses;

        public String getSurveyName() { return surveyName; }
        public void setSurveyName(String surveyName) { this.surveyName = surveyName; }
        public String getSurveyType() { return surveyType; }
        public void setSurveyType(String surveyType) { this.surveyType = surveyType; }
        public int getTotalResponses() { return totalResponses; }
        public void setTotalResponses(int totalResponses) { this.totalResponses = totalResponses; }
        public double geteNpsScore() { return eNpsScore; }
        public void seteNpsScore(double eNpsScore) { this.eNpsScore = eNpsScore; }
        public List<SurveyResponseEntry> getResponses() { return responses; }
        public void setResponses(List<SurveyResponseEntry> responses) { this.responses = responses; }
    }

    public static class SurveyResponseEntry {
        private String question;
        private double avgRating;
        private List<String> freeTextResponses;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public double getAvgRating() { return avgRating; }
        public void setAvgRating(double avgRating) { this.avgRating = avgRating; }
        public List<String> getFreeTextResponses() { return freeTextResponses; }
        public void setFreeTextResponses(List<String> freeTextResponses) { this.freeTextResponses = freeTextResponses; }
    }

    public static class SentimentAnalysisResult {
        private String overallSentiment;
        private double sentimentScore;
        private String executiveSummary;
        private List<String> keyThemes;
        private List<String> concerns;
        private List<String> positives;
        private List<String> actionItems;
        private String eNpsTrendAnalysis;
        private List<DepartmentSentiment> departmentBreakdown;

        public String getOverallSentiment() { return overallSentiment; }
        public void setOverallSentiment(String overallSentiment) { this.overallSentiment = overallSentiment; }
        public double getSentimentScore() { return sentimentScore; }
        public void setSentimentScore(double sentimentScore) { this.sentimentScore = sentimentScore; }
        public String getExecutiveSummary() { return executiveSummary; }
        public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
        public List<String> getKeyThemes() { return keyThemes; }
        public void setKeyThemes(List<String> keyThemes) { this.keyThemes = keyThemes; }
        public List<String> getConcerns() { return concerns; }
        public void setConcerns(List<String> concerns) { this.concerns = concerns; }
        public List<String> getPositives() { return positives; }
        public void setPositives(List<String> positives) { this.positives = positives; }
        public List<String> getActionItems() { return actionItems; }
        public void setActionItems(List<String> actionItems) { this.actionItems = actionItems; }
        public String geteNpsTrendAnalysis() { return eNpsTrendAnalysis; }
        public void seteNpsTrendAnalysis(String eNpsTrendAnalysis) { this.eNpsTrendAnalysis = eNpsTrendAnalysis; }
        public List<DepartmentSentiment> getDepartmentBreakdown() { return departmentBreakdown; }
        public void setDepartmentBreakdown(List<DepartmentSentiment> departmentBreakdown) { this.departmentBreakdown = departmentBreakdown; }
    }

    public static class DepartmentSentiment {
        private String department;
        private String sentiment;
        private String keyIssue;

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getSentiment() { return sentiment; }
        public void setSentiment(String sentiment) { this.sentiment = sentiment; }
        public String getKeyIssue() { return keyIssue; }
        public void setKeyIssue(String keyIssue) { this.keyIssue = keyIssue; }
    }
}
