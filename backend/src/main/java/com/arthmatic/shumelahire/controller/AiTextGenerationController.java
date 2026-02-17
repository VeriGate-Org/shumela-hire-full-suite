package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ai.EmailDraftDto;
import com.arthmatic.shumelahire.dto.ai.InterviewQuestionDto;
import com.arthmatic.shumelahire.dto.ai.JobDescriptionDto;
import com.arthmatic.shumelahire.dto.ai.ScreeningNotesDto;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.arthmatic.shumelahire.service.ai.features.EmailDraftingAiService;
import com.arthmatic.shumelahire.service.ai.features.InterviewQuestionAiService;
import com.arthmatic.shumelahire.service.ai.features.JobDescriptionAiService;
import com.arthmatic.shumelahire.service.ai.features.ScreeningNotesAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER')")
public class AiTextGenerationController {

    private final AiService aiService;
    private final JobDescriptionAiService jobDescriptionAiService;
    private final ScreeningNotesAiService screeningNotesAiService;
    private final EmailDraftingAiService emailDraftingAiService;
    private final InterviewQuestionAiService interviewQuestionAiService;

    public AiTextGenerationController(
            AiService aiService,
            JobDescriptionAiService jobDescriptionAiService,
            ScreeningNotesAiService screeningNotesAiService,
            EmailDraftingAiService emailDraftingAiService,
            InterviewQuestionAiService interviewQuestionAiService) {
        this.aiService = aiService;
        this.jobDescriptionAiService = jobDescriptionAiService;
        this.screeningNotesAiService = screeningNotesAiService;
        this.emailDraftingAiService = emailDraftingAiService;
        this.interviewQuestionAiService = interviewQuestionAiService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "enabled", aiService.isEnabled(),
                "provider", aiService.getProviderName(),
                "available", aiService.isProviderAvailable()
        ));
    }

    @PostMapping("/job-description/generate")
    public ResponseEntity<?> generateJobDescription(
            @RequestBody JobDescriptionDto.JobDescriptionRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(jobDescriptionAiService.generateJobDescription(userId, request));
    }

    @PostMapping("/job-description/check-bias")
    public ResponseEntity<?> checkBias(
            @RequestBody JobDescriptionDto.BiasCheckRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(jobDescriptionAiService.checkForBias(userId, request.getText()));
    }

    @PostMapping("/screening-notes/draft")
    public ResponseEntity<?> draftScreeningNotes(
            @RequestBody ScreeningNotesDto.ScreeningNotesRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(screeningNotesAiService.draftScreeningNotes(userId, request));
    }

    @PostMapping("/email/draft")
    public ResponseEntity<?> draftEmail(
            @RequestBody EmailDraftDto.EmailDraftRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(emailDraftingAiService.draftEmail(userId, request));
    }

    @PostMapping("/interview-questions/generate")
    public ResponseEntity<?> generateInterviewQuestions(
            @RequestBody InterviewQuestionDto.InterviewQuestionRequest request,
            Authentication authentication) {
        if (!aiService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI features are not enabled"));
        }
        String userId = authentication.getName();
        return ResponseEntity.ok(interviewQuestionAiService.generateQuestions(userId, request));
    }
}
