package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.TrainingPathAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class TrainingPathAiService {

    private static final Logger logger = LoggerFactory.getLogger(TrainingPathAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public TrainingPathAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public LearningPathResult generateLearningPath(String userId, LearningPathRequest request) {
        String systemPrompt = "You are a learning and development specialist creating personalised learning paths. " +
                "Given the employee's current skills, career goal, and skill gaps, design an optimal learning path. " +
                "Return JSON with: " +
                "summary (string - 2-3 sentence description of the learning journey), " +
                "estimatedDuration (string - total time e.g. '6 months'), " +
                "phases (array of objects with: phase (number), name (string), duration (string), " +
                "activities (array of objects with: activity (string), type (string - e.g. Course, Workshop, Mentoring, Self-study, Project), " +
                "provider (string - suggested provider), duration (string), skillAddressed (string)), " +
                "milestone (string - key checkpoint for this phase)), " +
                "certificationRecommendations (array of strings - relevant certifications to pursue), " +
                "mentorshipSuggestions (array of strings - mentoring recommendations), " +
                "readinessAssessment (string - assessment of readiness for target role). " +
                "Consider South African training providers, SETA requirements, and SAQA frameworks where relevant. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Create a personalised learning path for:\n");
        userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        userPrompt.append("Current Role: ").append(request.getCurrentRole()).append("\n");
        if (request.getTargetRole() != null) {
            userPrompt.append("Target Role: ").append(request.getTargetRole()).append("\n");
        }
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        if (request.getCareerGoal() != null) {
            userPrompt.append("Career Goal: ").append(request.getCareerGoal()).append("\n");
        }

        if (request.getCurrentSkills() != null && !request.getCurrentSkills().isEmpty()) {
            userPrompt.append("\nCurrent Skills:\n");
            for (String skill : request.getCurrentSkills()) {
                userPrompt.append("- ").append(skill).append("\n");
            }
        }

        if (request.getSkillGaps() != null && !request.getSkillGaps().isEmpty()) {
            userPrompt.append("\nSkill Gaps:\n");
            for (String gap : request.getSkillGaps()) {
                userPrompt.append("- ").append(gap).append("\n");
            }
        }

        if (request.getCompletedCourses() != null && !request.getCompletedCourses().isEmpty()) {
            userPrompt.append("\nCompleted Courses:\n");
            for (String course : request.getCompletedCourses()) {
                userPrompt.append("- ").append(course).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "LEARNING_PATH",
                systemPrompt, userPrompt.toString(), 0.6, 2048);

        try {
            return objectMapper.readValue(response.getContent(), LearningPathResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse learning path AI response", e);
            LearningPathResult result = new LearningPathResult();
            result.setSummary(response.getContent());
            return result;
        }
    }

    public TrainingRoiResult analyzeTrainingRoi(String userId, TrainingRoiRequest request) {
        String systemPrompt = "You are an HR analytics specialist analysing training return on investment. " +
                "Evaluate training programme effectiveness and provide ROI insights. " +
                "Return JSON with: " +
                "roiSummary (string - 2-3 sentence summary), " +
                "estimatedRoiPercentage (number - estimated ROI percentage), " +
                "keyFindings (array of strings - key findings from the analysis), " +
                "recommendations (array of strings - how to improve training ROI), " +
                "effectivenessRating (string - e.g. 'Highly Effective', 'Effective', 'Needs Improvement'). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse training ROI for:\n");
        userPrompt.append("Course: ").append(request.getCourseName()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Enrollment: ").append(request.getEnrollmentCount()).append("\n");
        userPrompt.append("Completions: ").append(request.getCompletionCount()).append("\n");
        userPrompt.append("Total Cost: R").append(request.getTotalCost()).append("\n");

        if (request.getPreTrainingMetrics() != null && !request.getPreTrainingMetrics().isEmpty()) {
            userPrompt.append("\nPre-Training Metrics:\n");
            for (String metric : request.getPreTrainingMetrics()) {
                userPrompt.append("- ").append(metric).append("\n");
            }
        }

        if (request.getPostTrainingMetrics() != null && !request.getPostTrainingMetrics().isEmpty()) {
            userPrompt.append("\nPost-Training Metrics:\n");
            for (String metric : request.getPostTrainingMetrics()) {
                userPrompt.append("- ").append(metric).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "TRAINING_ROI",
                systemPrompt, userPrompt.toString(), 0.4, 1536);

        try {
            return objectMapper.readValue(response.getContent(), TrainingRoiResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse training ROI AI response", e);
            TrainingRoiResult result = new TrainingRoiResult();
            result.setRoiSummary(response.getContent());
            return result;
        }
    }
}
