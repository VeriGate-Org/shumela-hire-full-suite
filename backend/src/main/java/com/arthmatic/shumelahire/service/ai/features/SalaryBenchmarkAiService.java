package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.SalaryBenchmarkDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SalaryBenchmarkAiService {

    private static final Logger logger = LoggerFactory.getLogger(SalaryBenchmarkAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public SalaryBenchmarkAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public SalaryBenchmarkResult benchmark(String userId, SalaryBenchmarkRequest request) {
        String systemPrompt = "You are a salary benchmarking specialist for the South African market. " +
                "Analyse the position details and provide a salary recommendation. " +
                "Return JSON with: suggestedMin (number), suggestedMax (number), suggestedTarget (number), " +
                "currency (string, default ZAR), justification (string), " +
                "marketFactors (array of strings), dataPointsUsed (number). " +
                "Base recommendations on South African market data. Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Benchmark salary for:\n");
        userPrompt.append("Position: ").append(request.getPositionTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        if (request.getJobGrade() != null) userPrompt.append("Grade: ").append(request.getJobGrade()).append("\n");
        userPrompt.append("Level: ").append(request.getLevel()).append("\n");
        userPrompt.append("Location: ").append(request.getLocation()).append("\n");
        if (request.getCandidateCurrentSalary() != null) {
            userPrompt.append("Candidate Current Salary: R").append(String.format("%.0f", request.getCandidateCurrentSalary())).append("\n");
        }
        if (request.getCandidateExpectedSalary() != null) {
            userPrompt.append("Candidate Expected Salary: R").append(String.format("%.0f", request.getCandidateExpectedSalary())).append("\n");
        }

        AiCompletionResponse response = aiService.complete(userId, "SALARY_BENCHMARK", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), SalaryBenchmarkResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse salary benchmark AI response", e);
            SalaryBenchmarkResult result = new SalaryBenchmarkResult();
            result.setJustification(response.getContent());
            return result;
        }
    }
}
