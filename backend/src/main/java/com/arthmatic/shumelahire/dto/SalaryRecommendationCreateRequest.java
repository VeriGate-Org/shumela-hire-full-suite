package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class SalaryRecommendationCreateRequest {

    @NotBlank(message = "Position title is required")
    private String positionTitle;

    private String department;
    private String jobGrade;
    private String positionLevel;
    private String candidateName;
    private BigDecimal candidateCurrentSalary;
    private BigDecimal candidateExpectedSalary;
    private String marketDataReference;
    private BigDecimal proposedMinSalary;
    private BigDecimal proposedMaxSalary;
    private BigDecimal proposedTargetSalary;
    private String applicationId;

    public SalaryRecommendationCreateRequest() {}

    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobGrade() { return jobGrade; }
    public void setJobGrade(String jobGrade) { this.jobGrade = jobGrade; }

    public String getPositionLevel() { return positionLevel; }
    public void setPositionLevel(String positionLevel) { this.positionLevel = positionLevel; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public BigDecimal getCandidateCurrentSalary() { return candidateCurrentSalary; }
    public void setCandidateCurrentSalary(BigDecimal candidateCurrentSalary) { this.candidateCurrentSalary = candidateCurrentSalary; }

    public BigDecimal getCandidateExpectedSalary() { return candidateExpectedSalary; }
    public void setCandidateExpectedSalary(BigDecimal candidateExpectedSalary) { this.candidateExpectedSalary = candidateExpectedSalary; }

    public String getMarketDataReference() { return marketDataReference; }
    public void setMarketDataReference(String marketDataReference) { this.marketDataReference = marketDataReference; }

    public BigDecimal getProposedMinSalary() { return proposedMinSalary; }
    public void setProposedMinSalary(BigDecimal proposedMinSalary) { this.proposedMinSalary = proposedMinSalary; }

    public BigDecimal getProposedMaxSalary() { return proposedMaxSalary; }
    public void setProposedMaxSalary(BigDecimal proposedMaxSalary) { this.proposedMaxSalary = proposedMaxSalary; }

    public BigDecimal getProposedTargetSalary() { return proposedTargetSalary; }
    public void setProposedTargetSalary(BigDecimal proposedTargetSalary) { this.proposedTargetSalary = proposedTargetSalary; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
}
