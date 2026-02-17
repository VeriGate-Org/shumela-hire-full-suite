package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ai.CvScreeningDto;
import com.arthmatic.shumelahire.dto.ai.DuplicateDetectionDto;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.arthmatic.shumelahire.service.ai.features.CandidateSummaryAiService;
import com.arthmatic.shumelahire.service.ai.features.CvScreeningAiService;
import com.arthmatic.shumelahire.service.ai.features.DuplicateDetectionService;
import com.arthmatic.shumelahire.service.ai.features.SmartSearchAiService;
import com.arthmatic.shumelahire.dto.ai.SmartSearchDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER')")
public class AiAnalysisController {

    private final AiService aiService;
    private final CvScreeningAiService cvScreeningAiService;
    private final CandidateSummaryAiService candidateSummaryAiService;
    private final DuplicateDetectionService duplicateDetectionService;
    private final SmartSearchAiService smartSearchAiService;

    public AiAnalysisController(
            AiService aiService,
            CvScreeningAiService cvScreeningAiService,
            CandidateSummaryAiService candidateSummaryAiService,
            DuplicateDetectionService duplicateDetectionService,
            SmartSearchAiService smartSearchAiService) {
        this.aiService = aiService;
        this.cvScreeningAiService = cvScreeningAiService;
        this.candidateSummaryAiService = candidateSummaryAiService;
        this.duplicateDetectionService = duplicateDetectionService;
        this.smartSearchAiService = smartSearchAiService;
    }

    @PostMapping("/cv-screening/screen/{applicationId}")
    public ResponseEntity<?> screenCandidate(
            @PathVariable String applicationId,
            @RequestBody CvScreeningDto.CvScreeningRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(cvScreeningAiService.screenCandidate(
                userId, applicationId, request.getJobRequirements(), "Candidate", "Resume text not available"));
    }

    @PostMapping("/cv-screening/rank/{jobId}")
    public ResponseEntity<?> rankCandidates(
            @PathVariable String jobId,
            @RequestBody CvScreeningDto.CvRankingRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(cvScreeningAiService.rankCandidates(
                userId, jobId, request.getJobRequirements(), null));
    }

    @GetMapping("/candidate-summary/{applicationId}")
    public ResponseEntity<?> summarizeCandidate(
            @PathVariable String applicationId,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(candidateSummaryAiService.summarizeCandidate(
                userId, applicationId, "Candidate", "Profile text not available"));
    }

    @PostMapping("/duplicate-detection/check")
    public ResponseEntity<?> checkDuplicates(
            @RequestBody DuplicateDetectionDto.DuplicateCheckRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(duplicateDetectionService.findDuplicates(userId, request));
    }

    // Smart Search endpoint (Batch 4 — included here as planned)
    @PostMapping("/smart-search")
    public ResponseEntity<?> smartSearch(
            @RequestBody SmartSearchDto.SmartSearchRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(smartSearchAiService.search(userId, request.getQuery()));
    }
}
