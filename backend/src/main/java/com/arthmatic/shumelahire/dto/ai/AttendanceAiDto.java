package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class AttendanceAiDto {

    public static class AnomalyDetectionRequest {
        private String department;
        private List<AttendanceRecord> records;
        private int periodDays;

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public List<AttendanceRecord> getRecords() { return records; }
        public void setRecords(List<AttendanceRecord> records) { this.records = records; }
        public int getPeriodDays() { return periodDays; }
        public void setPeriodDays(int periodDays) { this.periodDays = periodDays; }
    }

    public static class AttendanceRecord {
        private String employeeName;
        private int lateArrivals;
        private int earlyDepartures;
        private int absences;
        private double avgOvertimeHoursPerWeek;
        private int missedClockIns;
        private String shiftPattern;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public int getLateArrivals() { return lateArrivals; }
        public void setLateArrivals(int lateArrivals) { this.lateArrivals = lateArrivals; }
        public int getEarlyDepartures() { return earlyDepartures; }
        public void setEarlyDepartures(int earlyDepartures) { this.earlyDepartures = earlyDepartures; }
        public int getAbsences() { return absences; }
        public void setAbsences(int absences) { this.absences = absences; }
        public double getAvgOvertimeHoursPerWeek() { return avgOvertimeHoursPerWeek; }
        public void setAvgOvertimeHoursPerWeek(double avgOvertimeHoursPerWeek) { this.avgOvertimeHoursPerWeek = avgOvertimeHoursPerWeek; }
        public int getMissedClockIns() { return missedClockIns; }
        public void setMissedClockIns(int missedClockIns) { this.missedClockIns = missedClockIns; }
        public String getShiftPattern() { return shiftPattern; }
        public void setShiftPattern(String shiftPattern) { this.shiftPattern = shiftPattern; }
    }

    public static class AnomalyDetectionResult {
        private String overallAssessment;
        private List<AnomalyFlag> anomalies;
        private List<String> fatigueWarnings;
        private List<String> policyViolations;
        private List<String> recommendations;

        public String getOverallAssessment() { return overallAssessment; }
        public void setOverallAssessment(String overallAssessment) { this.overallAssessment = overallAssessment; }
        public List<AnomalyFlag> getAnomalies() { return anomalies; }
        public void setAnomalies(List<AnomalyFlag> anomalies) { this.anomalies = anomalies; }
        public List<String> getFatigueWarnings() { return fatigueWarnings; }
        public void setFatigueWarnings(List<String> fatigueWarnings) { this.fatigueWarnings = fatigueWarnings; }
        public List<String> getPolicyViolations() { return policyViolations; }
        public void setPolicyViolations(List<String> policyViolations) { this.policyViolations = policyViolations; }
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    }

    public static class AnomalyFlag {
        private String employeeName;
        private String anomalyType;
        private String severity;
        private String description;
        private String suggestedAction;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getAnomalyType() { return anomalyType; }
        public void setAnomalyType(String anomalyType) { this.anomalyType = anomalyType; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getSuggestedAction() { return suggestedAction; }
        public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
    }
}
