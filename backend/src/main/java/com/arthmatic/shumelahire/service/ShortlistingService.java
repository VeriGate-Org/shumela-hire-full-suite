package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.ShortlistScore;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.ShortlistScoreDataRepository;
import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring;
import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring.Dimension;
import com.arthmatic.shumelahire.service.shortlisting.ScoreCard;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.arthmatic.shumelahire.service.ai.features.CvScreeningAiService;
import com.arthmatic.shumelahire.dto.ai.CvScreeningDto.CvScreeningResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShortlistingService {

    private static final Logger logger = LoggerFactory.getLogger(ShortlistingService.class);

    private static final double SKILLS_WEIGHT = 0.30;
    private static final double EXPERIENCE_WEIGHT = 0.25;
    private static final double EDUCATION_WEIGHT = 0.20;
    private static final double SCREENING_WEIGHT = 0.15;
    private static final double KEYWORD_WEIGHT = 0.10;

    @Autowired
    private ShortlistScoreDataRepository shortlistScoreRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private DocumentDataRepository documentRepository;

    @Autowired
    private ApplicantDataRepository applicantRepository;

    @Autowired(required = false)
    private CvScreeningAiService cvScreeningAiService;

    @Autowired(required = false)
    private AiService aiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ShortlistScore calculateScore(String applicationId) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        // The vacancy is half the comparison. Loading it is the whole point of this rewrite:
        // previously nothing about the role reached the scoring at all, so every dimension
        // returned a constant and two candidates for different jobs scored identically.
        JobPosting posting = application.getJobPostingId() == null ? null
            : jobPostingRepository.findById(application.getJobPostingId()).orElse(null);

        return calculateScore(application, posting);
    }

    /** Scores one application against its vacancy. Package-visible so callers can batch the load. */
    @Transactional
    public ShortlistScore calculateScore(Application application, JobPosting posting) {
        return calculateScore(application, posting, true);
    }

    /**
     * Scores one application, optionally running the AI screening pass.
     *
     * <p>{@code withAi=false} exists because AI enrichment is a per-candidate model call taking
     * ten to twenty-five seconds, and the bulk path runs it once per applicant. That was invisible
     * while almost nobody had a CV — {@code enrichWithAi} returns immediately when there is no text
     * to screen, so scoring a whole vacancy took milliseconds. Once every candidate had a CV
     * attached, the same call became dozens of serial model invocations and both
     * {@code /calculate} and {@code /auto-shortlist} began returning 504 from the gateway, on a
     * vacancy with as few as six applicants.
     *
     * <p>Splitting them is also the right shape rather than merely the fast one. The deterministic
     * score is arithmetic over skills, experience, education, screening and keywords — reproducible
     * and cheap, and what a shortlist should be defensible on. The AI reading is a deliberate act a
     * recruiter takes on one candidate, and it already has its own control on the candidate panel.
     * Firing it implicitly for forty-two people also spends forty-two times the tokens for output
     * nobody asked to see.</p>
     */
    @Transactional
    public ShortlistScore calculateScore(Application application, JobPosting posting, boolean withAi) {
        ShortlistScore score = shortlistScoreRepository.findByApplicationId(application.getId())
            .orElse(new ShortlistScore());

        Applicant applicant = hydrate(application.getApplicant());
        ScoreCard card = score(application, applicant, posting);

        score.setApplication(application);
        score.setTotalScore(card.total());
        score.setSkillsMatchScore(card.dimensions().get("skills").score());
        score.setExperienceScore(card.dimensions().get("experience").score());
        score.setEducationScore(card.dimensions().get("education").score());
        score.setScreeningScore(card.dimensions().get("screening").score());
        score.setKeywordMatchScore(card.dimensions().get("keywords").score());

        try {
            score.setScoreBreakdown(objectMapper.writeValueAsString(card.toBreakdown()));
        } catch (Exception e) {
            logger.warn("Failed to serialize score breakdown: {}", e.getMessage());
        }

        if (withAi) {
            enrichWithAi(score, application, posting);
        }

        return shortlistScoreRepository.save(score);
    }

    /**
     * Loads the full applicant behind an association that is only ever an id.
     *
     * <p>{@code DynamoApplicationRepository.toEntity} rebuilds {@code application.getApplicant()} as
     * a <b>stub carrying the id and nothing else</b>. Every other field — skills, experience,
     * education — comes back null, and null is indistinguishable from "this candidate listed
     * nothing". Scoring therefore marked skills, experience and education unscorable for every
     * single applicant, which is three of the five dimensions and 75% of the weight. What survived
     * was the keyword dimension, because it reads the application's own text rather than the
     * applicant record.</p>
     *
     * <p>The visible symptom was a shortlist that shortlisted nobody: on the Senior Investment
     * Analyst vacancy, six candidates whose records literally list "Investment analysis" and
     * "Financial modelling" — both named in the vacancy's required skills — topped out at 3.7 out
     * of 100. No threshold a recruiter would choose could ever select anyone.</p>
     *
     * <p>This is the same defect class as {@code DynamoOfferRepository.toEntity}, which likewise
     * returned an unhydrated association and produced "Unknown Candidate" on the offers screen. A
     * stubbed association is the recurring shape of bug in this repository, and the lesson is that
     * an association loaded from Dynamo must be treated as an id until proven otherwise.</p>
     */
    private Applicant hydrate(Applicant stub) {
        if (stub == null || stub.getId() == null) return stub;
        // Fall back to the stub rather than null: a missing applicant record should degrade the
        // score to "could not assess", not throw away the application entirely.
        return applicantRepository.findById(stub.getId()).orElse(stub);
    }

    /** Pure assembly of the five dimensions — no persistence, so it can be reasoned about. */
    private ScoreCard score(Application application, Applicant applicant, JobPosting posting) {
        if (posting == null) {
            logger.warn("Application {} has no job posting — only the recruiter rating can be scored",
                application.getId());
        }

        Dimension skills = CandidateScoring.skills(
            applicant == null ? null : CandidateScoring.parseSkills(applicant.getSkills()),
            posting == null ? null : posting.getRequiredSkills(),
            posting == null ? null : posting.getPreferredSkills());

        Dimension experience = CandidateScoring.experience(
            applicant == null ? null : CandidateScoring.parseExperienceYears(applicant.getExperience()),
            posting == null ? 0 : posting.getMinExperienceYears());

        Dimension education = CandidateScoring.education(
            applicant == null ? null : CandidateScoring.parseHighestEducation(applicant.getEducation()),
            posting == null ? null : posting.getMinEducationLevel());

        Dimension screening = CandidateScoring.screening(application.getRating());

        Dimension keywords = CandidateScoring.keywords(
            candidateText(application, applicant),
            posting == null ? null : posting.getRequirements());

        return ScoreCard.of(skills, experience, education, screening, keywords);
    }

    /**
     * Adds the model's reading of the CV, where there is a model and a CV.
     *
     * <p><b>The deterministic score is never overwritten.</b> The AI contributes a written
     * assessment and its own view of matched and missing skills, which a recruiter can read and
     * disagree with; the number that decides the shortlist stays the one computed from the
     * vacancy's stated requirements. For a public entity a shortlist has to be defensible, and
     * "the model said so" is not a defence.</p>
     *
     * <p>Silently skipped when AI is disabled, no provider is wired, or the candidate has no
     * readable CV — all of which are the normal state today. A screening failure must never cost
     * a candidate their deterministic score.</p>
     */
    private void enrichWithAi(ShortlistScore score, Application application, JobPosting posting) {
        if (cvScreeningAiService == null || aiService == null || !aiService.isEnabled()) {
            return;
        }
        Applicant applicant = application.getApplicant();
        if (applicant == null || posting == null) return;

        String cv = cvText(applicant.getId());
        if (cv.isBlank()) return;   // nothing to screen — see CvUploadController

        List<String> requirements = new ArrayList<>();
        if (posting.getRequiredSkills() != null) requirements.addAll(posting.getRequiredSkills());
        if (posting.getRequirements() != null && !posting.getRequirements().isBlank()) {
            requirements.add(posting.getRequirements());
        }
        if (requirements.isEmpty()) return;

        try {
            // The AI service records usage against a user id for audit and cost attribution.
            // A scoring run is the system acting on a vacancy, not a person clicking, so it is
            // attributed to SYSTEM rather than to whoever happened to trigger the recalculation.
            CvScreeningResult result = cvScreeningAiService.screenCandidate(
                "SYSTEM", application.getId(), requirements,
                application.getCandidateName(), cv);

            score.setAiSummary(result.getSummary());
            score.setAiMatchedSkills(objectMapper.writeValueAsString(result.getMatchedSkills()));
            score.setAiMissingSkills(objectMapper.writeValueAsString(result.getMissingSkills()));
        } catch (Exception e) {
            logger.warn("AI screening failed for application {} — the deterministic score stands: {}",
                application.getId(), e.getMessage());
        }
    }

    /**
     * Everything the candidate wrote or had recorded, for the keyword sweep.
     *
     * <p>Includes the text of any uploaded CV. That is the point of extracting it at upload: a
     * candidate's actual document usually says far more than the handful of structured fields a
     * recruiter had time to capture, and before CV storage existed this method had only those
     * fields to work with.</p>
     */
    private String candidateText(Application application, Applicant applicant) {
        StringBuilder sb = new StringBuilder();
        if (application.getCoverLetter() != null) sb.append(application.getCoverLetter()).append(' ');
        if (applicant != null) {
            if (applicant.getSkills() != null) sb.append(applicant.getSkills()).append(' ');
            if (applicant.getExperience() != null) sb.append(applicant.getExperience()).append(' ');
            if (applicant.getEducation() != null) sb.append(applicant.getEducation()).append(' ');
            sb.append(cvText(applicant.getId()));
        }
        return sb.toString();
    }

    /** Extracted text of the candidate's most recent readable CV, or empty. */
    private String cvText(String applicantId) {
        if (applicantId == null) return "";
        try {
            return documentRepository.findCvDocumentsByApplicant(applicantId).stream()
                .map(Document::getExtractedText)
                .filter(t -> t != null && !t.isBlank())
                .findFirst()
                .orElse("");
        } catch (Exception e) {
            // A CV that cannot be loaded must not stop the candidate being scored on everything else.
            logger.warn("Could not load CV text for applicant {}: {}", applicantId, e.getMessage());
            return "";
        }
    }

    @Transactional
    public List<ShortlistScore> calculateScoresForJobPosting(String jobPostingId) {
        List<Application> applications = applicationRepository.findByJobPostingIdOrderBySubmittedAtDesc(jobPostingId);
        // One posting read for the whole vacancy rather than one per application.
        JobPosting posting = jobPostingRepository.findById(jobPostingId).orElse(null);
        // Deliberately without the AI pass — see calculateScore(.., withAi). A recruiter screens
        // an individual candidate from the candidate panel; scoring a vacancy must not silently
        // become one model call per applicant.
        return applications.stream()
            .map(app -> calculateScore(app, posting, false))
            .toList();
    }

    @Transactional
    public List<ShortlistScore> autoShortlist(String jobPostingId, double threshold, String userId) {
        calculateScoresForJobPosting(jobPostingId);

        List<ShortlistScore> scores = shortlistScoreRepository.findByJobPostingIdOrderByScore(jobPostingId);
        int advanced = 0;
        for (ShortlistScore score : scores) {
            boolean shortlisted = score.getTotalScore() >= threshold;
            score.setIsShortlisted(shortlisted);

            if (shortlisted) {
                // Load the real application. The one hanging off the score is a stub carrying ids
                // and nothing else, so reading a status off it yields null — which is neither
                // SUBMITTED nor an error, so every candidate would silently fail to advance. And
                // mutating that stub wrote the new status to an object nobody persists: the loop
                // saved the ShortlistScore and never the Application at all.
                Application application = score.getApplication() == null ? null
                    : applicationRepository.findById(score.getApplication().getId()).orElse(null);

                if (application == null) {
                    logger.warn("Shortlisted score {} has no resolvable application — flag set, "
                        + "candidate not advanced", score.getId());
                } else if (application.getStatus() == ApplicationStatus.SUBMITTED) {
                    application.setStatus(ApplicationStatus.SCREENING);
                    applicationRepository.save(application);   // the change has to outlive the loop
                    notificationService.notifyApplicationShortlisted(application);
                    advanced++;
                }
                // Keep the association whole on the way back out — see the note in
                // DynamoShortlistScoreRepository.toEntity. Saving with a null application is what
                // erased applicationId on six rows.
                if (application != null) {
                    score.setApplication(application);
                }
            }
            shortlistScoreRepository.save(score);
        }

        long shortlisted = scores.stream().filter(ShortlistScore::getIsShortlisted).count();

        // Auto-shortlisting moves candidates through the pipeline and emails them. An action with
        // that reach on a public entity's recruitment must be answerable eighteen months later:
        // who ran it, against which vacancy, at what threshold, and how many it moved.
        auditLogService.logUserAction(userId, "SHORTLIST_AUTO_RUN", "JOB_POSTING",
            String.format("Auto-shortlist on posting %s at threshold %.0f: %d of %d shortlisted, "
                    + "%d advanced to screening",
                jobPostingId, threshold, shortlisted, scores.size(), advanced));

        logger.info("Auto-shortlisted for job posting {} with threshold {}: {} shortlisted out of {}",
            jobPostingId, threshold, shortlisted, scores.size());

        return scores;
    }

    @Transactional
    public ShortlistScore overrideShortlistDecision(String scoreId, boolean include, String reason, String userId) {
        ShortlistScore score = shortlistScoreRepository.findById(scoreId)
            .orElseThrow(() -> new RuntimeException("Score not found: " + scoreId));

        boolean wasShortlisted = Boolean.TRUE.equals(score.getIsShortlisted());
        score.setIsShortlisted(include);
        score.setManuallyOverridden(true);
        score.setOverrideReason(reason);

        String candidate = score.getApplication() != null && score.getApplication().getCandidateName() != null
            ? score.getApplication().getCandidateName() : "candidate " + scoreId;

        // The single most consequential action in shortlisting: a person overruling the model
        // about someone's application. Recording the direction and the stated reason is what
        // makes the decision defensible rather than merely made.
        auditLogService.logUserAction(userId, "SHORTLIST_OVERRIDDEN", "SHORTLIST_SCORE",
            String.format("%s %s the shortlist (was %s, score %.1f). Reason: %s",
                candidate,
                include ? "included in" : "excluded from",
                wasShortlisted ? "included" : "excluded",
                score.getTotalScore() == null ? 0.0 : score.getTotalScore(),
                reason == null || reason.isBlank() ? "not stated" : reason));

        logger.info("Manual override on score {}: {} by user {}", scoreId, include ? "included" : "excluded", userId);
        return shortlistScoreRepository.save(score);
    }

    /**
     * The stored shortlist state for one application, so a control can show what is true rather
     * than what was last clicked.
     *
     * <p>Deliberately does not score on a read. A GET that creates a row would mean merely opening
     * a candidate's record wrote a scoring decision against them; {@code scored: false} is the
     * honest answer for a vacancy nobody has scored yet.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getShortlistStateForApplication(String applicationId) {
        return shortlistScoreRepository.findByApplicationId(applicationId)
            .map(score -> {
                Map<String, Object> state = new LinkedHashMap<>();
                state.put("scored", true);
                state.put("shortlisted", Boolean.TRUE.equals(score.getIsShortlisted()));
                state.put("manuallyOverridden", Boolean.TRUE.equals(score.getManuallyOverridden()));
                state.put("totalScore", score.getTotalScore() == null ? 0.0 : score.getTotalScore());
                return state;
            })
            .orElseGet(() -> {
                Map<String, Object> state = new LinkedHashMap<>();
                state.put("scored", false);
                state.put("shortlisted", false);
                return state;
            });
    }

    /**
     * Shortlist state for many applications, keyed by application id.
     *
     * <p>An application with no score row is simply absent from the result rather than reported as
     * {@code false}: "nobody has scored this vacancy" and "this candidate was considered and left
     * off" are different facts, and the caller should be able to tell them apart.
     */
    @Transactional(readOnly = true)
    public Map<String, Boolean> getShortlistStatesForApplications(List<String> applicationIds) {
        Map<String, Boolean> states = new LinkedHashMap<>();
        if (applicationIds == null) return states;

        for (String applicationId : applicationIds) {
            shortlistScoreRepository.findByApplicationId(applicationId).ifPresent(score ->
                states.put(applicationId, Boolean.TRUE.equals(score.getIsShortlisted())));
        }
        return states;
    }

    /**
     * Include or exclude one application from the shortlist, identified by the application itself.
     *
     * <p>{@link #overrideShortlistDecision} keys on a score id, which only exists once someone has
     * run scoring for the whole vacancy. That made a per-candidate shortlist action impossible to
     * offer anywhere a candidate appears — the caller would have to know whether a score row
     * happened to exist, and do something else if it did not. Here the score is computed on demand
     * when it is missing, so the decision is always recorded against a real assessment rather than
     * an empty row, and every surface can offer a single unconditional action.
     *
     * <p>Scoring runs without the AI pass: this is a person making the call, and a deterministic
     * score computed in milliseconds is the right thing to attach to their decision. Waiting
     * twenty seconds for a model to also have an opinion would make a quick action not one.
     */
    @Transactional
    public ShortlistScore setShortlistedForApplication(String applicationId, boolean include,
                                                       String reason, String userId) {
        ShortlistScore score = shortlistScoreRepository.findByApplicationId(applicationId).orElse(null);

        if (score == null) {
            Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));
            JobPosting posting = application.getJobPostingId() == null ? null
                : jobPostingRepository.findById(application.getJobPostingId()).orElse(null);
            score = calculateScore(application, posting, false);
        }

        return overrideShortlistDecision(score.getId(), include, reason, userId);
    }

    public Map<String, Object> getShortlistingSummary(String jobPostingId) {
        List<ShortlistScore> scores = shortlistScoreRepository.findByJobPostingIdOrderByScore(jobPostingId);
        JobPosting posting = jobPostingRepository.findById(jobPostingId).orElse(null);

        long shortlisted = scores.stream().filter(ShortlistScore::getIsShortlisted).count();
        double avgScore = scores.stream().mapToDouble(ShortlistScore::getTotalScore).average().orElse(0);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalCandidates", scores.size());
        summary.put("shortlisted", shortlisted);
        summary.put("notShortlisted", scores.size() - shortlisted);
        summary.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
        summary.put("highestScore", scores.stream().mapToDouble(ShortlistScore::getTotalScore).max().orElse(0));
        summary.put("lowestScore", scores.stream().mapToDouble(ShortlistScore::getTotalScore).min().orElse(0));

        // Which dimensions this vacancy can be scored on at all.
        //
        // Requirements are only editable while a posting is DRAFT or REJECTED, and shortlisting
        // only appears from APPROVED onward — so a vacancy approved without structured
        // requirements can never acquire them. Without this the panel would show skills as
        // unscorable for every candidate with no way to tell that the gap is in the VACANCY,
        // not in the applicants.
        List<String> notConfigured = new ArrayList<>();
        if (posting == null) {
            notConfigured.add("job posting not found");
        } else {
            if (posting.getRequiredSkills() == null || posting.getRequiredSkills().isEmpty()) {
                notConfigured.add("required skills");
            }
            if (posting.getMinEducationLevel() == null) {
                notConfigured.add("minimum qualification");
            }
            if (posting.getRequirements() == null || posting.getRequirements().isBlank()) {
                notConfigured.add("requirements text");
            }
        }
        summary.put("vacancyGaps", notConfigured);
        summary.put("vacancyFullyConfigured", notConfigured.isEmpty());

        return summary;
    }

}
