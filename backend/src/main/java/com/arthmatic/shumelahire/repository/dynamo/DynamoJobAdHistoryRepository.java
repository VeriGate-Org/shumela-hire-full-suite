package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdHistory;
import com.arthmatic.shumelahire.repository.JobAdHistoryDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.JobAdHistoryItem;

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
 * DynamoDB repository for the JobAdHistory entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     JOB_AD_HISTORY#{id}
 *   GSI1PK: JAH_ACTION#{action}       GSI1SK: JOB_AD_HISTORY#{timestamp}
 *   GSI2PK: JAH_JOBAD#{jobAdId}       GSI2SK: JOB_AD_HISTORY#{timestamp}
 *   GSI6PK: JAH_CREATED#{tenantId}    GSI6SK: JOB_AD_HISTORY#{timestamp}
 * </pre>
 */
@Repository
public class DynamoJobAdHistoryRepository extends DynamoRepository<JobAdHistoryItem, JobAdHistory>
        implements JobAdHistoryDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoJobAdHistoryRepository(DynamoDbClient dynamoDbClient,
                                         DynamoDbEnhancedClient enhancedClient,
                                         String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, JobAdHistoryItem.class);
    }

    @Override
    protected String entityType() {
        return "JOB_AD_HISTORY";
    }

    // -- JobAdHistoryDataRepository implementation ----------------------------

    @Override
    public List<JobAdHistory> findByJobAdIdOrderByTimestampDesc(String jobAdId) {
        return queryGsiAll("GSI2", "JAH_JOBAD#" + jobAdId).stream()
                .sorted(Comparator.comparing(JobAdHistory::getTimestamp,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAdHistory> findByAction(String action) {
        return queryGsiAll("GSI1", "JAH_ACTION#" + action);
    }

    @Override
    public List<JobAdHistory> findByActorUserId(String actorUserId) {
        return findAll().stream()
                .filter(h -> actorUserId.equals(h.getActorUserId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAdHistory> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate) {
        String gsi6pk = "JAH_CREATED#" + currentTenantId();
        String skStart = "JOB_AD_HISTORY#" + startDate.format(ISO_FMT);
        String skEnd = "JOB_AD_HISTORY#" + endDate.format(ISO_FMT);
        return queryGsiRange("GSI6", gsi6pk, skStart, skEnd, null, Integer.MAX_VALUE).content();
    }

    @Override
    public long countByAction(String action) {
        return findByAction(action).size();
    }

    @Override
    public List<JobAdHistory> findByJobAdIds(List<String> jobAdIds) {
        return jobAdIds.stream()
                .flatMap(jobAdId -> findByJobAdIdOrderByTimestampDesc(jobAdId).stream())
                .sorted(Comparator.comparing(JobAdHistory::getTimestamp,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // -- Conversion: JobAdHistoryItem <-> JobAdHistory ------------------------

    @Override
    protected JobAdHistory toEntity(JobAdHistoryItem item) {
        var entity = new JobAdHistory();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setTenantId(item.getTenantId());
        entity.setAction(item.getAction());
        entity.setActorUserId(item.getActorUserId());
        entity.setDetails(item.getDetails());
        if (item.getTimestamp() != null) {
            entity.setTimestamp(LocalDateTime.parse(item.getTimestamp(), ISO_FMT));
        }
        // FK: JobAd is stored as ID only; set a stub with the ID
        if (item.getJobAdId() != null) {
            var jobAd = new JobAd();
            jobAd.setId(Long.parseLong(item.getJobAdId()));
            entity.setJobAd(jobAd);
        }
        return entity;
    }

    @Override
    protected JobAdHistoryItem toItem(JobAdHistory entity) {
        var item = new JobAdHistoryItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String timestampStr = entity.getTimestamp() != null ? entity.getTimestamp().format(ISO_FMT) : "";
        String jobAdId = entity.getJobAd() != null && entity.getJobAd().getId() != null
                ? String.valueOf(entity.getJobAd().getId()) : "";

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("JOB_AD_HISTORY#" + id);

        // GSI1: Action index
        item.setGsi1pk("JAH_ACTION#" + (entity.getAction() != null ? entity.getAction() : ""));
        item.setGsi1sk("JOB_AD_HISTORY#" + timestampStr);

        // GSI2: Job ad FK lookup
        item.setGsi2pk("JAH_JOBAD#" + jobAdId);
        item.setGsi2sk("JOB_AD_HISTORY#" + timestampStr);

        // GSI6: Date range
        item.setGsi6pk("JAH_CREATED#" + tenantId);
        item.setGsi6sk("JOB_AD_HISTORY#" + timestampStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setJobAdId(jobAdId);
        item.setAction(entity.getAction());
        item.setActorUserId(entity.getActorUserId());
        item.setDetails(entity.getDetails());
        item.setTimestamp(timestampStr);

        return item;
    }
}
