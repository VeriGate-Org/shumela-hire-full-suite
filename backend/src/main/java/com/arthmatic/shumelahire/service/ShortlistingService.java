package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.ShortlistScore;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.ShortlistScoreDataRepository;
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
    private NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ShortlistScore calculateScore(Long applicationId) {
        Application application = applicationRepository.findById(String.valueOf(applicationId))
            .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        ShortlistScore score = shortlistScoreRepository.findByApplicationId(String.valueOf(applicationId))
            .orElse(new ShortlistScore());

        double skillsScore = calculateSkillsScore(application);
        double experienceScore = calculateExperienceScore(application);
        double educationScore = calculateEducationScore(application);
        double screeningScore = calculateScreeningScore(application);
        double keywordScore = calculateKeywordScore(application);

        double totalScore = (skillsScore * SKILLS_WEIGHT) +
                           (experienceScore * EXPERIENCE_WEIGHT) +
                           (educationScore * EDUCATION_WEIGHT) +
                           (screeningScore * SCREENING_WEIGHT) +
                           (keywordScore * KEYWORD_WEIGHT);

        score.setApplication(application);
        score.setTotalScore(Math.round(totalScore * 100.0) / 100.0);
        score.setSkillsMatchScore(skillsScore);
        score.setExperienceScore(experienceScore);
        score.setEducationScore(educationScore);
        score.setScreeningScore(screeningScore);
        score.setKeywordMatchScore(keywordScore);

        try {
            Map<String, Object> breakdown = new LinkedHashMap<>();
            breakdown.put("skills", Map.of("raw", skillsScore, "weight", SKILLS_WEIGHT, "weighted", skillsScore * SKILLS_WEIGHT));
            breakdown.put("experience", Map.of("raw", experienceScore, "weight", EXPERIENCE_WEIGHT, "weighted", experienceScore * EXPERIENCE_WEIGHT));
            breakdown.put("education", Map.of("raw", educationScore, "weight", EDUCATION_WEIGHT, "weighted", educationScore * EDUCATION_WEIGHT));
            breakdown.put("screening", Map.of("raw", screeningScore, "weight", SCREENING_WEIGHT, "weighted", screeningScore * SCREENING_WEIGHT));
            breakdown.put("keywords", Map.of("raw", keywordScore, "weight", KEYWORD_WEIGHT, "weighted", keywordScore * KEYWORD_WEIGHT));
            score.setScoreBreakdown(objectMapper.writeValueAsString(breakdown));
        } catch (Exception e) {
            logger.warn("Failed to serialize score breakdown: {}", e.getMessage());
        }

        return shortlistScoreRepository.save(score);
    }

    @Transactional
    public List<ShortlistScore> calculateScoresForJobPosting(Long jobPostingId) {
        List<Application> applications = applicationRepository.findByJobPostingIdOrderBySubmittedAtDesc(String.valueOf(jobPostingId));
        return applications.stream()
            .map(app -> calculateScore(app.getId()))
            .toList();
    }

    @Transactional
    public List<ShortlistScore> autoShortlist(Long jobPostingId, double threshold) {
        calculateScoresForJobPosting(jobPostingId);

        List<ShortlistScore> scores = shortlistScoreRepository.findByJobPostingIdOrderByScore(String.valueOf(jobPostingId));
        for (ShortlistScore score : scores) {
            boolean shortlisted = score.getTotalScore() >= threshold;
            score.setIsShortlisted(shortlisted);
            if (shortlisted && score.getApplication().getStatus() == ApplicationStatus.SUBMITTED) {
                score.getApplication().setStatus(ApplicationStatus.SCREENING);
                notificationService.notifyApplicationShortlisted(score.getApplication());
            }
            shortlistScoreRepository.save(score);
        }

        logger.info("Auto-shortlisted for job posting {} with threshold {}: {} shortlisted out of {}",
            jobPostingId, threshold,
            scores.stream().filter(ShortlistScore::getIsShortlisted).count(),
            scores.size());

        return scores;
    }

    @Transactional
    public ShortlistScore overrideShortlistDecision(Long scoreId, boolean include, String reason, Long userId) {
        ShortlistScore score = shortlistScoreRepository.findById(String.valueOf(scoreId))
            .orElseThrow(() -> new RuntimeException("Score not found: " + scoreId));

        score.setIsShortlisted(include);
        score.setManuallyOverridden(true);
        score.setOverrideReason(reason);

        logger.info("Manual override on score {}: {} by user {}", scoreId, include ? "included" : "excluded", userId);
        return shortlistScoreRepository.save(score);
    }

    public Map<String, Object> getShortlistingSummary(Long jobPostingId) {
        List<ShortlistScore> scores = shortlistScoreRepository.findByJobPostingIdOrderByScore(String.valueOf(jobPostingId));

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

    private double calculateSkillsScore(Application application) {
        if (application.getApplicant().getExperience() != null &&
            !application.getApplicant().getExperience().isEmpty()) {
            return 70.0;
        }
        return 40.0;
    }

    private double calculateExperienceScore(Application application) {
        if (application.getApplicant().getExperience() != null &&
            application.getApplicant().getExperience().length() > 100) {
            return 75.0;
        }
        return 50.0;
    }

    private double calculateEducationScore(Application application) {
        if (application.getApplicant().getEducation() != null &&
            !application.getApplicant().getEducation().isEmpty()) {
            return 65.0;
        }
        return 30.0;
    }

    private double calculateScreeningScore(Application application) {
        if (application.getRating() != null) {
            return application.getRating() * 20.0;
        }
        return 50.0;
    }

    private double calculateKeywordScore(Application application) {
        return 60.0;
    }
}
