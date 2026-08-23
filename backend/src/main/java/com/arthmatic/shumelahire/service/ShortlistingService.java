package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.ShortlistScore;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.ShortlistScoreDataRepository;
import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring;
import com.arthmatic.shumelahire.service.shortlisting.CandidateScoring.Dimension;
import com.arthmatic.shumelahire.service.shortlisting.ScoreCard;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        ShortlistScore score = shortlistScoreRepository.findByApplicationId(application.getId())
            .orElse(new ShortlistScore());

        Applicant applicant = application.getApplicant();
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

        return shortlistScoreRepository.save(score);
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

    /** Everything the candidate wrote or had recorded, for the keyword sweep. */
    private String candidateText(Application application, Applicant applicant) {
        StringBuilder sb = new StringBuilder();
        if (application.getCoverLetter() != null) sb.append(application.getCoverLetter()).append(' ');
        if (applicant != null) {
            if (applicant.getSkills() != null) sb.append(applicant.getSkills()).append(' ');
            if (applicant.getExperience() != null) sb.append(applicant.getExperience()).append(' ');
            if (applicant.getEducation() != null) sb.append(applicant.getEducation());
        }
        return sb.toString();
    }

    @Transactional
    public List<ShortlistScore> calculateScoresForJobPosting(String jobPostingId) {
        List<Application> applications = applicationRepository.findByJobPostingIdOrderBySubmittedAtDesc(jobPostingId);
        // One posting read for the whole vacancy rather than one per application.
        JobPosting posting = jobPostingRepository.findById(jobPostingId).orElse(null);
        return applications.stream()
            .map(app -> calculateScore(app, posting))
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
            if (shortlisted && score.getApplication().getStatus() == ApplicationStatus.SUBMITTED) {
                score.getApplication().setStatus(ApplicationStatus.SCREENING);
                notificationService.notifyApplicationShortlisted(score.getApplication());
                advanced++;
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

    public Map<String, Object> getShortlistingSummary(String jobPostingId) {
        List<ShortlistScore> scores = shortlistScoreRepository.findByJobPostingIdOrderByScore(jobPostingId);

        long shortlisted = scores.stream().filter(ShortlistScore::getIsShortlisted).count();
        double avgScore = scores.stream().mapToDouble(ShortlistScore::getTotalScore).average().orElse(0);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalCandidates", scores.size());
        summary.put("shortlisted", shortlisted);
        summary.put("notShortlisted", scores.size() - shortlisted);
        summary.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
        summary.put("highestScore", scores.stream().mapToDouble(ShortlistScore::getTotalScore).max().orElse(0));
        summary.put("lowestScore", scores.stream().mapToDouble(ShortlistScore::getTotalScore).min().orElse(0));

        return summary;
    }

}
