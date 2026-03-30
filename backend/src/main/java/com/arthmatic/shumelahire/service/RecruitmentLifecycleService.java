package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.LifecycleEvent;
import com.arthmatic.shumelahire.dto.RecruitmentLifecycle;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.*;
import com.arthmatic.shumelahire.repository.PipelineTransitionDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Aggregation service that builds a unified, chronological lifecycle
 * view across all recruitment entities for a given application or requisition.
 *
 * Entity chain: Requisition -> JobAd -> JobPosting -> Application
 *   -> Interview, Offer, SalaryRecommendation, PipelineTransition, BackgroundCheck
 * All entities -> AuditLog (entityType + entityId)
 */
@Service
public class RecruitmentLifecycleService {

    private static final Logger logger = LoggerFactory.getLogger(RecruitmentLifecycleService.class);

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private InterviewDataRepository interviewRepository;

    @Autowired
    private OfferDataRepository offerRepository;

    @Autowired
    private SalaryRecommendationDataRepository salaryRecommendationRepository;

    @Autowired
    private PipelineTransitionDataRepository pipelineTransitionRepository;

    @Autowired
    private AuditLogDataRepository auditLogRepository;

    @Autowired
    private JobAdDataRepository jobAdRepository;

    @Autowired
    private RequisitionDataRepository requisitionRepository;

    @Autowired(required = false)
    private BackgroundCheckDataRepository backgroundCheckRepository;

    // ── Color & icon mappings ──────────────────────────

    private static final Map<String, String> ENTITY_COLORS = Map.of(
            "REQUISITION", "blue-600",
            "JOB_AD", "indigo-600",
            "APPLICATION", "purple-600",
            "INTERVIEW", "amber-600",
            "OFFER", "emerald-600",
            "SALARY_REC", "orange-600",
            "PIPELINE", "violet-600",
            "BACKGROUND_CHECK", "teal-600",
            "AUDIT", "gray-500"
    );

    private static final Map<String, String> ENTITY_ICONS = Map.of(
            "REQUISITION", "DocumentIcon",
            "JOB_AD", "MegaphoneIcon",
            "APPLICATION", "UserIcon",
            "INTERVIEW", "CalendarIcon",
            "OFFER", "GiftIcon",
            "SALARY_REC", "CurrencyDollarIcon",
            "PIPELINE", "ArrowPathIcon",
            "BACKGROUND_CHECK", "ShieldCheckIcon",
            "AUDIT", "ClockIcon"
    );

    // ── Public entry points ────────────────────────────

    /**
     * Build a full recruitment lifecycle for an application.
     */
    public RecruitmentLifecycle getByApplicationId(Long applicationId) {
        Application app = applicationRepository.findById(String.valueOf(applicationId))
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        List<LifecycleEvent> events = new ArrayList<>();

        // 1. Trace upward: Application -> JobPosting -> JobAd -> Requisition
        addApplicationEvents(events, app);
        traceUpstreamEntities(events, app);

        // 2. Load downstream entities
        addInterviewEvents(events, applicationId);
        addOfferEvents(events, applicationId);
        addSalaryRecommendationEvents(events, applicationId);
        addPipelineTransitionEvents(events, applicationId);
        addBackgroundCheckEvents(events, applicationId);

        // 3. Load audit log entries for the application
        addAuditLogEvents(events, "APPLICATION", applicationId.toString());

        // 4. Sort chronologically
        Collections.sort(events);

        return buildLifecycleDto(app, events);
    }

    /**
     * Build lifecycle views for all applications under a requisition.
     */
    public List<RecruitmentLifecycle> getByRequisitionId(Long requisitionId) {
        Requisition req = requisitionRepository.findById(String.valueOf(requisitionId))
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + requisitionId));

        // Find JobAds for this requisition
        List<JobAd> jobAds = jobAdRepository.findByRequisitionId(String.valueOf(requisitionId));
        if (jobAds.isEmpty()) {
            return Collections.emptyList();
        }

        // For each JobAd, we'd need to find the corresponding JobPostings and Applications
        // For now, return the requisition-level lifecycle
        List<RecruitmentLifecycle> lifecycles = new ArrayList<>();
        for (JobAd jobAd : jobAds) {
            // Find applications linked to JobPostings created from this JobAd
            // This would require additional repository query — simplified for now
            logger.info("Processing JobAd {} for requisition {}", jobAd.getId(), requisitionId);
        }

        return lifecycles;
    }

    /**
     * Get just the events (no summary) for an application.
     */
    public List<LifecycleEvent> getEventsByApplicationId(Long applicationId) {
        RecruitmentLifecycle lifecycle = getByApplicationId(applicationId);
        return lifecycle.getTimeline();
    }

    // ── Event builders ─────────────────────────────────

    private void addApplicationEvents(List<LifecycleEvent> events, Application app) {
        String appId = app.getId().toString();

        // Application submitted
        if (app.getSubmittedAt() != null) {
            LifecycleEvent e = new LifecycleEvent("APPLICATION", appId, "SUBMITTED",
                    "Application Submitted",
                    "Application submitted for " + (app.getJobPosting() != null ? app.getJobPosting().getTitle() : "position"),
                    app.getSubmittedAt());
            e.setStatus(app.getStatus() != null ? app.getStatus().name() : null);
            e.setIcon(ENTITY_ICONS.get("APPLICATION"));
            e.setColorClass(ENTITY_COLORS.get("APPLICATION"));
            events.add(e);
        }

        // Pipeline stage entered
        if (app.getPipelineStageEnteredAt() != null && app.getPipelineStage() != null) {
            LifecycleEvent e = new LifecycleEvent("APPLICATION", appId, "STAGE_ENTERED",
                    "Current Stage: " + app.getPipelineStageDisplayName(),
                    "Entered " + app.getPipelineStageDisplayName() + " stage",
                    app.getPipelineStageEnteredAt());
            e.setStatus(app.getPipelineStage().name());
            e.setIcon(ENTITY_ICONS.get("APPLICATION"));
            e.setColorClass(ENTITY_COLORS.get("APPLICATION"));
            events.add(e);
        }
    }

    private void traceUpstreamEntities(List<LifecycleEvent> events, Application app) {
        // Trace: Application -> JobPosting -> JobAd -> Requisition
        if (app.getJobPosting() != null) {
            JobPosting jp = app.getJobPosting();

            if (jp.getPublishedAt() != null) {
                LifecycleEvent e = new LifecycleEvent("JOB_AD", jp.getId().toString(), "PUBLISHED",
                        "Job Published: " + jp.getTitle(),
                        "Job posting published to " + jp.getDepartment(),
                        jp.getPublishedAt());
                e.setStatus(jp.getStatus() != null ? jp.getStatus().name() : null);
                e.setIcon(ENTITY_ICONS.get("JOB_AD"));
                e.setColorClass(ENTITY_COLORS.get("JOB_AD"));
                events.add(e);
            }

            if (jp.getCreatedAt() != null) {
                LifecycleEvent e = new LifecycleEvent("JOB_AD", jp.getId().toString(), "CREATED",
                        "Job Created: " + jp.getTitle(),
                        "Job posting created in " + jp.getDepartment(),
                        jp.getCreatedAt());
                e.setIcon(ENTITY_ICONS.get("JOB_AD"));
                e.setColorClass(ENTITY_COLORS.get("JOB_AD"));
                events.add(e);
            }
        }
    }

    private void addInterviewEvents(List<LifecycleEvent> events, Long applicationId) {
        List<Interview> interviews = interviewRepository.findByApplicationId(String.valueOf(applicationId));
        for (Interview iv : interviews) {
            String ivId = iv.getId().toString();

            // Interview scheduled
            LifecycleEvent scheduled = new LifecycleEvent("INTERVIEW", ivId, "SCHEDULED",
                    "Interview: " + iv.getTitle(),
                    (iv.getRound() != null ? iv.getRound().name() + " — " : "")
                            + (iv.getType() != null ? iv.getType().name() : "Interview"),
                    iv.getCreatedAt());
            scheduled.setStatus(iv.getStatus() != null ? iv.getStatus().name() : null);
            scheduled.setIcon(ENTITY_ICONS.get("INTERVIEW"));
            scheduled.setColorClass(ENTITY_COLORS.get("INTERVIEW"));
            scheduled.setMetadata(Map.of(
                    "scheduledAt", iv.getScheduledAt() != null ? iv.getScheduledAt().toString() : "",
                    "duration", iv.getDurationMinutes() != null ? iv.getDurationMinutes() : 60,
                    "interviewer", iv.getInterviewerName() != null ? iv.getInterviewerName() : ""
            ));
            events.add(scheduled);

            // Interview completed (if applicable)
            if (iv.getCompletedAt() != null) {
                LifecycleEvent completed = new LifecycleEvent("INTERVIEW", ivId, "COMPLETED",
                        "Interview Completed: " + iv.getTitle(),
                        "Recommendation: " + (iv.getRecommendation() != null ? iv.getRecommendation().name() : "Pending")
                                + (iv.getRating() != null ? " — Rating: " + iv.getRating() + "/5" : ""),
                        iv.getCompletedAt());
                completed.setStatus("COMPLETED");
                completed.setIcon(ENTITY_ICONS.get("INTERVIEW"));
                completed.setColorClass(ENTITY_COLORS.get("INTERVIEW"));
                events.add(completed);
            }
        }
    }

    private void addOfferEvents(List<LifecycleEvent> events, Long applicationId) {
        List<Offer> offers = offerRepository.findByApplicationId(String.valueOf(applicationId));
        for (Offer offer : offers) {
            String offerId = offer.getId().toString();

            // Offer created
            if (offer.getCreatedAt() != null) {
                LifecycleEvent created = new LifecycleEvent("OFFER", offerId, "CREATED",
                        "Offer Created: " + offer.getOfferNumber(),
                        offer.getJobTitle() + " — " + offer.getCurrency() + " "
                                + (offer.getBaseSalary() != null ? String.format("%,.0f", offer.getBaseSalary()) : "N/A"),
                        offer.getCreatedAt());
                created.setStatus(offer.getStatus() != null ? offer.getStatus().name() : null);
                created.setIcon(ENTITY_ICONS.get("OFFER"));
                created.setColorClass(ENTITY_COLORS.get("OFFER"));
                events.add(created);
            }

            // Offer sent
            if (offer.getOfferSentAt() != null) {
                LifecycleEvent sent = new LifecycleEvent("OFFER", offerId, "SENT",
                        "Offer Sent: " + offer.getOfferNumber(),
                        "Offer sent to candidate",
                        offer.getOfferSentAt());
                sent.setStatus("SENT");
                sent.setIcon(ENTITY_ICONS.get("OFFER"));
                sent.setColorClass(ENTITY_COLORS.get("OFFER"));
                events.add(sent);
            }

            // Offer accepted/declined
            if (offer.getAcceptedAt() != null) {
                LifecycleEvent accepted = new LifecycleEvent("OFFER", offerId, "ACCEPTED",
                        "Offer Accepted",
                        offer.getOfferNumber() + " accepted by candidate",
                        offer.getAcceptedAt());
                accepted.setStatus("ACCEPTED");
                accepted.setIcon(ENTITY_ICONS.get("OFFER"));
                accepted.setColorClass(ENTITY_COLORS.get("OFFER"));
                events.add(accepted);
            } else if (offer.getDeclinedAt() != null) {
                LifecycleEvent declined = new LifecycleEvent("OFFER", offerId, "DECLINED",
                        "Offer Declined",
                        offer.getOfferNumber() + " declined by candidate",
                        offer.getDeclinedAt());
                declined.setStatus("DECLINED");
                declined.setIcon(ENTITY_ICONS.get("OFFER"));
                declined.setColorClass(ENTITY_COLORS.get("OFFER"));
                events.add(declined);
            }
        }
    }

    private void addSalaryRecommendationEvents(List<LifecycleEvent> events, Long applicationId) {
        List<SalaryRecommendation> recs = salaryRecommendationRepository.findByApplicationId(String.valueOf(applicationId));
        for (SalaryRecommendation rec : recs) {
            LifecycleEvent e = new LifecycleEvent("SALARY_REC", rec.getId().toString(), "CREATED",
                    "Salary Recommendation: " + rec.getRecommendationNumber(),
                    "Status: " + (rec.getStatus() != null ? rec.getStatus().name() : "N/A"),
                    rec.getCreatedAt());
            e.setStatus(rec.getStatus() != null ? rec.getStatus().name() : null);
            e.setIcon(ENTITY_ICONS.get("SALARY_REC"));
            e.setColorClass(ENTITY_COLORS.get("SALARY_REC"));
            events.add(e);
        }
    }

    private void addPipelineTransitionEvents(List<LifecycleEvent> events, Long applicationId) {
        List<PipelineTransition> transitions = pipelineTransitionRepository
                .findByApplicationIdOrderByCreatedAtDesc(String.valueOf(applicationId));

        for (PipelineTransition pt : transitions) {
            String fromStage = pt.getFromStage() != null ? pt.getFromStage().name() : "Start";
            String toStage = pt.getToStage() != null ? pt.getToStage().name() : "Unknown";

            LifecycleEvent e = new LifecycleEvent("PIPELINE", pt.getId().toString(),
                    pt.getTransitionType() != null ? pt.getTransitionType().name() : "TRANSITION",
                    "Pipeline: " + fromStage + " -> " + toStage,
                    (pt.getReason() != null ? pt.getReason() : "")
                            + (pt.getAutomated() != null && pt.getAutomated() ? " (automated)" : ""),
                    pt.getEffectiveAt() != null ? pt.getEffectiveAt() : pt.getCreatedAt());
            e.setStatus(toStage);
            e.setPreviousStatus(fromStage);
            e.setPerformedBy(pt.getCreatedBy() != null ? pt.getCreatedBy().toString() : null);
            e.setIcon(ENTITY_ICONS.get("PIPELINE"));
            e.setColorClass(ENTITY_COLORS.get("PIPELINE"));

            if (pt.getDurationInPreviousStageHours() != null) {
                e.setMetadata(Map.of("durationHours", pt.getDurationInPreviousStageHours()));
            }

            events.add(e);
        }
    }

    private void addBackgroundCheckEvents(List<LifecycleEvent> events, Long applicationId) {
        if (backgroundCheckRepository == null) return;

        List<BackgroundCheck> checks = backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc(String.valueOf(applicationId));
        for (BackgroundCheck bc : checks) {
            // Check initiated
            LifecycleEvent initiated = new LifecycleEvent("BACKGROUND_CHECK", bc.getId().toString(), "INITIATED",
                    "Background Check: " + bc.getReferenceId(),
                    "Provider: " + (bc.getProvider() != null ? bc.getProvider() : "N/A")
                            + " — Types: " + (bc.getCheckTypes() != null ? bc.getCheckTypes() : ""),
                    bc.getCreatedAt());
            initiated.setStatus(bc.getStatus() != null ? bc.getStatus().name() : null);
            initiated.setIcon(ENTITY_ICONS.get("BACKGROUND_CHECK"));
            initiated.setColorClass(ENTITY_COLORS.get("BACKGROUND_CHECK"));
            events.add(initiated);

            // Check completed
            if (bc.getCompletedAt() != null) {
                LifecycleEvent completed = new LifecycleEvent("BACKGROUND_CHECK", bc.getId().toString(), "COMPLETED",
                        "Background Check Completed: " + bc.getReferenceId(),
                        "Result: " + (bc.getOverallResult() != null ? bc.getOverallResult().getDisplayName() : "Pending"),
                        bc.getCompletedAt());
                completed.setStatus("COMPLETED");
                completed.setIcon(ENTITY_ICONS.get("BACKGROUND_CHECK"));
                completed.setColorClass(ENTITY_COLORS.get("BACKGROUND_CHECK"));
                events.add(completed);
            }
        }
    }

    private void addAuditLogEvents(List<LifecycleEvent> events, String entityType, String entityId) {
        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);

        for (AuditLog log : logs) {
            LifecycleEvent e = new LifecycleEvent("AUDIT", log.getId().toString(), log.getAction(),
                    "Audit: " + log.getAction(),
                    log.getDetails() != null ? log.getDetails() : "",
                    log.getTimestamp());
            e.setPerformedBy(log.getUserId());
            e.setIcon(ENTITY_ICONS.get("AUDIT"));
            e.setColorClass(ENTITY_COLORS.get("AUDIT"));
            events.add(e);
        }
    }

    // ── DTO builder ────────────────────────────────────

    private RecruitmentLifecycle buildLifecycleDto(Application app, List<LifecycleEvent> events) {
        RecruitmentLifecycle lifecycle = new RecruitmentLifecycle();
        lifecycle.setApplicationId(app.getId());

        if (app.getApplicant() != null) {
            lifecycle.setApplicantName(app.getApplicant().getName() + " " + app.getApplicant().getSurname());
        }
        if (app.getJobPosting() != null) {
            lifecycle.setJobTitle(app.getJobPosting().getTitle());
            lifecycle.setDepartment(app.getJobPosting().getDepartment());
        }

        lifecycle.setCurrentStage(app.getPipelineStage() != null ? app.getPipelineStage().name() : null);
        lifecycle.setTimeline(events);
        lifecycle.setTotalEvents(events.size());

        // Compute summary counts
        Map<String, Integer> counts = events.stream()
                .collect(Collectors.groupingBy(LifecycleEvent::getEntityType,
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
        lifecycle.setEventCounts(counts);

        lifecycle.setInterviewCount(counts.getOrDefault("INTERVIEW", 0));
        lifecycle.setOfferCount(counts.getOrDefault("OFFER", 0));
        lifecycle.setStageTransitionCount(counts.getOrDefault("PIPELINE", 0));

        // Compute duration
        if (!events.isEmpty()) {
            lifecycle.setStartDate(events.get(0).getTimestamp());
            lifecycle.setEndDate(events.get(events.size() - 1).getTimestamp());

            if (lifecycle.getStartDate() != null && lifecycle.getEndDate() != null) {
                lifecycle.setTotalDurationHours(
                        ChronoUnit.HOURS.between(lifecycle.getStartDate(), lifecycle.getEndDate()));
            }
        }

        return lifecycle;
    }
}
