package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ai.*;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.arthmatic.shumelahire.service.ai.features.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiInsightsController {

    private final AiService aiService;
    private final SalaryBenchmarkAiService salaryBenchmarkAiService;
    private final OfferPredictionAiService offerPredictionAiService;
    private final ReportNarrativeAiService reportNarrativeAiService;
    private final SkillGapAiService skillGapAiService;
    private final PerformanceReviewAiService performanceReviewAiService;
    private final TrainingPathAiService trainingPathAiService;
    private final AttritionRiskAiService attritionRiskAiService;
    private final LeaveAnalyticsAiService leaveAnalyticsAiService;
    private final AttendanceAiService attendanceAiService;
    private final EngagementAiService engagementAiService;
    private final HrGeneralAiService hrGeneralAiService;

    public AiInsightsController(
            AiService aiService,
            SalaryBenchmarkAiService salaryBenchmarkAiService,
            OfferPredictionAiService offerPredictionAiService,
            ReportNarrativeAiService reportNarrativeAiService,
            SkillGapAiService skillGapAiService,
            PerformanceReviewAiService performanceReviewAiService,
            TrainingPathAiService trainingPathAiService,
            AttritionRiskAiService attritionRiskAiService,
            LeaveAnalyticsAiService leaveAnalyticsAiService,
            AttendanceAiService attendanceAiService,
            EngagementAiService engagementAiService,
            HrGeneralAiService hrGeneralAiService) {
        this.aiService = aiService;
        this.salaryBenchmarkAiService = salaryBenchmarkAiService;
        this.offerPredictionAiService = offerPredictionAiService;
        this.reportNarrativeAiService = reportNarrativeAiService;
        this.skillGapAiService = skillGapAiService;
        this.performanceReviewAiService = performanceReviewAiService;
        this.trainingPathAiService = trainingPathAiService;
        this.attritionRiskAiService = attritionRiskAiService;
        this.leaveAnalyticsAiService = leaveAnalyticsAiService;
        this.attendanceAiService = attendanceAiService;
        this.engagementAiService = engagementAiService;
        this.hrGeneralAiService = hrGeneralAiService;
    }

    // --- Existing endpoints ---

    @PostMapping("/salary-benchmark/analyze")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeSalaryBenchmark(
            @RequestBody SalaryBenchmarkDto.SalaryBenchmarkRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(salaryBenchmarkAiService.benchmark(userId, request));
    }

    @PostMapping("/offer-prediction/predict/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> predictOfferAcceptance(
            @PathVariable String applicationId,
            @RequestBody OfferPredictionDto.OfferPredictionRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        request.setApplicationId(applicationId);
        String userId = authentication.getName();
        return ResponseEntity.ok(offerPredictionAiService.predictAcceptance(userId, request));
    }

    @PostMapping("/report-narrative/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER')")
    public ResponseEntity<?> generateReportNarrative(
            @RequestBody ReportNarrativeDto.ReportNarrativeRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(reportNarrativeAiService.generateNarrative(userId, request));
    }

    @PostMapping("/report-narrative/generate/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER')")
    public ResponseEntity<?> generateReportNarrativeForJob(
            @PathVariable String jobId,
            @RequestBody ReportNarrativeDto.ReportNarrativeRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        request.setJobId(jobId);
        String userId = authentication.getName();
        return ResponseEntity.ok(reportNarrativeAiService.generateNarrative(userId, request));
    }

    @PostMapping("/skill-gap/analyze")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<?> analyzeSkillGaps(
            @RequestBody SkillGapAiDto.SkillGapAiRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(skillGapAiService.analyzeGaps(userId, request));
    }

    // --- Performance Review AI ---

    @PostMapping("/performance/draft-review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'LINE_MANAGER')")
    public ResponseEntity<?> draftPerformanceReview(
            @RequestBody PerformanceReviewAiDto.ReviewDraftRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(performanceReviewAiService.draftReview(userId, request));
    }

    @PostMapping("/performance/summarize-feedback")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'LINE_MANAGER')")
    public ResponseEntity<?> summarizeFeedback(
            @RequestBody PerformanceReviewAiDto.FeedbackSummaryRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(performanceReviewAiService.summarizeFeedback(userId, request));
    }

    @PostMapping("/performance/suggest-goals")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<?> suggestGoals(
            @RequestBody PerformanceReviewAiDto.GoalSuggestionRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(performanceReviewAiService.suggestGoals(userId, request));
    }

    // --- Training Learning Path AI ---

    @PostMapping("/training/learning-path")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<?> generateLearningPath(
            @RequestBody TrainingPathAiDto.LearningPathRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(trainingPathAiService.generateLearningPath(userId, request));
    }

    @PostMapping("/training/roi-analysis")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeTrainingRoi(
            @RequestBody TrainingPathAiDto.TrainingRoiRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(trainingPathAiService.analyzeTrainingRoi(userId, request));
    }

    // --- Attrition Risk AI ---

    @PostMapping("/attrition/analyze-employee")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeAttritionRisk(
            @RequestBody AttritionRiskAiDto.AttritionAnalysisRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(attritionRiskAiService.analyzeAttritionRisk(userId, request));
    }

    @PostMapping("/attrition/analyze-workforce")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeWorkforce(
            @RequestBody AttritionRiskAiDto.WorkforceAnalysisRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(attritionRiskAiService.analyzeWorkforce(userId, request));
    }

    // --- Leave Analytics AI ---

    @PostMapping("/leave/analyze-patterns")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeLeavePatterns(
            @RequestBody LeaveAnalyticsAiDto.LeavePatternRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(leaveAnalyticsAiService.analyzeLeavePatterns(userId, request));
    }

    // --- Attendance Anomaly AI ---

    @PostMapping("/attendance/detect-anomalies")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'LINE_MANAGER')")
    public ResponseEntity<?> detectAttendanceAnomalies(
            @RequestBody AttendanceAiDto.AnomalyDetectionRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(attendanceAiService.detectAnomalies(userId, request));
    }

    // --- Engagement Sentiment AI ---

    @PostMapping("/engagement/analyze-sentiment")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeSentiment(
            @RequestBody EngagementAiDto.SentimentAnalysisRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(engagementAiService.analyzeSentiment(userId, request));
    }

    // --- HR General AI (Labour Relations, Onboarding, Payroll) ---

    @PostMapping("/hr/analyze-case")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> analyzeCase(
            @RequestBody HrGeneralAiDto.CaseAnalysisRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(hrGeneralAiService.analyzeCase(userId, request));
    }

    @PostMapping("/hr/generate-onboarding-plan")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> generateOnboardingPlan(
            @RequestBody HrGeneralAiDto.OnboardingPlanRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(hrGeneralAiService.generateOnboardingPlan(userId, request));
    }

    @PostMapping("/hr/detect-payroll-anomalies")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> detectPayrollAnomalies(
            @RequestBody HrGeneralAiDto.PayrollAnomalyRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(hrGeneralAiService.detectPayrollAnomalies(userId, request));
    }
}
