package com.arthmatic.talentgate.dto.ai;

import java.util.List;

public class CandidateSummaryDto {

    public static class CandidateSummaryResult {
        private String executiveSummary;
        private String educationSummary;
        private String experienceSummary;
        private List<String> keyStrengths;
        private List<String> potentialGaps;
        private String fitAssessment;

        public String getExecutiveSummary() { return executiveSummary; }
        public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
        public String getEducationSummary() { return educationSummary; }
        public void setEducationSummary(String educationSummary) { this.educationSummary = educationSummary; }
        public String getExperienceSummary() { return experienceSummary; }
        public void setExperienceSummary(String experienceSummary) { this.experienceSummary = experienceSummary; }
        public List<String> getKeyStrengths() { return keyStrengths; }
        public void setKeyStrengths(List<String> keyStrengths) { this.keyStrengths = keyStrengths; }
        public List<String> getPotentialGaps() { return potentialGaps; }
        public void setPotentialGaps(List<String> potentialGaps) { this.potentialGaps = potentialGaps; }
        public String getFitAssessment() { return fitAssessment; }
        public void setFitAssessment(String fitAssessment) { this.fitAssessment = fitAssessment; }
    }
}
