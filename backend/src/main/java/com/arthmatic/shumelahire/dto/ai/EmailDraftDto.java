package com.arthmatic.shumelahire.dto.ai;

import java.util.Map;

public class EmailDraftDto {

    public static class EmailDraftRequest {
        private String emailType;
        private String candidateName;
        private String jobTitle;
        private Map<String, String> context;
        private String tone;

        public String getEmailType() { return emailType; }
        public void setEmailType(String emailType) { this.emailType = emailType; }
        public String getCandidateName() { return candidateName; }
        public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public Map<String, String> getContext() { return context; }
        public void setContext(Map<String, String> context) { this.context = context; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
    }

    public static class EmailDraftResult {
        private String subject;
        private String body;

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
    }
}
