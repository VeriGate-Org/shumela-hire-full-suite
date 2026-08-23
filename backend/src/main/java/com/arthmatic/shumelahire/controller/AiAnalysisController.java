package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ai.CvScreeningDto;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
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

    private final ApplicationDataRepository applicationRepository;
    private final ApplicantDataRepository applicantRepository;
    private final DocumentDataRepository documentRepository;

    public AiAnalysisController(
            AiService aiService,
            CvScreeningAiService cvScreeningAiService,
            CandidateSummaryAiService candidateSummaryAiService,
            DuplicateDetectionService duplicateDetectionService,
            SmartSearchAiService smartSearchAiService,
            ApplicationDataRepository applicationRepository,
            ApplicantDataRepository applicantRepository,
            DocumentDataRepository documentRepository) {
        this.aiService = aiService;
        this.cvScreeningAiService = cvScreeningAiService;
        this.candidateSummaryAiService = candidateSummaryAiService;
        this.duplicateDetectionService = duplicateDetectionService;
        this.smartSearchAiService = smartSearchAiService;
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.documentRepository = documentRepository;
    }

    /** A candidate's name and everything we actually know about them, as text for a model. */
    private record Dossier(String name, String profileText) {
        boolean isEmpty() { return profileText == null || profileText.isBlank(); }
    }

    /**
     * Assembles what the tenant holds on a candidate.
     *
     * <p>Both screening endpoints previously passed the string literals {@code "Candidate"} and
     * {@code "Resume text not available"} straight to the model. Nothing was ever loaded. The model
     * then answered, accurately, that it had been given nothing — the candidate summary for a
     * candidate with a full CV on file came back "contains no profile text, resume data, or
     * substantive details about education, experience, or qualifications".</p>
     *
     * <p>That reads on screen as the platform knowing nothing about the person, which is worse than
     * showing no panel at all. The data was there the whole time; the controller was never wired to
     * it.</p>
     *
     * <p>The CV is preferred because it is the candidate's own account, and the structured fields
     * are appended rather than substituted so a thin CV still gets scored against what was captured
     * at application time.</p>
     */
    private Dossier dossierFor(String applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) return new Dossier("Candidate", null);

        String name = application.resolveCandidateName();

        // The association off an Application is an id-only stub — see ShortlistingService.hydrate.
        Applicant applicant = application.getApplicant() == null ? null
                : applicantRepository.findById(application.getApplicant().getId()).orElse(null);

        StringBuilder text = new StringBuilder();
        if (application.getJobTitle() != null) {
            text.append("Applied for: ").append(application.getJobTitle()).append('\n');
        }

        if (applicant != null) {
            if (applicant.getSkills() != null) text.append("Skills: ").append(applicant.getSkills()).append('\n');
            if (applicant.getExperience() != null) text.append("Experience: ").append(applicant.getExperience()).append('\n');
            if (applicant.getEducation() != null) text.append("Education: ").append(applicant.getEducation()).append('\n');
        }

        if (applicant != null) {
            documentRepository.findByApplicantIdOrderByUploadedAtDesc(applicant.getId()).stream()
                    .filter(d -> d.getExtractedText() != null && !d.getExtractedText().isBlank())
                    .findFirst()
                    .ifPresent(d -> text.append("\nCV:\n").append(d.getExtractedText()));
        }

        return new Dossier(name == null ? "Candidate" : name,
                text.length() == 0 ? null : text.toString());
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
        Dossier dossier = dossierFor(applicationId);
        if (dossier.isEmpty()) {
            // Say so plainly rather than asking the model to assess an empty string. It answers
            // "no information provided", which reads as a verdict on the candidate instead of a
            // gap in our own records.
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "No candidate information to screen",
                    "message", "This candidate has no CV or captured profile. Upload a CV first."));
        }
        return ResponseEntity.ok(cvScreeningAiService.screenCandidate(
                userId, applicationId, request.getJobRequirements(), dossier.name(), dossier.profileText()));
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
        Dossier dossier = dossierFor(applicationId);
        if (dossier.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "No candidate information to summarise",
                    "message", "This candidate has no CV or captured profile. Upload a CV first."));
        }
        return ResponseEntity.ok(candidateSummaryAiService.summarizeCandidate(
                userId, applicationId, dossier.name(), dossier.profileText()));
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
