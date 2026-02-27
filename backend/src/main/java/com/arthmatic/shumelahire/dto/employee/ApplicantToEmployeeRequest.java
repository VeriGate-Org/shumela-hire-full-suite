package com.arthmatic.shumelahire.dto.employee;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ApplicantToEmployeeRequest {

    @NotNull(message = "Applicant ID is required")
    private Long applicantId;

    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;

    private String department;
    private String jobTitle;
    private String jobGrade;
    private String employmentType;
    private Long reportingManagerId;
    private String location;
    private String site;
    private String costCentre;
    private LocalDate probationEndDate;
    private LocalDate contractEndDate;

    public ApplicantToEmployeeRequest() {}

    // Getters and Setters
    public Long getApplicantId() { return applicantId; }
    public void setApplicantId(Long applicantId) { this.applicantId = applicantId; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getJobGrade() { return jobGrade; }
    public void setJobGrade(String jobGrade) { this.jobGrade = jobGrade; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public Long getReportingManagerId() { return reportingManagerId; }
    public void setReportingManagerId(Long reportingManagerId) { this.reportingManagerId = reportingManagerId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getCostCentre() { return costCentre; }
    public void setCostCentre(String costCentre) { this.costCentre = costCentre; }

    public LocalDate getProbationEndDate() { return probationEndDate; }
    public void setProbationEndDate(LocalDate probationEndDate) { this.probationEndDate = probationEndDate; }

    public LocalDate getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(LocalDate contractEndDate) { this.contractEndDate = contractEndDate; }
}
