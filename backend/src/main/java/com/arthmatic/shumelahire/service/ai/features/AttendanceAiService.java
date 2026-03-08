package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.AttendanceAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AttendanceAiService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public AttendanceAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public AnomalyDetectionResult detectAnomalies(String userId, AnomalyDetectionRequest request) {
        String systemPrompt = "You are an HR attendance analytics specialist detecting anomalies in attendance data. " +
                "Identify patterns of concern, potential fatigue issues, and policy violations. " +
                "Return JSON with: " +
                "overallAssessment (string - 2-3 sentence department attendance summary), " +
                "anomalies (array of objects with: employeeName (string), anomalyType (string - e.g. Chronic Lateness, " +
                "Excessive Absence, Pattern Absence, Overtime Fatigue, Clock-in Irregularity), " +
                "severity (string - LOW, MEDIUM, HIGH, CRITICAL), " +
                "description (string - specific details), " +
                "suggestedAction (string - recommended management action)), " +
                "fatigueWarnings (array of strings - employees showing signs of burnout/fatigue from overtime), " +
                "policyViolations (array of strings - potential attendance policy violations), " +
                "recommendations (array of strings - overall recommendations for the department). " +
                "Consider South African labour law (BCEA) working hours regulations. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Detect attendance anomalies for:\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Period: Last ").append(request.getPeriodDays()).append(" days\n");

        if (request.getRecords() != null && !request.getRecords().isEmpty()) {
            userPrompt.append("\nAttendance Records:\n");
            for (AttendanceRecord record : request.getRecords()) {
                userPrompt.append("- ").append(record.getEmployeeName())
                        .append(" | Late: ").append(record.getLateArrivals())
                        .append(" | Early Departures: ").append(record.getEarlyDepartures())
                        .append(" | Absences: ").append(record.getAbsences())
                        .append(" | Avg OT/week: ").append(record.getAvgOvertimeHoursPerWeek()).append("h")
                        .append(" | Missed Clock-ins: ").append(record.getMissedClockIns())
                        .append(" | Shift: ").append(record.getShiftPattern())
                        .append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "ATTENDANCE_ANOMALY",
                systemPrompt, userPrompt.toString(), 0.3, 2048);

        try {
            return objectMapper.readValue(response.getContent(), AnomalyDetectionResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse attendance anomaly AI response", e);
            AnomalyDetectionResult result = new AnomalyDetectionResult();
            result.setOverallAssessment(response.getContent());
            return result;
        }
    }
}
