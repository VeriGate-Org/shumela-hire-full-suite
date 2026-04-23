package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.InterviewFeedback;
import com.arthmatic.shumelahire.entity.InterviewRecommendation;
import com.arthmatic.shumelahire.repository.InterviewFeedbackDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.InterviewFeedbackItem;

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
 * DynamoDB repository for the InterviewFeedback entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     INTERVIEW_FEEDBACK#{id}
 *   GSI2PK: IFEEDBACK_INTERVIEW#{interviewId}    GSI2SK: INTERVIEW_FEEDBACK#{submittedAt}
 *   GSI4PK: IFEEDBACK_UNIQUE#{interviewId}#{submittedBy}  GSI4SK: INTERVIEW_FEEDBACK#{id}
 *   GSI5PK: IFEEDBACK_SUBMITTER#{submittedBy}    GSI5SK: INTERVIEW_FEEDBACK#{submittedAt}
 * </pre>
 */
@Repository
public class DynamoInterviewFeedbackRepository extends DynamoRepository<InterviewFeedbackItem, InterviewFeedback>
        implements InterviewFeedbackDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoInterviewFeedbackRepository(DynamoDbClient dynamoDbClient,
                                              DynamoDbEnhancedClient enhancedClient,
                                              String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, InterviewFeedbackItem.class);
    }

    @Override
    protected String entityType() {
        return "INTERVIEW_FEEDBACK";
    }

    // ── InterviewFeedbackDataRepository implementation ───────────────────────

    @Override
    public List<InterviewFeedback> findByInterviewIdOrderBySubmittedAtDesc(String interviewId) {
        return queryGsiAll("GSI2", "IFEEDBACK_INTERVIEW#" + interviewId).stream()
                .sorted(Comparator.comparing(InterviewFeedback::getSubmittedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<InterviewFeedback> findByInterviewIdAndSubmittedBy(String interviewId, String submittedBy) {
        return findByGsiUnique("GSI4", "IFEEDBACK_UNIQUE#" + interviewId + "#" + submittedBy);
    }

    @Override
    public boolean existsByInterviewIdAndSubmittedBy(String interviewId, String submittedBy) {
        return findByInterviewIdAndSubmittedBy(interviewId, submittedBy).isPresent();
    }

    @Override
    public long countByInterviewId(String interviewId) {
        return queryGsiAll("GSI2", "IFEEDBACK_INTERVIEW#" + interviewId).size();
    }

    @Override
    public List<InterviewFeedback> findByApplicationId(String applicationId) {
        // InterviewFeedback links to application through interview;
        // in DynamoDB we do a full scan and filter by application context.
        // For small datasets per tenant this is acceptable.
        return findAll().stream()
                .filter(fb -> fb.getInterview() != null
                        && fb.getInterview().getApplicationId() != null
                        && fb.getInterview().getApplicationId().equals(applicationId))
                .sorted(Comparator.comparing(InterviewFeedback::getSubmittedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Conversion: InterviewFeedbackItem <-> InterviewFeedback ──────────────

    @Override
    protected InterviewFeedback toEntity(InterviewFeedbackItem item) {
        var entity = new InterviewFeedback();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        if (item.getSubmittedBy() != null) {
            entity.setSubmittedBy(item.getSubmittedBy());
        }
        entity.setInterviewerName(item.getInterviewerName());
        entity.setFeedback(item.getFeedback());
        entity.setRating(item.getRating());
        entity.setCommunicationSkills(item.getCommunicationSkills());
        entity.setTechnicalSkills(item.getTechnicalSkills());
        entity.setCulturalFit(item.getCulturalFit());
        entity.setOverallImpression(item.getOverallImpression());
        if (item.getRecommendation() != null) {
            try {
                entity.setRecommendation(InterviewRecommendation.valueOf(item.getRecommendation()));
            } catch (IllegalArgumentException ignored) {}
        }
        entity.setNextSteps(item.getNextSteps());
        entity.setTechnicalAssessment(item.getTechnicalAssessment());
        entity.setCandidateQuestions(item.getCandidateQuestions());
        entity.setInterviewerNotes(item.getInterviewerNotes());
        if (item.getSubmittedAt() != null) {
            entity.setSubmittedAt(LocalDateTime.parse(item.getSubmittedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected InterviewFeedbackItem toItem(InterviewFeedback entity) {
        var item = new InterviewFeedbackItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();

        String submittedAtStr = entity.getSubmittedAt() != null
                ? entity.getSubmittedAt().format(ISO_FMT) : "";
        String submittedByStr = entity.getSubmittedBy() != null
                ? entity.getSubmittedBy() : "";
        String interviewId = entity.getInterview() != null && entity.getInterview().getId() != null
                ? entity.getInterview().getId() : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("INTERVIEW_FEEDBACK#" + id);

        // GSI2: Interview FK lookup
        item.setGsi2pk("IFEEDBACK_INTERVIEW#" + interviewId);
        item.setGsi2sk("INTERVIEW_FEEDBACK#" + submittedAtStr);

        // GSI4: Unique constraint — one feedback per interviewer per interview
        item.setGsi4pk("IFEEDBACK_UNIQUE#" + interviewId + "#" + submittedByStr);
        item.setGsi4sk("INTERVIEW_FEEDBACK#" + id);

        // GSI5: Submitter lookup
        item.setGsi5pk("IFEEDBACK_SUBMITTER#" + submittedByStr);
        item.setGsi5sk("INTERVIEW_FEEDBACK#" + submittedAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setInterviewId(interviewId);
        item.setSubmittedBy(submittedByStr.isEmpty() ? null : submittedByStr);
        item.setInterviewerName(entity.getInterviewerName());
        item.setFeedback(entity.getFeedback());
        item.setRating(entity.getRating());
        item.setCommunicationSkills(entity.getCommunicationSkills());
        item.setTechnicalSkills(entity.getTechnicalSkills());
        item.setCulturalFit(entity.getCulturalFit());
        item.setOverallImpression(entity.getOverallImpression());
        if (entity.getRecommendation() != null) {
            item.setRecommendation(entity.getRecommendation().name());
        }
        item.setNextSteps(entity.getNextSteps());
        item.setTechnicalAssessment(entity.getTechnicalAssessment());
        item.setCandidateQuestions(entity.getCandidateQuestions());
        item.setInterviewerNotes(entity.getInterviewerNotes());
        if (entity.getSubmittedAt() != null) {
            item.setSubmittedAt(submittedAtStr);
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
