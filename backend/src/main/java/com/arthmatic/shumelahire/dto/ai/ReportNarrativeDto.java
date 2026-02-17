package com.arthmatic.shumelahire.dto.ai;

import java.util.List;
import java.util.Map;

public class ReportNarrativeDto {

    public static class ReportNarrativeRequest {
        private String reportType;
        private String jobId;
        private Map<String, Object> reportData;
        private String audience;
        private String tone;

        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }
        public String getJobId() { return jobId; }
        public void setJobId(String jobId) { this.jobId = jobId; }
        public Map<String, Object> getReportData() { return reportData; }
        public void setReportData(Map<String, Object> reportData) { this.reportData = reportData; }
        public String getAudience() { return audience; }
        public void setAudience(String audience) { this.audience = audience; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
    }

    public static class ReportNarrativeResult {
        private String executiveSummary;
        private List<String> keyFindings;
        private List<String> recommendations;

        public String getExecutiveSummary() { return executiveSummary; }
        public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
        public List<String> getKeyFindings() { return keyFindings; }
        public void setKeyFindings(List<String> keyFindings) { this.keyFindings = keyFindings; }
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    }
}
