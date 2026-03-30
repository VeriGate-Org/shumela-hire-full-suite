package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewRecommendation;
import com.arthmatic.shumelahire.entity.InterviewRound;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.InterviewType;
import com.arthmatic.shumelahire.repository.InterviewDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.InterviewItem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Interview entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     INTERVIEW#{id}
 *   GSI1PK: INTERVIEW_STATUS#{status}        GSI1SK: INTERVIEW#{scheduledAt}
 *   GSI2PK: INTERVIEW_APP#{applicationId}    GSI2SK: INTERVIEW#{scheduledAt}
 *   GSI5PK: INTERVIEW_INTERVIEWER#{interviewerId}  GSI5SK: INTERVIEW#{scheduledAt}
 *   GSI6PK: INTERVIEW_DATE#{tenantId}        GSI6SK: #{scheduledAt}
 * </pre>
 */
@Repository
public class DynamoInterviewRepository extends DynamoRepository<InterviewItem, Interview>
        implements InterviewDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoInterviewRepository(DynamoDbClient dynamoDbClient,
                                      DynamoDbEnhancedClient enhancedClient,
                                      String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, InterviewItem.class);
    }

    @Override
    protected String entityType() {
        return "INTERVIEW";
    }

    // ── InterviewDataRepository implementation ───────────────────────────────

    @Override
    public Optional<Interview> findByIdWithDetails(String id) {
        // In DynamoDB, all fields are stored flat — no lazy loading distinction
        return findById(id);
    }

    @Override
    public List<Interview> findByApplicationId(String applicationId) {
        return queryGsiAll("GSI2", "INTERVIEW_APP#" + applicationId);
    }

    @Override
    public List<Interview> findByInterviewerId(String interviewerId) {
        return queryGsiAll("GSI5", "INTERVIEW_INTERVIEWER#" + interviewerId);
    }

    @Override
    public List<Interview> findByStatus(InterviewStatus status) {
        return queryGsiAll("GSI1", "INTERVIEW_STATUS#" + status.name());
    }

    @Override
    public List<Interview> findByType(InterviewType type) {
        return findAll().stream()
                .filter(i -> type.equals(i.getType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findByRound(InterviewRound round) {
        return findAll().stream()
                .filter(i -> round.equals(i.getRound()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findByScheduledAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        String tenantId = currentTenantId();
        String skStart = startDate.format(ISO_FMT);
        String skEnd = endDate.format(ISO_FMT);
        return queryGsiRange("GSI6", "INTERVIEW_DATE#" + tenantId, skStart, skEnd, null, 1000)
                .content();
    }

    @Override
    public List<Interview> findInterviewerSchedule(String interviewerId,
                                                   LocalDateTime startDate,
                                                   LocalDateTime endDate) {
        return queryGsiAll("GSI5", "INTERVIEW_INTERVIEWER#" + interviewerId).stream()
                .filter(i -> i.getScheduledAt() != null
                        && !i.getScheduledAt().isBefore(startDate)
                        && i.getScheduledAt().isBefore(endDate)
                        && (i.getStatus() == InterviewStatus.SCHEDULED
                            || i.getStatus() == InterviewStatus.RESCHEDULED))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findOverdueInterviews(LocalDateTime now) {
        return queryGsiAll("GSI1", "INTERVIEW_STATUS#SCHEDULED").stream()
                .filter(i -> i.getScheduledAt() != null && !i.getScheduledAt().isAfter(now))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findUpcomingInterviews(LocalDateTime now, LocalDateTime futureTime) {
        return queryGsiAll("GSI1", "INTERVIEW_STATUS#SCHEDULED").stream()
                .filter(i -> i.getScheduledAt() != null
                        && i.getScheduledAt().isAfter(now)
                        && i.getScheduledAt().isBefore(futureTime))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findByApplicationIdOrderByScheduledAtDesc(String applicationId) {
        return queryGsiAll("GSI2", "INTERVIEW_APP#" + applicationId).stream()
                .sorted(Comparator.comparing(Interview::getScheduledAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findInterviewsNeedingReminders(LocalDateTime now, LocalDateTime reminderTime) {
        return queryGsiAll("GSI1", "INTERVIEW_STATUS#SCHEDULED").stream()
                .filter(i -> i.getScheduledAt() != null
                        && i.getScheduledAt().isAfter(now)
                        && i.getScheduledAt().isBefore(reminderTime)
                        && (i.getReminderSentAt() == null))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findInterviewsRequiringFeedback() {
        return queryGsiAll("GSI1", "INTERVIEW_STATUS#COMPLETED").stream()
                .filter(i -> i.getFeedback() == null)
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findByRecommendation(InterviewRecommendation recommendation) {
        return findAll().stream()
                .filter(i -> recommendation.equals(i.getRecommendation()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findHireRecommendationsByApplication(String applicationId) {
        return queryGsiAll("GSI2", "INTERVIEW_APP#" + applicationId).stream()
                .filter(i -> i.getStatus() == InterviewStatus.COMPLETED
                        && i.getRecommendation() == InterviewRecommendation.HIRE)
                .collect(Collectors.toList());
    }

    @Override
    public long countInterviewsByInterviewerAndDateRange(String interviewerId,
                                                         LocalDateTime startDate,
                                                         LocalDateTime endDate) {
        return queryGsiAll("GSI5", "INTERVIEW_INTERVIEWER#" + interviewerId).stream()
                .filter(i -> i.getScheduledAt() != null
                        && !i.getScheduledAt().isBefore(startDate)
                        && i.getScheduledAt().isBefore(endDate))
                .count();
    }

    @Override
    public long countByScheduledAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return findByScheduledAtBetween(startDate, endDate).size();
    }

    // ── Additional methods ──────────────────────────────────────────────────

    @Override
    public Page<Interview> searchInterviews(String searchTerm, InterviewStatus status,
                                             InterviewType type, InterviewRound round,
                                             Long interviewerId, LocalDateTime startDate,
                                             LocalDateTime endDate, Pageable pageable) {
        // DynamoDB: filter in-memory from full scan (acceptable for per-tenant data sets)
        List<Interview> all = findAll().stream()
                .filter(i -> searchTerm == null || searchTerm.isBlank()
                        || (i.getTitle() != null && i.getTitle().toLowerCase().contains(searchTerm.toLowerCase())))
                .filter(i -> status == null || status.equals(i.getStatus()))
                .filter(i -> type == null || type.equals(i.getType()))
                .filter(i -> round == null || round.equals(i.getRound()))
                .filter(i -> interviewerId == null || interviewerId.equals(i.getInterviewerId()))
                .filter(i -> startDate == null || (i.getScheduledAt() != null && !i.getScheduledAt().isBefore(startDate)))
                .filter(i -> endDate == null || (i.getScheduledAt() != null && !i.getScheduledAt().isAfter(endDate)))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<Interview> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    @Override
    public List<Interview> findPotentialInterviewerConflicts(String interviewerId, LocalDateTime endTime) {
        return queryGsiAll("GSI5", "INTERVIEW_INTERVIEWER#" + interviewerId).stream()
                .filter(i -> (i.getStatus() == InterviewStatus.SCHEDULED
                        || i.getStatus() == InterviewStatus.RESCHEDULED)
                        && i.getScheduledAt() != null
                        && i.getScheduledAt().isBefore(endTime))
                .collect(Collectors.toList());
    }

    @Override
    public List<Interview> findPotentialMeetingRoomConflicts(String meetingRoom, LocalDateTime endTime) {
        return findAll().stream()
                .filter(i -> meetingRoom.equals(i.getMeetingRoom())
                        && (i.getStatus() == InterviewStatus.SCHEDULED
                            || i.getStatus() == InterviewStatus.RESCHEDULED)
                        && i.getScheduledAt() != null
                        && i.getScheduledAt().isBefore(endTime))
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getInterviewStatusStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be handled by Athena pipeline");
    }

    @Override
    public List<Object[]> getInterviewRoundStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be handled by Athena pipeline");
    }

    @Override
    public Optional<Double> getAverageInterviewRating(LocalDateTime startDate, LocalDateTime endDate) {
        throw new UnsupportedOperationException("Analytics queries will be handled by Athena pipeline");
    }

    @Override
    public List<Interview> findByDate(LocalDateTime date) {
        // Filter all interviews to those scheduled on the same calendar day
        return findAll().stream()
                .filter(i -> i.getScheduledAt() != null
                        && i.getScheduledAt().toLocalDate().equals(date.toLocalDate()))
                .collect(Collectors.toList());
    }

    // ── Conversion: InterviewItem <-> Interview ──────────────────────────────

    @Override
    protected Interview toEntity(InterviewItem item) {
        var entity = new Interview();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        if (item.getApplicationId() != null) {
            entity.setApplicationId(Long.parseLong(item.getApplicationId()));
        }
        entity.setTitle(item.getTitle());
        if (item.getType() != null) {
            entity.setType(InterviewType.valueOf(item.getType()));
        }
        if (item.getRound() != null) {
            entity.setRound(InterviewRound.valueOf(item.getRound()));
        }
        if (item.getStatus() != null) {
            entity.setStatus(InterviewStatus.valueOf(item.getStatus()));
        }
        if (item.getScheduledAt() != null) {
            entity.setScheduledAt(LocalDateTime.parse(item.getScheduledAt(), ISO_FMT));
        }
        entity.setDurationMinutes(item.getDurationMinutes());
        entity.setLocation(item.getLocation());
        entity.setMeetingLink(item.getMeetingLink());
        entity.setMeetingUrl(item.getMeetingUrl());
        entity.setPhoneNumber(item.getPhoneNumber());
        entity.setMeetingRoom(item.getMeetingRoom());
        entity.setInstructions(item.getInstructions());
        entity.setAgenda(item.getAgenda());
        if (item.getInterviewerId() != null) {
            entity.setInterviewerId(Long.parseLong(item.getInterviewerId()));
        }
        entity.setInterviewerName(item.getInterviewerName());
        entity.setInterviewerEmail(item.getInterviewerEmail());
        entity.setAdditionalInterviewers(item.getAdditionalInterviewers());
        entity.setFeedback(item.getFeedback());
        entity.setRating(item.getRating());
        entity.setTechnicalAssessment(item.getTechnicalAssessment());
        entity.setCommunicationSkills(item.getCommunicationSkills());
        entity.setTechnicalSkills(item.getTechnicalSkills());
        entity.setCulturalFit(item.getCulturalFit());
        entity.setTechnicalScore(item.getTechnicalScore());
        entity.setCommunicationScore(item.getCommunicationScore());
        entity.setCulturalFitScore(item.getCulturalFitScore());
        entity.setOverallImpression(item.getOverallImpression());
        if (item.getRecommendation() != null) {
            try {
                entity.setRecommendation(InterviewRecommendation.valueOf(item.getRecommendation()));
            } catch (IllegalArgumentException ignored) {}
        }
        entity.setNextSteps(item.getNextSteps());
        entity.setCandidateQuestions(item.getCandidateQuestions());
        entity.setInterviewerNotes(item.getInterviewerNotes());
        entity.setQuestions(item.getQuestions());
        entity.setAnswers(item.getAnswers());
        entity.setNotes(item.getNotes());
        entity.setPreparationNotes(item.getPreparationNotes());
        if (item.getRescheduledFrom() != null) {
            entity.setRescheduledFrom(LocalDateTime.parse(item.getRescheduledFrom(), ISO_FMT));
        }
        entity.setRescheduleReason(item.getRescheduleReason());
        entity.setRescheduleCount(item.getRescheduleCount());
        entity.setReminderSent(item.getReminderSent());
        entity.setConfirmationReceived(item.getConfirmationReceived());
        if (item.getReminderSentAt() != null) {
            entity.setReminderSentAt(LocalDateTime.parse(item.getReminderSentAt(), ISO_FMT));
        }
        if (item.getFeedbackRequestedAt() != null) {
            entity.setFeedbackRequestedAt(LocalDateTime.parse(item.getFeedbackRequestedAt(), ISO_FMT));
        }
        if (item.getFeedbackSubmittedAt() != null) {
            entity.setFeedbackSubmittedAt(LocalDateTime.parse(item.getFeedbackSubmittedAt(), ISO_FMT));
        }
        if (item.getCreatedBy() != null) {
            entity.setCreatedBy(Long.parseLong(item.getCreatedBy()));
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getStartedAt() != null) {
            entity.setStartedAt(LocalDateTime.parse(item.getStartedAt(), ISO_FMT));
        }
        if (item.getCompletedAt() != null) {
            entity.setCompletedAt(LocalDateTime.parse(item.getCompletedAt(), ISO_FMT));
        }
        if (item.getCancelledAt() != null) {
            entity.setCancelledAt(LocalDateTime.parse(item.getCancelledAt(), ISO_FMT));
        }
        entity.setCancellationReason(item.getCancellationReason());
        return entity;
    }

    @Override
    protected InterviewItem toItem(Interview entity) {
        var item = new InterviewItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String scheduledAtStr = entity.getScheduledAt() != null
                ? entity.getScheduledAt().format(ISO_FMT) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("INTERVIEW#" + id);

        // GSI1: Status index
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "SCHEDULED";
        item.setGsi1pk("INTERVIEW_STATUS#" + statusStr);
        item.setGsi1sk("INTERVIEW#" + scheduledAtStr);

        // GSI2: Application FK lookup
        String appId = "";
        if (entity.getApplicationId() != null) {
            appId = entity.getApplicationId().toString();
        } else if (entity.getApplication() != null && entity.getApplication().getId() != null) {
            appId = entity.getApplication().getId().toString();
        }
        item.setGsi2pk("INTERVIEW_APP#" + appId);
        item.setGsi2sk("INTERVIEW#" + scheduledAtStr);

        // GSI5: Interviewer lookup
        String interviewerIdStr = entity.getInterviewerId() != null
                ? entity.getInterviewerId().toString() : "";
        item.setGsi5pk("INTERVIEW_INTERVIEWER#" + interviewerIdStr);
        item.setGsi5sk("INTERVIEW#" + scheduledAtStr);

        // GSI6: Date range queries
        item.setGsi6pk("INTERVIEW_DATE#" + tenantId);
        item.setGsi6sk(scheduledAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setApplicationId(appId);
        item.setTitle(entity.getTitle());
        if (entity.getType() != null) {
            item.setType(entity.getType().name());
        }
        if (entity.getRound() != null) {
            item.setRound(entity.getRound().name());
        }
        item.setStatus(statusStr);
        if (entity.getScheduledAt() != null) {
            item.setScheduledAt(scheduledAtStr);
        }
        item.setDurationMinutes(entity.getDurationMinutes());
        item.setLocation(entity.getLocation());
        item.setMeetingLink(entity.getMeetingLink());
        item.setMeetingUrl(entity.getMeetingUrl());
        item.setPhoneNumber(entity.getPhoneNumber());
        item.setMeetingRoom(entity.getMeetingRoom());
        item.setInstructions(entity.getInstructions());
        item.setAgenda(entity.getAgenda());
        item.setInterviewerId(interviewerIdStr.isEmpty() ? null : interviewerIdStr);
        item.setInterviewerName(entity.getInterviewerName());
        item.setInterviewerEmail(entity.getInterviewerEmail());
        item.setAdditionalInterviewers(entity.getAdditionalInterviewers());
        item.setFeedback(entity.getFeedback());
        item.setRating(entity.getRating());
        item.setTechnicalAssessment(entity.getTechnicalAssessment());
        item.setCommunicationSkills(entity.getCommunicationSkills());
        item.setTechnicalSkills(entity.getTechnicalSkills());
        item.setCulturalFit(entity.getCulturalFit());
        item.setTechnicalScore(entity.getTechnicalScore());
        item.setCommunicationScore(entity.getCommunicationScore());
        item.setCulturalFitScore(entity.getCulturalFitScore());
        item.setOverallImpression(entity.getOverallImpression());
        if (entity.getRecommendation() != null) {
            item.setRecommendation(entity.getRecommendation().name());
        }
        item.setNextSteps(entity.getNextSteps());
        item.setCandidateQuestions(entity.getCandidateQuestions());
        item.setInterviewerNotes(entity.getInterviewerNotes());
        item.setQuestions(entity.getQuestions());
        item.setAnswers(entity.getAnswers());
        item.setNotes(entity.getNotes());
        item.setPreparationNotes(entity.getPreparationNotes());
        if (entity.getRescheduledFrom() != null) {
            item.setRescheduledFrom(entity.getRescheduledFrom().format(ISO_FMT));
        }
        item.setRescheduleReason(entity.getRescheduleReason());
        item.setRescheduleCount(entity.getRescheduleCount());
        item.setReminderSent(entity.getReminderSent());
        item.setConfirmationReceived(entity.getConfirmationReceived());
        if (entity.getReminderSentAt() != null) {
            item.setReminderSentAt(entity.getReminderSentAt().format(ISO_FMT));
        }
        if (entity.getFeedbackRequestedAt() != null) {
            item.setFeedbackRequestedAt(entity.getFeedbackRequestedAt().format(ISO_FMT));
        }
        if (entity.getFeedbackSubmittedAt() != null) {
            item.setFeedbackSubmittedAt(entity.getFeedbackSubmittedAt().format(ISO_FMT));
        }
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy().toString());
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getStartedAt() != null) {
            item.setStartedAt(entity.getStartedAt().format(ISO_FMT));
        }
        if (entity.getCompletedAt() != null) {
            item.setCompletedAt(entity.getCompletedAt().format(ISO_FMT));
        }
        if (entity.getCancelledAt() != null) {
            item.setCancelledAt(entity.getCancelledAt().format(ISO_FMT));
        }
        item.setCancellationReason(entity.getCancellationReason());

        return item;
    }
}
