package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.InterviewQuestionDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class InterviewQuestionAiService {

    private static final Logger logger = LoggerFactory.getLogger(InterviewQuestionAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public InterviewQuestionAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public InterviewQuestionsResult generateQuestions(String userId, InterviewQuestionRequest request) {
        String systemPrompt = "You are an interview question generator for HR professionals. " +
                "Generate tailored interview questions based on the job requirements, interview type, and candidate profile. " +
                "Return JSON with: questions (array of objects, each with: question, category, expectedAnswer, difficulty). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Generate ").append(request.getQuestionCount()).append(" interview questions:\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Interview Type: ").append(request.getInterviewType()).append("\n");
        userPrompt.append("Level: ").append(request.getLevel()).append("\n");

        if (request.getJobRequirements() != null && !request.getJobRequirements().isEmpty()) {
            userPrompt.append("Job Requirements: ").append(String.join(", ", request.getJobRequirements())).append("\n");
        }
        if (request.getCandidateExperience() != null) {
            userPrompt.append("Candidate Experience: ").append(request.getCandidateExperience()).append("\n");
        }
        if (request.getCandidateSkills() != null && !request.getCandidateSkills().isEmpty()) {
            userPrompt.append("Candidate Skills: ").append(String.join(", ", request.getCandidateSkills())).append("\n");
        }

        AiCompletionResponse response = aiService.complete(userId, "INTERVIEW_QUESTION_GENERATE", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), InterviewQuestionsResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse interview questions AI response", e);
            return new InterviewQuestionsResult();
        }
    }
}
