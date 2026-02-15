package com.arthmatic.talentgate.dto.ai;

import java.util.List;

public class SalaryBenchmarkDto {

    public static class SalaryBenchmarkRequest {
        private String positionTitle;
        private String department;
        private String jobGrade;
        private String level;
        private String location;
        private Double candidateCurrentSalary;
        private Double candidateExpectedSalary;

        public String getPositionTitle() { return positionTitle; }
        public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getJobGrade() { return jobGrade; }
        public void setJobGrade(String jobGrade) { this.jobGrade = jobGrade; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public Double getCandidateCurrentSalary() { return candidateCurrentSalary; }
        public void setCandidateCurrentSalary(Double candidateCurrentSalary) { this.candidateCurrentSalary = candidateCurrentSalary; }
        public Double getCandidateExpectedSalary() { return candidateExpectedSalary; }
        public void setCandidateExpectedSalary(Double candidateExpectedSalary) { this.candidateExpectedSalary = candidateExpectedSalary; }
    }

    public static class SalaryBenchmarkResult {
        private double suggestedMin;
        private double suggestedMax;
        private double suggestedTarget;
        private String currency;
        private String justification;
        private List<String> marketFactors;
        private int dataPointsUsed;

        public double getSuggestedMin() { return suggestedMin; }
        public void setSuggestedMin(double suggestedMin) { this.suggestedMin = suggestedMin; }
        public double getSuggestedMax() { return suggestedMax; }
        public void setSuggestedMax(double suggestedMax) { this.suggestedMax = suggestedMax; }
        public double getSuggestedTarget() { return suggestedTarget; }
        public void setSuggestedTarget(double suggestedTarget) { this.suggestedTarget = suggestedTarget; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public List<String> getMarketFactors() { return marketFactors; }
        public void setMarketFactors(List<String> marketFactors) { this.marketFactors = marketFactors; }
        public int getDataPointsUsed() { return dataPointsUsed; }
        public void setDataPointsUsed(int dataPointsUsed) { this.dataPointsUsed = dataPointsUsed; }
    }
}
