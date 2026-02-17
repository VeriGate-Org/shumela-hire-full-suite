package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.CvScreeningDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CvScreeningAiService {

    private static final Logger logger = LoggerFactory.getLogger(CvScreeningAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public CvScreeningAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public CvScreeningResult screenCandidate(String userId, String applicationId, List<String> jobRequirements,
                                              String candidateName, String resumeText) {
        String systemPrompt = "You are an HR CV screening specialist. Analyse the candidate's resume against the job requirements. " +
                "Return JSON with: overallScore (0-100), skillsMatchScore (0-100), experienceMatchScore (0-100), " +
                "matchedSkills (array of strings), missingSkills (array of strings), " +
                "strengths (array of strings), concerns (array of strings), summary (string). " +
                "Be objective and evidence-based. Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Screen this candidate:\n");
        userPrompt.append("Application ID: ").append(applicationId).append("\n");
        userPrompt.append("Candidate: ").append(candidateName).append("\n\n");
        userPrompt.append("Job Requirements:\n");
        if (jobRequirements != null) {
            for (String req : jobRequirements) {
                userPrompt.append("- ").append(req).append("\n");
            }
        }
        userPrompt.append("\nResume/CV Content:\n").append(resumeText != null ? resumeText : "No resume text available");

        AiCompletionResponse response = aiService.complete(userId, "CV_SCREENING", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), CvScreeningResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse CV screening AI response", e);
            CvScreeningResult result = new CvScreeningResult();
            result.setSummary(response.getContent());
            result.setOverallScore(0);
            return result;
        }
    }

    public CvRankingResult rankCandidates(String userId, String jobId, List<String> jobRequirements,
                                           List<String> candidateSummaries) {
        String systemPrompt = "You are an HR candidate ranking specialist. Rank candidates based on their fit for the job requirements. " +
                "Return JSON with: rankings (array of objects with: applicationId, candidateName, rank, overallScore 0-100, quickSummary). " +
                "Rank from best to worst fit. Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Rank candidates for job ").append(jobId).append(":\n\n");
        userPrompt.append("Job Requirements:\n");
        if (jobRequirements != null) {
            for (String req : jobRequirements) {
                userPrompt.append("- ").append(req).append("\n");
            }
        }
        userPrompt.append("\nCandidates:\n");
        if (candidateSummaries != null) {
            for (String summary : candidateSummaries) {
                userPrompt.append(summary).append("\n---\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "CV_RANKING", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), CvRankingResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse CV ranking AI response", e);
            return new CvRankingResult();
        }
    }
}
