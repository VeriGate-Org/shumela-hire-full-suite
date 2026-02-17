package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.SmartSearchDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;

@Service
public class SmartSearchAiService {

    private static final Logger logger = LoggerFactory.getLogger(SmartSearchAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public SmartSearchAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public SmartSearchResult search(String userId, String naturalLanguageQuery) {
        String systemPrompt = "You are a search query interpreter for a recruitment system. " +
                "Convert the natural language query into structured search filters. " +
                "Return JSON with: interpretedQuery (string — human-readable interpretation), " +
                "parsedFilters (object with keys like: skills, dateRange, status, department, location, jobTitle, experienceLevel), " +
                "results (empty array — results will be populated by the system), " +
                "totalResults (0 — will be populated by the system). " +
                "Return ONLY valid JSON, no markdown.";

        AiCompletionResponse response = aiService.complete(userId, "SMART_SEARCH", systemPrompt, naturalLanguageQuery);

        try {
            return objectMapper.readValue(response.getContent(), SmartSearchResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse smart search AI response", e);
            SmartSearchResult result = new SmartSearchResult();
            result.setInterpretedQuery(naturalLanguageQuery);
            result.setParsedFilters(new HashMap<>());
            result.setResults(Collections.emptyList());
            result.setTotalResults(0);
            return result;
        }
    }
}
