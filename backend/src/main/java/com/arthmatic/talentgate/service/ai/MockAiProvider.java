package com.arthmatic.talentgate.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean({ClaudeAiProvider.class, OpenAiProvider.class})
public class MockAiProvider implements AiProvider {

    private static final Logger logger = LoggerFactory.getLogger(MockAiProvider.class);

    @Override
    public AiCompletionResponse complete(AiCompletionRequest request) {
        logger.info("Mock AI provider generating response for prompt: {}...",
                request.getUserPrompt().substring(0, Math.min(80, request.getUserPrompt().length())));

        String systemPrompt = request.getSystemPrompt() != null ? request.getSystemPrompt().toLowerCase() : "";
        String content = generateMockResponse(systemPrompt, request.getUserPrompt());

        return new AiCompletionResponse(content, "mock-v1", estimateTokens(request.getUserPrompt()), estimateTokens(content), "mock");
    }

    private String generateMockResponse(String systemPrompt, String userPrompt) {
        if (systemPrompt.contains("job description")) {
            return "{\"title\":\"Senior Software Engineer\",\"intro\":\"We are seeking a talented Senior Software Engineer to join our growing team.\",\"responsibilities\":[\"Design and implement scalable software solutions\",\"Collaborate with cross-functional teams to define requirements\",\"Mentor junior developers and conduct code reviews\",\"Participate in architectural decisions and technical planning\"],\"requirements\":[\"5+ years of professional software development experience\",\"Strong proficiency in Java or similar languages\",\"Experience with cloud platforms (AWS, Azure, or GCP)\",\"Excellent communication and collaboration skills\"],\"benefits\":[\"Competitive salary and equity package\",\"Flexible working arrangements\",\"Professional development budget\",\"Comprehensive health benefits\"],\"biasWarnings\":[]}";
        }
        if (systemPrompt.contains("bias")) {
            return "{\"biasWarnings\":[],\"overallAssessment\":\"No significant bias detected in the provided text.\"}";
        }
        if (systemPrompt.contains("screening notes")) {
            return "{\"draftNotes\":\"Candidate demonstrates strong alignment with role requirements. Key observations: solid technical background with relevant industry experience. Communication skills appear above average based on initial interaction. Recommended for next stage of evaluation.\"}";
        }
        if (systemPrompt.contains("email")) {
            return "{\"subject\":\"Regarding Your Application — Senior Software Engineer\",\"body\":\"Dear Candidate,\\n\\nThank you for your interest in the Senior Software Engineer position at our organisation.\\n\\nWe have reviewed your application and would like to discuss next steps with you.\\n\\nPlease let us know your availability for a brief conversation this week.\\n\\nKind regards,\\nThe Hiring Team\"}";
        }
        if (systemPrompt.contains("interview question")) {
            return "{\"questions\":[{\"question\":\"Describe a technically challenging project you led and the architectural decisions you made.\",\"category\":\"Technical\",\"expectedAnswer\":\"Look for clear problem decomposition, trade-off analysis, and measurable outcomes.\",\"difficulty\":\"SENIOR\"},{\"question\":\"How do you approach mentoring junior team members while maintaining your own productivity?\",\"category\":\"Leadership\",\"expectedAnswer\":\"Look for structured mentoring approaches, delegation skills, and time management.\",\"difficulty\":\"SENIOR\"},{\"question\":\"Walk me through how you would design a system to handle 10x traffic growth.\",\"category\":\"System Design\",\"expectedAnswer\":\"Look for scalability patterns: caching, load balancing, database sharding, async processing.\",\"difficulty\":\"SENIOR\"}]}";
        }
        if (systemPrompt.contains("cv screening") || systemPrompt.contains("resume screening")) {
            return "{\"overallScore\":78,\"skillsMatchScore\":82,\"experienceMatchScore\":75,\"matchedSkills\":[\"Java\",\"Spring Boot\",\"REST APIs\",\"SQL\"],\"missingSkills\":[\"Kubernetes\",\"GraphQL\"],\"strengths\":[\"Strong backend development experience\",\"Relevant industry background\"],\"concerns\":[\"Limited cloud infrastructure experience\"],\"summary\":\"Solid candidate with strong core technical skills. Minor gaps in cloud-native technologies that could be addressed through on-the-job training.\"}";
        }
        if (systemPrompt.contains("rank candidates") || systemPrompt.contains("ranking")) {
            return "{\"rankings\":[{\"applicationId\":\"1\",\"candidateName\":\"Mock Candidate A\",\"rank\":1,\"overallScore\":85,\"quickSummary\":\"Excellent match across all criteria\"},{\"applicationId\":\"2\",\"candidateName\":\"Mock Candidate B\",\"rank\":2,\"overallScore\":72,\"quickSummary\":\"Strong technical skills, less industry experience\"}]}";
        }
        if (systemPrompt.contains("candidate summary") || systemPrompt.contains("summarize candidate")) {
            return "{\"executiveSummary\":\"Experienced professional with a strong track record in software engineering and team leadership.\",\"educationSummary\":\"BSc Computer Science from a recognised institution.\",\"experienceSummary\":\"8 years of progressive experience in software development roles.\",\"keyStrengths\":[\"Technical leadership\",\"Problem solving\",\"Cross-functional collaboration\"],\"potentialGaps\":[\"Limited exposure to the specific industry vertical\"],\"fitAssessment\":\"Strong overall fit for the role with minor development areas.\"}";
        }
        if (systemPrompt.contains("duplicate")) {
            return "{\"duplicates\":[],\"message\":\"No duplicate candidates detected.\"}";
        }
        if (systemPrompt.contains("salary") || systemPrompt.contains("benchmark")) {
            return "{\"suggestedMin\":650000,\"suggestedMax\":850000,\"suggestedTarget\":750000,\"currency\":\"ZAR\",\"justification\":\"Based on market data for similar roles in the region, accounting for experience level and industry standards.\",\"marketFactors\":[\"High demand for this skill set\",\"Regional cost of living adjustments\",\"Industry-standard compensation ranges\"],\"dataPointsUsed\":12}";
        }
        if (systemPrompt.contains("offer") || systemPrompt.contains("acceptance")) {
            return "{\"acceptanceProbability\":72,\"riskLevel\":\"MEDIUM\",\"positiveFactors\":[\"Competitive salary offer\",\"Strong employer brand\",\"Role alignment with career goals\"],\"riskFactors\":[\"Extended hiring timeline\",\"Candidate has competing offers\"],\"recommendations\":[\"Consider expediting the offer process\",\"Highlight unique benefits and growth opportunities\"]}";
        }
        if (systemPrompt.contains("report") || systemPrompt.contains("narrative")) {
            return "{\"executiveSummary\":\"The recruitment process for this vacancy has progressed according to plan with strong candidate engagement.\",\"keyFindings\":[\"Application volume exceeded expectations by 20%\",\"Average time-to-shortlist was 5 business days\",\"Diversity metrics are tracking above target\"],\"recommendations\":[\"Consider expanding sourcing channels for future similar roles\",\"Streamline the technical assessment stage to reduce candidate drop-off\"]}";
        }
        if (systemPrompt.contains("search") || systemPrompt.contains("query")) {
            return "{\"interpretedQuery\":\"Find candidates with Java experience applied in the last 30 days\",\"filters\":{\"skills\":[\"Java\"],\"dateRange\":\"LAST_30_DAYS\",\"status\":\"ACTIVE\"}}";
        }
        return "{\"content\":\"This is a mock AI response. Configure a real AI provider (claude or openai) for production use.\"}";
    }

    private int estimateTokens(String text) {
        return text != null ? text.length() / 4 : 0;
    }

    @Override
    public String getProviderName() {
        return "mock";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }
}
