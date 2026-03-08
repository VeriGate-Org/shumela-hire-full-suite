package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.HrGeneralAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HrGeneralAiService {

    private static final Logger logger = LoggerFactory.getLogger(HrGeneralAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public HrGeneralAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public CaseAnalysisResult analyzeCase(String userId, CaseAnalysisRequest request) {
        String systemPrompt = "You are a South African labour relations specialist analysing workplace cases. " +
                "Provide guidance aligned with South African labour law (LRA, BCEA, EEA). " +
                "Return JSON with: " +
                "summary (string - concise case summary and assessment), " +
                "recommendedSteps (array of strings - ordered procedural steps to follow), " +
                "legalConsiderations (array of strings - relevant legal requirements and risks), " +
                "riskAssessment (string - overall risk level and explanation), " +
                "documentationRequired (array of strings - documents to prepare/collect), " +
                "suggestedResolution (string - recommended resolution approach). " +
                "Always emphasise procedural fairness and substantive fairness requirements. " +
                "Reference CCMA guidelines where applicable. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse labour relations case:\n");
        userPrompt.append("Case Type: ").append(request.getCaseType()).append("\n");
        userPrompt.append("Severity: ").append(request.getSeverity()).append("\n");
        userPrompt.append("Employee Role: ").append(request.getEmployeeRole()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Description: ").append(request.getDescription()).append("\n");

        if (request.getPreviousActions() != null && !request.getPreviousActions().isEmpty()) {
            userPrompt.append("\nPrevious Actions Taken:\n");
            for (String action : request.getPreviousActions()) {
                userPrompt.append("- ").append(action).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "CASE_ANALYSIS",
                systemPrompt, userPrompt.toString(), 0.3, 2048);

        try {
            return objectMapper.readValue(response.getContent(), CaseAnalysisResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse case analysis AI response", e);
            CaseAnalysisResult result = new CaseAnalysisResult();
            result.setSummary(response.getContent());
            return result;
        }
    }

    public OnboardingPlanResult generateOnboardingPlan(String userId, OnboardingPlanRequest request) {
        String systemPrompt = "You are an HR onboarding specialist creating personalised onboarding plans. " +
                "Design a structured, week-by-week onboarding programme. " +
                "Return JSON with: " +
                "welcomeMessage (string - personalised welcome message), " +
                "weeklyPlan (array of objects with: week (number), theme (string - e.g. 'Orientation', 'Role Immersion'), " +
                "tasks (array of strings - specific tasks for that week)), " +
                "requiredTraining (array of strings - mandatory training courses), " +
                "keyMeetings (array of strings - important meetings to schedule), " +
                "successMetrics (array of strings - how to measure onboarding success at 30/60/90 days). " +
                "Plan should cover 4-6 weeks. Consider South African workplace context. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Create onboarding plan for:\n");
        userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Start Date: ").append(request.getStartDate()).append("\n");
        userPrompt.append("Experience Level: ").append(request.getExperienceLevel()).append("\n");

        if (request.getRequiredCertifications() != null && !request.getRequiredCertifications().isEmpty()) {
            userPrompt.append("\nRequired Certifications:\n");
            for (String cert : request.getRequiredCertifications()) {
                userPrompt.append("- ").append(cert).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "ONBOARDING_PLAN",
                systemPrompt, userPrompt.toString(), 0.6, 2048);

        try {
            return objectMapper.readValue(response.getContent(), OnboardingPlanResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse onboarding plan AI response", e);
            OnboardingPlanResult result = new OnboardingPlanResult();
            result.setWelcomeMessage(response.getContent());
            return result;
        }
    }

    public PayrollAnomalyResult detectPayrollAnomalies(String userId, PayrollAnomalyRequest request) {
        String systemPrompt = "You are an HR payroll analytics specialist detecting payroll anomalies and discrepancies. " +
                "Analyse payroll data for irregularities, errors, and potential issues. " +
                "Return JSON with: " +
                "summary (string - 2-3 sentence overview of payroll health), " +
                "flags (array of objects with: employeeName (string), flagType (string - e.g. Overpayment, " +
                "Underpayment, Unusual Overtime, Deduction Error, Sudden Change), " +
                "severity (string - LOW, MEDIUM, HIGH, CRITICAL), " +
                "description (string - specific details of the anomaly)), " +
                "recommendations (array of strings - overall recommendations). " +
                "Consider South African tax (SARS PAYE) and UIF deduction rules. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Detect payroll anomalies:\n");
        userPrompt.append("Period: ").append(request.getPeriod()).append("\n");
        userPrompt.append("Total Employees: ").append(request.getTotalEmployees()).append("\n");

        if (request.getEntries() != null && !request.getEntries().isEmpty()) {
            userPrompt.append("\nPayroll Entries:\n");
            for (PayrollEntry entry : request.getEntries()) {
                userPrompt.append("- ").append(entry.getEmployeeName())
                        .append(" | Gross: R").append(entry.getGrossPay())
                        .append(" | Net: R").append(entry.getNetPay())
                        .append(" | Prev Gross: R").append(entry.getPreviousGrossPay())
                        .append(" | OT: R").append(entry.getOvertimePay())
                        .append(" | Deductions: R").append(entry.getDeductions());
                if (entry.getAnomalyNotes() != null) {
                    userPrompt.append(" | Notes: ").append(entry.getAnomalyNotes());
                }
                userPrompt.append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "PAYROLL_ANOMALY",
                systemPrompt, userPrompt.toString(), 0.3, 2048);

        try {
            return objectMapper.readValue(response.getContent(), PayrollAnomalyResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse payroll anomaly AI response", e);
            PayrollAnomalyResult result = new PayrollAnomalyResult();
            result.setSummary(response.getContent());
            return result;
        }
    }
}
