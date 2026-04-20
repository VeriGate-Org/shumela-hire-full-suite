package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.JobBoardPostingItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the JobBoardPosting entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     JOB_BOARD_POSTING#{id}
 *   GSI1PK: JBP_STATUS#{status}            GSI1SK: JOB_BOARD_POSTING#{postedAt}
 *   GSI2PK: JBP_JOBPOSTING#{jobPostingId}  GSI2SK: JOB_BOARD_POSTING#{id}
 * </pre>
 */
@Repository
public class DynamoJobBoardPostingRepository extends DynamoRepository<JobBoardPostingItem, JobBoardPosting>
        implements JobBoardPostingDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoJobBoardPostingRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, JobBoardPostingItem.class);
    }

    @Override
    protected String entityType() {
        return "JOB_BOARD_POSTING";
    }

    // -- JobBoardPostingDataRepository implementation -------------------------

    @Override
    public List<JobBoardPosting> findByJobPostingId(String jobPostingId) {
        return queryGsiAll("GSI2", "JBP_JOBPOSTING#" + jobPostingId);
    }

    @Override
    public List<JobBoardPosting> findByStatus(PostingStatus status) {
        return queryGsiAll("GSI1", "JBP_STATUS#" + status.name());
    }

    @Override
    public List<JobBoardPosting> findByBoardTypeAndStatus(JobBoardType boardType, PostingStatus status) {
        return findByStatus(status).stream()
                .filter(p -> boardType.equals(p.getBoardType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobBoardPosting> findExpiredPostings(LocalDateTime now) {
        return findByStatus(PostingStatus.POSTED).stream()
                .filter(p -> p.getExpiresAt() != null && p.getExpiresAt().isBefore(now))
                .collect(Collectors.toList());
    }

    // -- Conversion: JobBoardPostingItem <-> JobBoardPosting ------------------

    @Override
    protected JobBoardPosting toEntity(JobBoardPostingItem item) {
        var entity = new JobBoardPosting();
        if (item.getId() != null) {
            entity.setId(safeParseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setJobPostingId(item.getJobPostingId());
        if (item.getBoardType() != null) {
            entity.setBoardType(JobBoardType.valueOf(item.getBoardType()));
        }
        if (item.getStatus() != null) {
            entity.setStatus(PostingStatus.valueOf(item.getStatus()));
        }
        entity.setExternalPostId(item.getExternalPostId());
        entity.setExternalUrl(item.getExternalUrl());
        if (item.getPostedAt() != null) {
            entity.setPostedAt(LocalDateTime.parse(item.getPostedAt(), ISO_FMT));
        }
        if (item.getExpiresAt() != null) {
            entity.setExpiresAt(LocalDateTime.parse(item.getExpiresAt(), ISO_FMT));
        }
        entity.setViewCount(item.getViewCount());
        entity.setClickCount(item.getClickCount());
        entity.setApplicationCount(item.getApplicationCount());
        entity.setErrorMessage(item.getErrorMessage());
        entity.setBoardConfig(item.getBoardConfig());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entity;
    }

    @Override
    protected JobBoardPostingItem toItem(JobBoardPosting entity) {
        var item = new JobBoardPostingItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : "";
        String postedAtStr = entity.getPostedAt() != null ? entity.getPostedAt().format(ISO_FMT) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("JOB_BOARD_POSTING#" + id);

        // GSI1: Status index
        item.setGsi1pk("JBP_STATUS#" + statusStr);
        item.setGsi1sk("JOB_BOARD_POSTING#" + postedAtStr);

        // GSI2: Job posting FK lookup
        String jobPostingId = entity.getJobPostingId() != null ? entity.getJobPostingId() : "";
        item.setGsi2pk("JBP_JOBPOSTING#" + jobPostingId);
        item.setGsi2sk("JOB_BOARD_POSTING#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setJobPostingId(entity.getJobPostingId());
        if (entity.getBoardType() != null) {
            item.setBoardType(entity.getBoardType().name());
        }
        item.setStatus(statusStr);
        item.setExternalPostId(entity.getExternalPostId());
        item.setExternalUrl(entity.getExternalUrl());
        item.setPostedAt(postedAtStr);
        if (entity.getExpiresAt() != null) {
            item.setExpiresAt(entity.getExpiresAt().format(ISO_FMT));
        }
        item.setViewCount(entity.getViewCount());
        item.setClickCount(entity.getClickCount());
        item.setApplicationCount(entity.getApplicationCount());
        item.setErrorMessage(entity.getErrorMessage());
        item.setBoardConfig(entity.getBoardConfig());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
