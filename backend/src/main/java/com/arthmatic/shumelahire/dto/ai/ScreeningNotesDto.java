package com.arthmatic.shumelahire.dto.ai;

import java.util.List;

public class ScreeningNotesDto {

    public static class ScreeningNotesRequest {
        private String applicationId;
        private String candidateName;
        private String jobTitle;
        private List<String> bulletPoints;
        private String tone;

        public String getApplicationId() { return applicationId; }
        public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
        public String getCandidateName() { return candidateName; }
        public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public List<String> getBulletPoints() { return bulletPoints; }
        public void setBulletPoints(List<String> bulletPoints) { this.bulletPoints = bulletPoints; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
    }

    public static class ScreeningNotesResult {
        private String draftNotes;

        public String getDraftNotes() { return draftNotes; }
        public void setDraftNotes(String draftNotes) { this.draftNotes = draftNotes; }
    }
}
