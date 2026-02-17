package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ai.OfferPredictionDto;
import com.arthmatic.shumelahire.dto.ai.ReportNarrativeDto;
import com.arthmatic.shumelahire.dto.ai.SalaryBenchmarkDto;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.arthmatic.shumelahire.service.ai.features.OfferPredictionAiService;
import com.arthmatic.shumelahire.service.ai.features.ReportNarrativeAiService;
import com.arthmatic.shumelahire.service.ai.features.SalaryBenchmarkAiService;
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

    public AiInsightsController(
            AiService aiService,
            SalaryBenchmarkAiService salaryBenchmarkAiService,
            OfferPredictionAiService offerPredictionAiService,
            ReportNarrativeAiService reportNarrativeAiService) {
        this.aiService = aiService;
        this.salaryBenchmarkAiService = salaryBenchmarkAiService;
        this.offerPredictionAiService = offerPredictionAiService;
        this.reportNarrativeAiService = reportNarrativeAiService;
    }

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
}
