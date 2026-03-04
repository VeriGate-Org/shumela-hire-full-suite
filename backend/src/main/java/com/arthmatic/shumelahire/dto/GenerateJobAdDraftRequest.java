package com.arthmatic.shumelahire.dto;

import java.util.Map;

public class GenerateJobAdDraftRequest {

    private GenerateAdRequestData request;
    private RequisitionDataDto requisitionData;

    public GenerateAdRequestData getRequest() { return request; }
    public void setRequest(GenerateAdRequestData request) { this.request = request; }

    public RequisitionDataDto getRequisitionData() { return requisitionData; }
    public void setRequisitionData(RequisitionDataDto requisitionData) { this.requisitionData = requisitionData; }

    public static class GenerateAdRequestData {
        private String templateId;
        private String requisitionId;
        private Map<String, String> customData;

        public String getTemplateId() { return templateId; }
        public void setTemplateId(String templateId) { this.templateId = templateId; }

        public String getRequisitionId() { return requisitionId; }
        public void setRequisitionId(String requisitionId) { this.requisitionId = requisitionId; }

        public Map<String, String> getCustomData() { return customData; }
        public void setCustomData(Map<String, String> customData) { this.customData = customData; }
    }

    public static class RequisitionDataDto {
        private String id;
        private String jobTitle;
        private String department;
        private String location;
        private String employmentType;
        private Double salaryMin;
        private Double salaryMax;
        private String description;
        private String createdBy;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getEmploymentType() { return employmentType; }
        public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

        public Double getSalaryMin() { return salaryMin; }
        public void setSalaryMin(Double salaryMin) { this.salaryMin = salaryMin; }

        public Double getSalaryMax() { return salaryMax; }
        public void setSalaryMax(Double salaryMax) { this.salaryMax = salaryMax; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    }
}
