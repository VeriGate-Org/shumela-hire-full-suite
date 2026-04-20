package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import com.arthmatic.shumelahire.repository.JobAdDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.JobAdItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the JobAd entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     JOB_AD#{id}
 *   GSI1PK: JOBAD_STATUS#{status}              GSI1SK: JOB_AD#{createdAt}
 *   GSI2PK: JOBAD_POSTING#{jobPostingId}        GSI2SK: JOB_AD#{id}
 *   GSI4PK: JOBAD_SLUG#{tenantId}#{slug}        GSI4SK: JOB_AD#{id}
 *   GSI6PK: JOBAD_CREATED#{tenantId}            GSI6SK: JOB_AD#{createdAt}
 * </pre>
 */
@Repository
public class DynamoJobAdRepository extends DynamoRepository<JobAdItem, JobAd>
        implements JobAdDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoJobAdRepository(DynamoDbClient dynamoDbClient,
                                  DynamoDbEnhancedClient enhancedClient,
                                  String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, JobAdItem.class);
    }

    @Override
    protected String entityType() {
        return "JOB_AD";
    }

    // ── JobAdDataRepository implementation ──────────────────────────────────

    @Override
    public Optional<JobAd> findBySlug(String slug) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "JOBAD_SLUG#" + tenantId + "#" + slug);
    }

    @Override
    public List<JobAd> findByStatus(JobAdStatus status) {
        // Query GSI1 which is keyed by status (tenant-scoped via GSI1PK)
        return queryGsiAll("GSI1", "JOBAD_STATUS#" + currentTenantId() + "#" + status.name());
    }

    @Override
    public CursorPage<JobAd> findByStatusPaginated(JobAdStatus status, String cursor, int pageSize) {
        return queryGsi("GSI1", "JOBAD_STATUS#" + currentTenantId() + "#" + status.name(),
                "JOB_AD#", cursor, pageSize);
    }

    @Override
    public List<JobAd> findByInternalChannel() {
        return findAll().stream()
                .filter(ad -> Boolean.TRUE.equals(ad.getChannelInternal()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAd> findByExternalChannel() {
        return findAll().stream()
                .filter(ad -> Boolean.TRUE.equals(ad.getChannelExternal()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAd> findByRequisitionId(String requisitionId) {
        return findAll().stream()
                .filter(ad -> requisitionId.equals(
                        ad.getRequisitionId() != null ? ad.getRequisitionId().toString() : null))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<JobAd> findByJobPostingId(String jobPostingId) {
        List<JobAd> results = queryGsiAll("GSI2", "JOBAD_POSTING#" + jobPostingId);
        return results.stream().findFirst();
    }

    @Override
    public CursorPage<JobAd> findWithFilters(JobAdStatus status, Boolean channelInternal,
                                              Boolean channelExternal, String searchQuery,
                                              String cursor, int pageSize) {
        String lowerSearch = searchQuery != null ? searchQuery.toLowerCase() : null;
        List<JobAd> filtered = findAll().stream()
                .filter(ad -> status == null || ad.getStatus() == status)
                .filter(ad -> channelInternal == null || channelInternal.equals(ad.getChannelInternal()))
                .filter(ad -> channelExternal == null || channelExternal.equals(ad.getChannelExternal()))
                .filter(ad -> lowerSearch == null || lowerSearch.isBlank() ||
                        (ad.getTitle() != null && ad.getTitle().toLowerCase().contains(lowerSearch)) ||
                        (ad.getHtmlBody() != null && ad.getHtmlBody().toLowerCase().contains(lowerSearch)))
                .collect(Collectors.toList());

        return paginateInMemory(filtered, cursor, pageSize);
    }

    @Override
    public List<JobAd> findActiveExternalAds(LocalDate currentDate) {
        return findByStatus(JobAdStatus.PUBLISHED).stream()
                .filter(ad -> Boolean.TRUE.equals(ad.getChannelExternal()))
                .filter(ad -> ad.getClosingDate() == null || !ad.getClosingDate().isBefore(currentDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAd> findActiveInternalAds(LocalDate currentDate) {
        return findByStatus(JobAdStatus.PUBLISHED).stream()
                .filter(ad -> Boolean.TRUE.equals(ad.getChannelInternal()))
                .filter(ad -> ad.getClosingDate() == null || !ad.getClosingDate().isBefore(currentDate))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<JobAd> findActiveInternalAdsPaged(LocalDate currentDate, String cursor, int pageSize) {
        List<JobAd> active = findActiveInternalAds(currentDate);
        return paginateInMemory(active, cursor, pageSize);
    }

    @Override
    public List<JobAd> findAdsToExpire(LocalDate currentDate) {
        return findByStatus(JobAdStatus.PUBLISHED).stream()
                .filter(ad -> ad.getClosingDate() != null && ad.getClosingDate().isBefore(currentDate))
                .collect(Collectors.toList());
    }

    @Override
    public int markExpiredAds(LocalDate currentDate) {
        List<JobAd> toExpire = findAdsToExpire(currentDate);
        for (JobAd ad : toExpire) {
            ad.setStatus(JobAdStatus.EXPIRED);
            ad.setUpdatedAt(LocalDateTime.now());
            save(ad);
        }
        return toExpire.size();
    }

    @Override
    public boolean existsBySlug(String slug) {
        return findBySlug(slug).isPresent();
    }

    @Override
    public CursorPage<JobAd> findByCreatedBy(String createdBy, String cursor, int pageSize) {
        List<JobAd> filtered = findAll().stream()
                .filter(ad -> createdBy.equals(ad.getCreatedBy()))
                .sorted(Comparator.comparing(JobAd::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
        return paginateInMemory(filtered, cursor, pageSize);
    }

    @Override
    public long countByStatus(JobAdStatus status) {
        return findByStatus(status).size();
    }

    @Override
    public CursorPage<JobAd> findRecentAds(String cursor, int pageSize) {
        return queryGsi("GSI6", "JOBAD_CREATED#" + currentTenantId(), "JOB_AD#", cursor, pageSize);
    }

    // ── Conversion: JobAdItem <-> JobAd ─────────────────────────────────────

    @Override
    protected JobAd toEntity(JobAdItem item) {
        var ad = new JobAd();
        if (item.getId() != null) {
            ad.setId(Long.parseLong(item.getId()));
        }
        ad.setTenantId(item.getTenantId());
        if (item.getRequisitionId() != null) {
            ad.setRequisitionId(Long.parseLong(item.getRequisitionId()));
        }
        if (item.getJobPostingId() != null) {
            ad.setJobPostingId(Long.parseLong(item.getJobPostingId()));
        }
        ad.setTitle(item.getTitle());
        ad.setHtmlBody(item.getHtmlBody());
        ad.setChannelInternal(item.getChannelInternal());
        ad.setChannelExternal(item.getChannelExternal());
        if (item.getStatus() != null) {
            ad.setStatus(JobAdStatus.valueOf(item.getStatus()));
        }
        if (item.getClosingDate() != null) {
            ad.setClosingDate(LocalDate.parse(item.getClosingDate()));
        }
        ad.setSlug(item.getSlug());
        ad.setCreatedBy(item.getCreatedBy());
        if (item.getCreatedAt() != null) {
            ad.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            ad.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        ad.setDepartment(item.getDepartment());
        ad.setLocation(item.getLocation());
        ad.setEmploymentType(item.getEmploymentType());
        if (item.getSalaryRangeMin() != null) {
            ad.setSalaryRangeMin(new BigDecimal(item.getSalaryRangeMin()));
        }
        if (item.getSalaryRangeMax() != null) {
            ad.setSalaryRangeMax(new BigDecimal(item.getSalaryRangeMax()));
        }
        ad.setSalaryCurrency(item.getSalaryCurrency());
        return ad;
    }

    @Override
    protected JobAdItem toItem(JobAd entity) {
        var item = new JobAdItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("JOB_AD#" + id);

        // GSI1: Status index (tenant-scoped for secure queries)
        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT)
                : LocalDateTime.now().format(ISO_FMT);
        item.setGsi1pk("JOBAD_STATUS#" + tenantId + "#" + (entity.getStatus() != null ? entity.getStatus().name() : "DRAFT"));
        item.setGsi1sk("JOB_AD#" + createdAtStr);

        // GSI2: FK lookup by jobPostingId
        if (entity.getJobPostingId() != null) {
            item.setGsi2pk("JOBAD_POSTING#" + entity.getJobPostingId());
            item.setGsi2sk("JOB_AD#" + id);
        }

        // GSI4: Unique constraint on slug
        if (entity.getSlug() != null) {
            item.setGsi4pk("JOBAD_SLUG#" + tenantId + "#" + entity.getSlug());
            item.setGsi4sk("JOB_AD#" + id);
        }

        // GSI6: Date range — created
        item.setGsi6pk("JOBAD_CREATED#" + tenantId);
        item.setGsi6sk("JOB_AD#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getRequisitionId() != null) {
            item.setRequisitionId(entity.getRequisitionId().toString());
        }
        if (entity.getJobPostingId() != null) {
            item.setJobPostingId(entity.getJobPostingId().toString());
        }
        item.setTitle(entity.getTitle());
        item.setHtmlBody(entity.getHtmlBody());
        item.setChannelInternal(entity.getChannelInternal());
        item.setChannelExternal(entity.getChannelExternal());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        if (entity.getClosingDate() != null) {
            item.setClosingDate(entity.getClosingDate().toString());
        }
        item.setSlug(entity.getSlug());
        item.setCreatedBy(entity.getCreatedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        item.setDepartment(entity.getDepartment());
        item.setLocation(entity.getLocation());
        item.setEmploymentType(entity.getEmploymentType());
        if (entity.getSalaryRangeMin() != null) {
            item.setSalaryRangeMin(entity.getSalaryRangeMin().toPlainString());
        }
        if (entity.getSalaryRangeMax() != null) {
            item.setSalaryRangeMax(entity.getSalaryRangeMax().toPlainString());
        }
        item.setSalaryCurrency(entity.getSalaryCurrency());

        return item;
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    private CursorPage<JobAd> paginateInMemory(List<JobAd> all, String cursor, int pageSize) {
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try {
                offset = Integer.parseInt(cursor);
            } catch (NumberFormatException e) {
                offset = 0;
            }
        }
        List<JobAd> page = all.stream()
                .skip(offset)
                .limit(pageSize)
                .collect(Collectors.toList());
        boolean hasMore = offset + pageSize < all.size();
        String nextCursor = hasMore ? String.valueOf(offset + pageSize) : null;
        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) all.size());
    }
}
