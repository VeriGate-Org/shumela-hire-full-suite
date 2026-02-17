package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class SalaryRecommendationProvideRequest {

    @NotNull(message = "Recommended salary is required")
    private BigDecimal recommendedSalary;

    private String recommendationJustification;
    private String bonusRecommendation;
    private String equityRecommendation;
    private String benefitsNotes;

    public SalaryRecommendationProvideRequest() {}

    public BigDecimal getRecommendedSalary() { return recommendedSalary; }
    public void setRecommendedSalary(BigDecimal recommendedSalary) { this.recommendedSalary = recommendedSalary; }

    public String getRecommendationJustification() { return recommendationJustification; }
    public void setRecommendationJustification(String recommendationJustification) { this.recommendationJustification = recommendationJustification; }

    public String getBonusRecommendation() { return bonusRecommendation; }
    public void setBonusRecommendation(String bonusRecommendation) { this.bonusRecommendation = bonusRecommendation; }

    public String getEquityRecommendation() { return equityRecommendation; }
    public void setEquityRecommendation(String equityRecommendation) { this.equityRecommendation = equityRecommendation; }

    public String getBenefitsNotes() { return benefitsNotes; }
    public void setBenefitsNotes(String benefitsNotes) { this.benefitsNotes = benefitsNotes; }
}
