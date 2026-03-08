package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class HrGeneralAiDto {

    // Labour Relations
    public static class CaseAnalysisRequest {
        private String caseType;
        private String description;
        private String employeeRole;
        private String department;
        private List<String> previousActions;
        private String severity;

        public String getCaseType() { return caseType; }
        public void setCaseType(String caseType) { this.caseType = caseType; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getEmployeeRole() { return employeeRole; }
        public void setEmployeeRole(String employeeRole) { this.employeeRole = employeeRole; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public List<String> getPreviousActions() { return previousActions; }
        public void setPreviousActions(List<String> previousActions) { this.previousActions = previousActions; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
    }

    public static class CaseAnalysisResult {
        private String summary;
        private List<String> recommendedSteps;
        private List<String> legalConsiderations;
        private String riskAssessment;
        private List<String> documentationRequired;
        private String suggestedResolution;

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public List<String> getRecommendedSteps() { return recommendedSteps; }
        public void setRecommendedSteps(List<String> recommendedSteps) { this.recommendedSteps = recommendedSteps; }
        public List<String> getLegalConsiderations() { return legalConsiderations; }
        public void setLegalConsiderations(List<String> legalConsiderations) { this.legalConsiderations = legalConsiderations; }
        public String getRiskAssessment() { return riskAssessment; }
        public void setRiskAssessment(String riskAssessment) { this.riskAssessment = riskAssessment; }
        public List<String> getDocumentationRequired() { return documentationRequired; }
        public void setDocumentationRequired(List<String> documentationRequired) { this.documentationRequired = documentationRequired; }
        public String getSuggestedResolution() { return suggestedResolution; }
        public void setSuggestedResolution(String suggestedResolution) { this.suggestedResolution = suggestedResolution; }
    }

    // Onboarding
    public static class OnboardingPlanRequest {
        private String employeeName;
        private String jobTitle;
        private String department;
        private String startDate;
        private String experienceLevel;
        private List<String> requiredCertifications;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
        public List<String> getRequiredCertifications() { return requiredCertifications; }
        public void setRequiredCertifications(List<String> requiredCertifications) { this.requiredCertifications = requiredCertifications; }
    }

    public static class OnboardingPlanResult {
        private String welcomeMessage;
        private List<OnboardingWeek> weeklyPlan;
        private List<String> requiredTraining;
        private List<String> keyMeetings;
        private List<String> successMetrics;

        public String getWelcomeMessage() { return welcomeMessage; }
        public void setWelcomeMessage(String welcomeMessage) { this.welcomeMessage = welcomeMessage; }
        public List<OnboardingWeek> getWeeklyPlan() { return weeklyPlan; }
        public void setWeeklyPlan(List<OnboardingWeek> weeklyPlan) { this.weeklyPlan = weeklyPlan; }
        public List<String> getRequiredTraining() { return requiredTraining; }
        public void setRequiredTraining(List<String> requiredTraining) { this.requiredTraining = requiredTraining; }
        public List<String> getKeyMeetings() { return keyMeetings; }
        public void setKeyMeetings(List<String> keyMeetings) { this.keyMeetings = keyMeetings; }
        public List<String> getSuccessMetrics() { return successMetrics; }
        public void setSuccessMetrics(List<String> successMetrics) { this.successMetrics = successMetrics; }
    }

    public static class OnboardingWeek {
        private int week;
        private String theme;
        private List<String> tasks;

        public int getWeek() { return week; }
        public void setWeek(int week) { this.week = week; }
        public String getTheme() { return theme; }
        public void setTheme(String theme) { this.theme = theme; }
        public List<String> getTasks() { return tasks; }
        public void setTasks(List<String> tasks) { this.tasks = tasks; }
    }

    // Payroll Anomaly
    public static class PayrollAnomalyRequest {
        private String period;
        private int totalEmployees;
        private List<PayrollEntry> entries;

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
        public int getTotalEmployees() { return totalEmployees; }
        public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }
        public List<PayrollEntry> getEntries() { return entries; }
        public void setEntries(List<PayrollEntry> entries) { this.entries = entries; }
    }

    public static class PayrollEntry {
        private String employeeName;
        private double grossPay;
        private double netPay;
        private double previousGrossPay;
        private double overtimePay;
        private double deductions;
        private String anomalyNotes;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public double getGrossPay() { return grossPay; }
        public void setGrossPay(double grossPay) { this.grossPay = grossPay; }
        public double getNetPay() { return netPay; }
        public void setNetPay(double netPay) { this.netPay = netPay; }
        public double getPreviousGrossPay() { return previousGrossPay; }
        public void setPreviousGrossPay(double previousGrossPay) { this.previousGrossPay = previousGrossPay; }
        public double getOvertimePay() { return overtimePay; }
        public void setOvertimePay(double overtimePay) { this.overtimePay = overtimePay; }
        public double getDeductions() { return deductions; }
        public void setDeductions(double deductions) { this.deductions = deductions; }
        public String getAnomalyNotes() { return anomalyNotes; }
        public void setAnomalyNotes(String anomalyNotes) { this.anomalyNotes = anomalyNotes; }
    }

    public static class PayrollAnomalyResult {
        private String summary;
        private List<PayrollFlag> flags;
        private List<String> recommendations;

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public List<PayrollFlag> getFlags() { return flags; }
        public void setFlags(List<PayrollFlag> flags) { this.flags = flags; }
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    }

    public static class PayrollFlag {
        private String employeeName;
        private String flagType;
        private String severity;
        private String description;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getFlagType() { return flagType; }
        public void setFlagType(String flagType) { this.flagType = flagType; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
