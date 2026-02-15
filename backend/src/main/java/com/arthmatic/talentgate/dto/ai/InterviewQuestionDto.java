package com.arthmatic.talentgate.dto.ai;

import java.util.List;

public class InterviewQuestionDto {

    public static class InterviewQuestionRequest {
        private String jobTitle;
        private List<String> jobRequirements;
        private String interviewType;
        private String candidateExperience;
        private List<String> candidateSkills;
        private int questionCount;
        private String level;

        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public List<String> getJobRequirements() { return jobRequirements; }
        public void setJobRequirements(List<String> jobRequirements) { this.jobRequirements = jobRequirements; }
        public String getInterviewType() { return interviewType; }
        public void setInterviewType(String interviewType) { this.interviewType = interviewType; }
        public String getCandidateExperience() { return candidateExperience; }
        public void setCandidateExperience(String candidateExperience) { this.candidateExperience = candidateExperience; }
        public List<String> getCandidateSkills() { return candidateSkills; }
        public void setCandidateSkills(List<String> candidateSkills) { this.candidateSkills = candidateSkills; }
        public int getQuestionCount() { return questionCount; }
        public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
    }

    public static class GeneratedQuestion {
        private String question;
        private String category;
        private String expectedAnswer;
        private String difficulty;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getExpectedAnswer() { return expectedAnswer; }
        public void setExpectedAnswer(String expectedAnswer) { this.expectedAnswer = expectedAnswer; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    }

    public static class InterviewQuestionsResult {
        private List<GeneratedQuestion> questions;

        public List<GeneratedQuestion> getQuestions() { return questions; }
        public void setQuestions(List<GeneratedQuestion> questions) { this.questions = questions; }
    }
}
