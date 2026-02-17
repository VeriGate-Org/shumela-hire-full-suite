package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class JobDescriptionDto {

    public static class JobDescriptionRequest {
        private String title;
        private String department;
        private String level;
        private String employmentType;
        private String location;
        private List<String> keyResponsibilities;
        private List<String> keyRequirements;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getEmploymentType() { return employmentType; }
        public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public List<String> getKeyResponsibilities() { return keyResponsibilities; }
        public void setKeyResponsibilities(List<String> keyResponsibilities) { this.keyResponsibilities = keyResponsibilities; }
        public List<String> getKeyRequirements() { return keyRequirements; }
        public void setKeyRequirements(List<String> keyRequirements) { this.keyRequirements = keyRequirements; }
    }

    public static class BiasCheckRequest {
        private String text;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public static class JobDescriptionResult {
        private String title;
        private String intro;
        private List<String> responsibilities;
        private List<String> requirements;
        private List<String> benefits;
        private List<String> biasWarnings;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getIntro() { return intro; }
        public void setIntro(String intro) { this.intro = intro; }
        public List<String> getResponsibilities() { return responsibilities; }
        public void setResponsibilities(List<String> responsibilities) { this.responsibilities = responsibilities; }
        public List<String> getRequirements() { return requirements; }
        public void setRequirements(List<String> requirements) { this.requirements = requirements; }
        public List<String> getBenefits() { return benefits; }
        public void setBenefits(List<String> benefits) { this.benefits = benefits; }
        public List<String> getBiasWarnings() { return biasWarnings; }
        public void setBiasWarnings(List<String> biasWarnings) { this.biasWarnings = biasWarnings; }
    }

    public static class BiasCheckResult {
        private List<String> biasWarnings;
        private String overallAssessment;

        public List<String> getBiasWarnings() { return biasWarnings; }
        public void setBiasWarnings(List<String> biasWarnings) { this.biasWarnings = biasWarnings; }
        public String getOverallAssessment() { return overallAssessment; }
        public void setOverallAssessment(String overallAssessment) { this.overallAssessment = overallAssessment; }
    }
}
