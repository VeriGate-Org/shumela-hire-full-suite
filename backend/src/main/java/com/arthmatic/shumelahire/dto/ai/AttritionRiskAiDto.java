package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class AttritionRiskAiDto {

    public static class AttritionAnalysisRequest {
        private String employeeName;
        private String jobTitle;
        private String department;
        private int tenureMonths;
        private double recentPerformanceRating;
        private int leaveDaysTaken;
        private int overtimeHoursLastQuarter;
        private boolean hadRecentPromotion;
        private boolean hadSalaryIncrease;
        private double salaryPercentile;
        private int trainingHoursLastYear;
        private String lastEngagementScore;
        private List<String> additionalFactors;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public int getTenureMonths() { return tenureMonths; }
        public void setTenureMonths(int tenureMonths) { this.tenureMonths = tenureMonths; }
        public double getRecentPerformanceRating() { return recentPerformanceRating; }
        public void setRecentPerformanceRating(double recentPerformanceRating) { this.recentPerformanceRating = recentPerformanceRating; }
        public int getLeaveDaysTaken() { return leaveDaysTaken; }
        public void setLeaveDaysTaken(int leaveDaysTaken) { this.leaveDaysTaken = leaveDaysTaken; }
        public int getOvertimeHoursLastQuarter() { return overtimeHoursLastQuarter; }
        public void setOvertimeHoursLastQuarter(int overtimeHoursLastQuarter) { this.overtimeHoursLastQuarter = overtimeHoursLastQuarter; }
        public boolean isHadRecentPromotion() { return hadRecentPromotion; }
        public void setHadRecentPromotion(boolean hadRecentPromotion) { this.hadRecentPromotion = hadRecentPromotion; }
        public boolean isHadSalaryIncrease() { return hadSalaryIncrease; }
        public void setHadSalaryIncrease(boolean hadSalaryIncrease) { this.hadSalaryIncrease = hadSalaryIncrease; }
        public double getSalaryPercentile() { return salaryPercentile; }
        public void setSalaryPercentile(double salaryPercentile) { this.salaryPercentile = salaryPercentile; }
        public int getTrainingHoursLastYear() { return trainingHoursLastYear; }
        public void setTrainingHoursLastYear(int trainingHoursLastYear) { this.trainingHoursLastYear = trainingHoursLastYear; }
        public String getLastEngagementScore() { return lastEngagementScore; }
        public void setLastEngagementScore(String lastEngagementScore) { this.lastEngagementScore = lastEngagementScore; }
        public List<String> getAdditionalFactors() { return additionalFactors; }
        public void setAdditionalFactors(List<String> additionalFactors) { this.additionalFactors = additionalFactors; }
    }

    public static class AttritionAnalysisResult {
        private int riskScore;
        private String riskLevel;
        private String summary;
        private List<String> riskFactors;
        private List<String> protectiveFactors;
        private List<String> retentionRecommendations;
        private String predictedTimeframe;
        private double confidence;

        public int getRiskScore() { return riskScore; }
        public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public List<String> getRiskFactors() { return riskFactors; }
        public void setRiskFactors(List<String> riskFactors) { this.riskFactors = riskFactors; }
        public List<String> getProtectiveFactors() { return protectiveFactors; }
        public void setProtectiveFactors(List<String> protectiveFactors) { this.protectiveFactors = protectiveFactors; }
        public List<String> getRetentionRecommendations() { return retentionRecommendations; }
        public void setRetentionRecommendations(List<String> retentionRecommendations) { this.retentionRecommendations = retentionRecommendations; }
        public String getPredictedTimeframe() { return predictedTimeframe; }
        public void setPredictedTimeframe(String predictedTimeframe) { this.predictedTimeframe = predictedTimeframe; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }

    public static class WorkforceAnalysisRequest {
        private String department;
        private int totalHeadcount;
        private double avgTenureMonths;
        private double turnoverRateLast12Months;
        private int openPositions;
        private double avgPerformanceRating;
        private double avgEngagementScore;
        private List<String> recentDepartures;

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public int getTotalHeadcount() { return totalHeadcount; }
        public void setTotalHeadcount(int totalHeadcount) { this.totalHeadcount = totalHeadcount; }
        public double getAvgTenureMonths() { return avgTenureMonths; }
        public void setAvgTenureMonths(double avgTenureMonths) { this.avgTenureMonths = avgTenureMonths; }
        public double getTurnoverRateLast12Months() { return turnoverRateLast12Months; }
        public void setTurnoverRateLast12Months(double turnoverRateLast12Months) { this.turnoverRateLast12Months = turnoverRateLast12Months; }
        public int getOpenPositions() { return openPositions; }
        public void setOpenPositions(int openPositions) { this.openPositions = openPositions; }
        public double getAvgPerformanceRating() { return avgPerformanceRating; }
        public void setAvgPerformanceRating(double avgPerformanceRating) { this.avgPerformanceRating = avgPerformanceRating; }
        public double getAvgEngagementScore() { return avgEngagementScore; }
        public void setAvgEngagementScore(double avgEngagementScore) { this.avgEngagementScore = avgEngagementScore; }
        public List<String> getRecentDepartures() { return recentDepartures; }
        public void setRecentDepartures(List<String> recentDepartures) { this.recentDepartures = recentDepartures; }
    }

    public static class WorkforceAnalysisResult {
        private String overallHealthAssessment;
        private List<String> keyRisks;
        private List<String> strengths;
        private List<String> hiringRecommendations;
        private List<String> retentionStrategies;
        private String forecastSummary;

        public String getOverallHealthAssessment() { return overallHealthAssessment; }
        public void setOverallHealthAssessment(String overallHealthAssessment) { this.overallHealthAssessment = overallHealthAssessment; }
        public List<String> getKeyRisks() { return keyRisks; }
        public void setKeyRisks(List<String> keyRisks) { this.keyRisks = keyRisks; }
        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> strengths) { this.strengths = strengths; }
        public List<String> getHiringRecommendations() { return hiringRecommendations; }
        public void setHiringRecommendations(List<String> hiringRecommendations) { this.hiringRecommendations = hiringRecommendations; }
        public List<String> getRetentionStrategies() { return retentionStrategies; }
        public void setRetentionStrategies(List<String> retentionStrategies) { this.retentionStrategies = retentionStrategies; }
        public String getForecastSummary() { return forecastSummary; }
        public void setForecastSummary(String forecastSummary) { this.forecastSummary = forecastSummary; }
    }
}
