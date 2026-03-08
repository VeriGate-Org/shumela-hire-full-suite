package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class LeaveAnalyticsAiDto {

    public static class LeavePatternRequest {
        private String department;
        private int totalEmployees;
        private List<LeaveDataPoint> leaveData;
        private double avgLeaveDaysPerEmployee;
        private List<String> peakMonths;
        private int year;

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public int getTotalEmployees() { return totalEmployees; }
        public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }
        public List<LeaveDataPoint> getLeaveData() { return leaveData; }
        public void setLeaveData(List<LeaveDataPoint> leaveData) { this.leaveData = leaveData; }
        public double getAvgLeaveDaysPerEmployee() { return avgLeaveDaysPerEmployee; }
        public void setAvgLeaveDaysPerEmployee(double avgLeaveDaysPerEmployee) { this.avgLeaveDaysPerEmployee = avgLeaveDaysPerEmployee; }
        public List<String> getPeakMonths() { return peakMonths; }
        public void setPeakMonths(List<String> peakMonths) { this.peakMonths = peakMonths; }
        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }
    }

    public static class LeaveDataPoint {
        private String leaveType;
        private int totalDays;
        private int requestCount;
        private String month;

        public String getLeaveType() { return leaveType; }
        public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
        public int getTotalDays() { return totalDays; }
        public void setTotalDays(int totalDays) { this.totalDays = totalDays; }
        public int getRequestCount() { return requestCount; }
        public void setRequestCount(int requestCount) { this.requestCount = requestCount; }
        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
    }

    public static class LeavePatternResult {
        private String overallAnalysis;
        private List<String> patterns;
        private List<String> burnoutWarnings;
        private List<String> coverageRisks;
        private List<MonthForecast> forecast;
        private List<String> policyRecommendations;
        private List<String> staffingRecommendations;

        public String getOverallAnalysis() { return overallAnalysis; }
        public void setOverallAnalysis(String overallAnalysis) { this.overallAnalysis = overallAnalysis; }
        public List<String> getPatterns() { return patterns; }
        public void setPatterns(List<String> patterns) { this.patterns = patterns; }
        public List<String> getBurnoutWarnings() { return burnoutWarnings; }
        public void setBurnoutWarnings(List<String> burnoutWarnings) { this.burnoutWarnings = burnoutWarnings; }
        public List<String> getCoverageRisks() { return coverageRisks; }
        public void setCoverageRisks(List<String> coverageRisks) { this.coverageRisks = coverageRisks; }
        public List<MonthForecast> getForecast() { return forecast; }
        public void setForecast(List<MonthForecast> forecast) { this.forecast = forecast; }
        public List<String> getPolicyRecommendations() { return policyRecommendations; }
        public void setPolicyRecommendations(List<String> policyRecommendations) { this.policyRecommendations = policyRecommendations; }
        public List<String> getStaffingRecommendations() { return staffingRecommendations; }
        public void setStaffingRecommendations(List<String> staffingRecommendations) { this.staffingRecommendations = staffingRecommendations; }
    }

    public static class MonthForecast {
        private String month;
        private String expectedLeaveLevel;
        private String recommendation;

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public String getExpectedLeaveLevel() { return expectedLeaveLevel; }
        public void setExpectedLeaveLevel(String expectedLeaveLevel) { this.expectedLeaveLevel = expectedLeaveLevel; }
        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    }
}
