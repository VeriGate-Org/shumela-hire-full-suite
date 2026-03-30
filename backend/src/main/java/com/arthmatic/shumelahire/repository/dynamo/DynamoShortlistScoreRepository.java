package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.ShortlistScore;
import com.arthmatic.shumelahire.repository.ShortlistScoreDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ShortlistScoreItem;

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
 * DynamoDB repository for the ShortlistScore entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     SHORTLIST#{id}
 *   GSI2PK: SHORTLIST_APP#{applicationId}         GSI2SK: SHORTLIST#{id}
 *   GSI5PK: SHORTLIST_JOB#{jobPostingId}          GSI5SK: SHORTLIST#SCORE#{paddedScore}
 * </pre>
 * <p>
 * GSI5 sort key uses a zero-padded score format so DynamoDB string sorting
 * produces descending-compatible ordering when reversed in-memory.
 */
@Repository
public class DynamoShortlistScoreRepository extends DynamoRepository<ShortlistScoreItem, ShortlistScore>
        implements ShortlistScoreDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoShortlistScoreRepository(DynamoDbClient dynamoDbClient,
                                           DynamoDbEnhancedClient enhancedClient,
                                           String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ShortlistScoreItem.class);
    }

    @Override
    protected String entityType() {
        return "SHORTLIST";
    }

    // -- ShortlistScoreDataRepository implementation --------------------------

    @Override
    public Optional<ShortlistScore> findByApplicationId(String applicationId) {
        return findByGsiUnique("GSI2", "SHORTLIST_APP#" + applicationId);
    }

    @Override
    public List<ShortlistScore> findByJobPostingIdOrderByScore(String jobPostingId) {
        return queryGsiAll("GSI5", "SHORTLIST_JOB#" + jobPostingId).stream()
                .sorted(Comparator.comparing(ShortlistScore::getTotalScore,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<ShortlistScore> findShortlistableByThreshold(String jobPostingId, Double threshold) {
        return queryGsiAll("GSI5", "SHORTLIST_JOB#" + jobPostingId).stream()
                .filter(s -> s.getTotalScore() != null && s.getTotalScore() >= threshold)
                .sorted(Comparator.comparing(ShortlistScore::getTotalScore,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // -- Conversion: ShortlistScoreItem <-> ShortlistScore --------------------

    @Override
    protected ShortlistScore toEntity(ShortlistScoreItem item) {
        var entity = new ShortlistScore();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setTotalScore(item.getTotalScore());
        entity.setSkillsMatchScore(item.getSkillsMatchScore());
        entity.setExperienceScore(item.getExperienceScore());
        entity.setEducationScore(item.getEducationScore());
        entity.setScreeningScore(item.getScreeningScore());
        entity.setKeywordMatchScore(item.getKeywordMatchScore());
        entity.setScoreBreakdown(item.getScoreBreakdown());
        entity.setIsShortlisted(item.getIsShortlisted());
        entity.setManuallyOverridden(item.getManuallyOverridden());
        entity.setOverrideReason(item.getOverrideReason());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected ShortlistScoreItem toItem(ShortlistScore entity) {
        var item = new ShortlistScoreItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("SHORTLIST#" + id);

        // GSI2: Application FK lookup (unique per application)
        String appId = "";
        if (entity.getApplication() != null && entity.getApplication().getId() != null) {
            appId = entity.getApplication().getId().toString();
        }
        item.setGsi2pk("SHORTLIST_APP#" + appId);
        item.setGsi2sk("SHORTLIST#" + id);

        // GSI5: Job posting lookup, sorted by score
        String jobPostingId = "";
        if (entity.getApplication() != null && entity.getApplication().getJobPostingId() != null) {
            jobPostingId = entity.getApplication().getJobPostingId().toString();
        }
        // Zero-pad score to 10 digits for string-based sort ordering
        String paddedScore = entity.getTotalScore() != null
                ? String.format("%010.4f", entity.getTotalScore()) : "0000000.0000";
        item.setGsi5pk("SHORTLIST_JOB#" + jobPostingId);
        item.setGsi5sk("SHORTLIST#SCORE#" + paddedScore);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setApplicationId(appId.isEmpty() ? null : appId);
        item.setJobPostingId(jobPostingId.isEmpty() ? null : jobPostingId);
        item.setTotalScore(entity.getTotalScore());
        item.setSkillsMatchScore(entity.getSkillsMatchScore());
        item.setExperienceScore(entity.getExperienceScore());
        item.setEducationScore(entity.getEducationScore());
        item.setScreeningScore(entity.getScreeningScore());
        item.setKeywordMatchScore(entity.getKeywordMatchScore());
        item.setScoreBreakdown(entity.getScoreBreakdown());
        item.setIsShortlisted(entity.getIsShortlisted());
        item.setManuallyOverridden(entity.getManuallyOverridden());
        item.setOverrideReason(entity.getOverrideReason());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
