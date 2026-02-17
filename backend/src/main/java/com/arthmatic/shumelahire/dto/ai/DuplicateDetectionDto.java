package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class DuplicateDetectionDto {

    public static class DuplicateCheckRequest {
        private String fullName;
        private String email;
        private String phone;
        private String idNumber;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getIdNumber() { return idNumber; }
        public void setIdNumber(String idNumber) { this.idNumber = idNumber; }
    }

    public static class DuplicateCandidate {
        private String applicantId;
        private String fullName;
        private String email;
        private int confidenceScore;
        private String matchReason;

        public String getApplicantId() { return applicantId; }
        public void setApplicantId(String applicantId) { this.applicantId = applicantId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public int getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(int confidenceScore) { this.confidenceScore = confidenceScore; }
        public String getMatchReason() { return matchReason; }
        public void setMatchReason(String matchReason) { this.matchReason = matchReason; }
    }

    public static class DuplicateCheckResult {
        private List<DuplicateCandidate> duplicates;
        private String message;

        public List<DuplicateCandidate> getDuplicates() { return duplicates; }
        public void setDuplicates(List<DuplicateCandidate> duplicates) { this.duplicates = duplicates; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
