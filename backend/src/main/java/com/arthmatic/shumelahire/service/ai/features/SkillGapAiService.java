package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.SkillGapAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SkillGapAiService {

    private static final Logger logger = LoggerFactory.getLogger(SkillGapAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public SkillGapAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public SkillGapAiResult analyzeGaps(String userId, SkillGapAiRequest request) {
        String systemPrompt = "You are an HR learning and development specialist analysing employee competency gaps. " +
                "Given the employee's competency gaps, provide a structured development plan. " +
                "Return JSON with: " +
                "overallAssessment (string - 2-3 sentence summary of the employee's gap profile), " +
                "priorityActions (array of strings - top 3-5 immediate actions ranked by impact), " +
                "suggestedLearningPath (array of objects with: order (number), competency (string), " +
                "activity (string - specific training/course/activity), method (string - e.g. classroom, online, mentoring, on-the-job), " +
                "duration (string - e.g. '2 weeks', '1 month'), rationale (string - why this activity and sequence)), " +
                "estimatedTimeframe (string - overall time to close gaps), " +
                "riskFactors (array of strings - risks if gaps are not addressed), " +
                "strengths (array of strings - existing strengths to leverage). " +
                "Focus on practical, actionable recommendations. Consider South African training providers and SAQA frameworks where relevant. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse skill gaps for:\n");
        if (request.getEmployeeName() != null) userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        if (request.getJobTitle() != null) userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        if (request.getDepartment() != null) userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("\nCompetency Gaps (scale 1-5):\n");

        if (request.getGaps() != null) {
            for (GapEntry gap : request.getGaps()) {
                userPrompt.append("- ").append(gap.getCompetencyName());
                if (gap.getCategory() != null) userPrompt.append(" (").append(gap.getCategory()).append(")");
                userPrompt.append(": Current=").append(gap.getCurrentLevel())
                        .append(", Target=").append(gap.getTargetLevel())
                        .append(", Gap=").append(gap.getTargetLevel() - gap.getCurrentLevel())
                        .append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "SKILL_GAP_ANALYSIS",
                systemPrompt, userPrompt.toString(), 0.5, 2048);

        try {
            return objectMapper.readValue(response.getContent(), SkillGapAiResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse skill gap AI response", e);
            SkillGapAiResult result = new SkillGapAiResult();
            result.setOverallAssessment(response.getContent());
            return result;
        }
    }
}
