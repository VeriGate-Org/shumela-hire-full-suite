package com.arthmatic.talentgate.dto.ai;

import java.util.List;

public class OfferPredictionDto {

    public static class OfferPredictionRequest {
        private String applicationId;
        private double proposedSalary;
        private List<String> additionalBenefits;

        public String getApplicationId() { return applicationId; }
        public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
        public double getProposedSalary() { return proposedSalary; }
        public void setProposedSalary(double proposedSalary) { this.proposedSalary = proposedSalary; }
        public List<String> getAdditionalBenefits() { return additionalBenefits; }
        public void setAdditionalBenefits(List<String> additionalBenefits) { this.additionalBenefits = additionalBenefits; }
    }

    public static class OfferPredictionResult {
        private int acceptanceProbability;
        private String riskLevel;
        private List<String> positiveFactors;
        private List<String> riskFactors;
        private List<String> recommendations;

        public int getAcceptanceProbability() { return acceptanceProbability; }
        public void setAcceptanceProbability(int acceptanceProbability) { this.acceptanceProbability = acceptanceProbability; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public List<String> getPositiveFactors() { return positiveFactors; }
        public void setPositiveFactors(List<String> positiveFactors) { this.positiveFactors = positiveFactors; }
        public List<String> getRiskFactors() { return riskFactors; }
        public void setRiskFactors(List<String> riskFactors) { this.riskFactors = riskFactors; }
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    }
}
