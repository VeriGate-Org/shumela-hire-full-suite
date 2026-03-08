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
                "Given the employee's current skills, career aspirations, and available training, design an optimal learning path. " +
                "Return JSON with: " +
                "pathTitle (string - name for this learning path), " +
                "overview (string - 2-3 sentence description of the learning journey), " +
                "estimatedDuration (string - total time e.g. '6 months'), " +
                "phases (array of objects with: phase (number), name (string), duration (string), " +
                "activities (array of objects with: title (string), type (string - e.g. Course, Workshop, Mentoring, Self-study, Project), " +
                "description (string), duration (string), priority (string - Essential, Recommended, Optional))), " +
                "milestones (array of strings - key checkpoints), " +
                "successMetrics (array of strings - how to measure progress). " +
                "Consider South African training providers, SETA requirements, and SAQA frameworks where relevant. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Create a personalised learning path for:\n");
        userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        if (request.getCareerAspiration() != null) {
            userPrompt.append("Career Aspiration: ").append(request.getCareerAspiration()).append("\n");
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

        if (request.getAvailableCourses() != null && !request.getAvailableCourses().isEmpty()) {
            userPrompt.append("\nAvailable Courses:\n");
            for (String course : request.getAvailableCourses()) {
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
            result.setOverview(response.getContent());
            return result;
        }
    }

    public TrainingRoiResult analyzeTrainingRoi(String userId, TrainingRoiRequest request) {
        String systemPrompt = "You are an HR analytics specialist analysing training return on investment. " +
                "Evaluate training programme effectiveness and provide ROI insights. " +
                "Return JSON with: " +
                "overallAssessment (string - 2-3 sentence summary), " +
                "estimatedRoi (string - e.g. '3.2x return'), " +
                "costEffectiveness (string - rating and explanation), " +
                "impactAreas (array of strings - areas where training had most impact), " +
                "underperformingPrograms (array of strings - programmes with low ROI), " +
                "recommendations (array of strings - how to improve training ROI), " +
                "benchmarkComparison (string - how this compares to industry standards). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse training ROI for:\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Period: ").append(request.getPeriod()).append("\n");
        userPrompt.append("Total Training Budget: R").append(request.getTotalBudget()).append("\n");
        userPrompt.append("Total Employees Trained: ").append(request.getEmployeesTrained()).append("\n");
        userPrompt.append("Total Training Hours: ").append(request.getTotalHours()).append("\n");

        if (request.getCompletionRate() > 0) {
            userPrompt.append("Completion Rate: ").append(request.getCompletionRate()).append("%\n");
        }

        if (request.getPerformanceImprovementPct() > 0) {
            userPrompt.append("Performance Improvement: ").append(request.getPerformanceImprovementPct()).append("%\n");
        }

        if (request.getProgrammes() != null && !request.getProgrammes().isEmpty()) {
            userPrompt.append("\nProgrammes:\n");
            for (String programme : request.getProgrammes()) {
                userPrompt.append("- ").append(programme).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "TRAINING_ROI",
                systemPrompt, userPrompt.toString(), 0.4, 1536);

        try {
            return objectMapper.readValue(response.getContent(), TrainingRoiResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse training ROI AI response", e);
            TrainingRoiResult result = new TrainingRoiResult();
            result.setOverallAssessment(response.getContent());
            return result;
        }
    }
}
