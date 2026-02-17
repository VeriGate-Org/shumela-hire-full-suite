package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class CvScreeningDto {

    public static class CvScreeningRequest {
        private String applicationId;
        private List<String> jobRequirements;

        public String getApplicationId() { return applicationId; }
        public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
        public List<String> getJobRequirements() { return jobRequirements; }
        public void setJobRequirements(List<String> jobRequirements) { this.jobRequirements = jobRequirements; }
    }

    public static class CvScreeningResult {
        private int overallScore;
        private int skillsMatchScore;
        private int experienceMatchScore;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private List<String> strengths;
        private List<String> concerns;
        private String summary;

        public int getOverallScore() { return overallScore; }
        public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
        public int getSkillsMatchScore() { return skillsMatchScore; }
        public void setSkillsMatchScore(int skillsMatchScore) { this.skillsMatchScore = skillsMatchScore; }
        public int getExperienceMatchScore() { return experienceMatchScore; }
        public void setExperienceMatchScore(int experienceMatchScore) { this.experienceMatchScore = experienceMatchScore; }
        public List<String> getMatchedSkills() { return matchedSkills; }
        public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }
        public List<String> getMissingSkills() { return missingSkills; }
        public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }
        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> strengths) { this.strengths = strengths; }
        public List<String> getConcerns() { return concerns; }
        public void setConcerns(List<String> concerns) { this.concerns = concerns; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }

    public static class CvRankingRequest {
        private String jobId;
        private List<String> jobRequirements;

        public String getJobId() { return jobId; }
        public void setJobId(String jobId) { this.jobId = jobId; }
        public List<String> getJobRequirements() { return jobRequirements; }
        public void setJobRequirements(List<String> jobRequirements) { this.jobRequirements = jobRequirements; }
    }

    public static class CvRankingEntry {
        private String applicationId;
        private String candidateName;
        private int rank;
        private int overallScore;
        private String quickSummary;

        public String getApplicationId() { return applicationId; }
        public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
        public String getCandidateName() { return candidateName; }
        public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }
        public int getOverallScore() { return overallScore; }
        public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
        public String getQuickSummary() { return quickSummary; }
        public void setQuickSummary(String quickSummary) { this.quickSummary = quickSummary; }
    }

    public static class CvRankingResult {
        private List<CvRankingEntry> rankings;

        public List<CvRankingEntry> getRankings() { return rankings; }
        public void setRankings(List<CvRankingEntry> rankings) { this.rankings = rankings; }
    }
}
