package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.JobPostingItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the JobPosting entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     JOB_POSTING#{id}
 *   GSI1PK: POSTING_STATUS#{status}              GSI1SK: JOB_POSTING#{createdAt}
 *   GSI2PK: POSTING_CREATOR#{createdBy}           GSI2SK: JOB_POSTING#{createdAt}
 *   GSI3PK: POSTING_DEPT#{department}             GSI3SK: JOB_POSTING#{createdAt}
 *   GSI4PK: POSTING_SLUG#{tenantId}#{slug}        GSI4SK: JOB_POSTING#{id}
 *   GSI6PK: POSTING_CREATED#{tenantId}            GSI6SK: JOB_POSTING#{createdAt}
 * </pre>
 */
@Repository
public class DynamoJobPostingRepository extends DynamoRepository<JobPostingItem, JobPosting>
        implements JobPostingDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoJobPostingRepository(DynamoDbClient dynamoDbClient,
                                       DynamoDbEnhancedClient enhancedClient,
                                       String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, JobPostingItem.class);
    }

    @Override
    protected String entityType() {
        return "JOB_POSTING";
    }

    // ── Status queries ───────────────────────────────────────────────────────

    @Override
    public List<JobPosting> findByStatusOrderByCreatedAtDesc(JobPostingStatus status) {
        return queryGsiAll("GSI1", "POSTING_STATUS#" + status.name()).stream()
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<JobPosting> findByStatusPaginated(JobPostingStatus status, String cursor, int pageSize) {
        return queryGsi("GSI1", "POSTING_STATUS#" + status.name(), "JOB_POSTING#", cursor, pageSize);
    }

    @Override
    public List<JobPosting> findByStatusInOrderByCreatedAtDesc(List<JobPostingStatus> statuses) {
        return statuses.stream()
                .flatMap(s -> findByStatusOrderByCreatedAtDesc(s).stream())
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<JobPosting> findByStatusInPaginated(List<JobPostingStatus> statuses, String cursor, int pageSize) {
        List<JobPosting> all = findByStatusInOrderByCreatedAtDesc(statuses);
        return paginateInMemory(all, cursor, pageSize);
    }

    // ── Published job queries ────────────────────────────────────────────────

    @Override
    public List<JobPosting> findActivePublishedJobs(LocalDateTime now) {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED).stream()
                .filter(j -> j.getApplicationDeadline() == null || j.getApplicationDeadline().isAfter(now))
                .sorted(Comparator.comparing(jp -> jp.getPublishedAt() != null ? jp.getPublishedAt() : jp.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<JobPosting> findActivePublishedJobsPaginated(LocalDateTime now, String cursor, int pageSize) {
        List<JobPosting> active = findActivePublishedJobs(now);
        return paginateInMemory(active, cursor, pageSize);
    }

    // ── Department / Filter queries ──────────────────────────────────────────

    @Override
    public List<JobPosting> findByDepartmentOrderByCreatedAtDesc(String department) {
        return queryGsiAll("GSI3", "POSTING_DEPT#" + department).stream()
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<JobPosting> findByDepartmentPaginated(String department, String cursor, int pageSize) {
        return queryGsi("GSI3", "POSTING_DEPT#" + department, "JOB_POSTING#", cursor, pageSize);
    }

    @Override
    public List<JobPosting> findByEmploymentTypeOrderByCreatedAtDesc(EmploymentType employmentType) {
        return findAll().stream()
                .filter(j -> employmentType.equals(j.getEmploymentType()))
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findByExperienceLevelOrderByCreatedAtDesc(ExperienceLevel experienceLevel) {
        return findAll().stream()
                .filter(j -> experienceLevel.equals(j.getExperienceLevel()))
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findByLocationContainingIgnoreCaseOrderByCreatedAtDesc(String location) {
        String lowerLocation = location.toLowerCase();
        return findAll().stream()
                .filter(j -> j.getLocation() != null && j.getLocation().toLowerCase().contains(lowerLocation))
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findByRemoteWorkAllowedTrueAndStatus(JobPostingStatus status) {
        return findByStatusOrderByCreatedAtDesc(status).stream()
                .filter(j -> Boolean.TRUE.equals(j.getRemoteWorkAllowed()))
                .collect(Collectors.toList());
    }

    // ── Featured / Urgent ────────────────────────────────────────────────────

    @Override
    public List<JobPosting> findFeaturedJobs() {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED).stream()
                .filter(j -> Boolean.TRUE.equals(j.getFeatured()))
                .sorted(Comparator.comparing(jp -> jp.getPublishedAt() != null ? jp.getPublishedAt() : jp.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findUrgentJobs() {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED).stream()
                .filter(j -> Boolean.TRUE.equals(j.getUrgent()))
                .sorted(Comparator.comparing(jp -> jp.getPublishedAt() != null ? jp.getPublishedAt() : jp.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    // ── Creator queries ──────────────────────────────────────────────────────

    @Override
    public List<JobPosting> findByCreatedByOrderByCreatedAtDesc(String createdBy) {
        return queryGsiAll("GSI2", "POSTING_CREATOR#" + createdBy).stream()
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<JobPosting> findByCreatedByPaginated(String createdBy, String cursor, int pageSize) {
        return queryGsi("GSI2", "POSTING_CREATOR#" + createdBy, "JOB_POSTING#", cursor, pageSize);
    }

    // ── Approval workflow ────────────────────────────────────────────────────

    @Override
    public List<JobPosting> findJobsRequiringApproval() {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PENDING_APPROVAL).stream()
                .sorted(Comparator.comparing(j -> j.getSubmittedForApprovalAt() != null
                        ? j.getSubmittedForApprovalAt() : j.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ── Search ───────────────────────────────────────────────────────────────

    @Override
    public CursorPage<JobPosting> searchJobPostings(String searchTerm, String cursor, int pageSize) {
        String lowerSearch = searchTerm.toLowerCase();
        List<JobPosting> filtered = findAll().stream()
                .filter(j -> (j.getTitle() != null && j.getTitle().toLowerCase().contains(lowerSearch)) ||
                             (j.getDescription() != null && j.getDescription().toLowerCase().contains(lowerSearch)) ||
                             (j.getDepartment() != null && j.getDepartment().toLowerCase().contains(lowerSearch)) ||
                             (j.getLocation() != null && j.getLocation().toLowerCase().contains(lowerSearch)))
                .collect(Collectors.toList());
        return paginateInMemory(filtered, cursor, pageSize);
    }

    @Override
    public CursorPage<JobPosting> findJobsWithFilters(String searchTerm, String department,
                                                       EmploymentType employmentType,
                                                       ExperienceLevel experienceLevel,
                                                       String location, Boolean remoteWork,
                                                       JobPostingStatus status,
                                                       String cursor, int pageSize) {
        String lowerSearch = searchTerm != null ? searchTerm.toLowerCase() : null;
        String lowerLocation = location != null ? location.toLowerCase() : null;

        List<JobPosting> filtered = findAll().stream()
                .filter(j -> lowerSearch == null ||
                        (j.getTitle() != null && j.getTitle().toLowerCase().contains(lowerSearch)) ||
                        (j.getDescription() != null && j.getDescription().toLowerCase().contains(lowerSearch)) ||
                        (j.getDepartment() != null && j.getDepartment().toLowerCase().contains(lowerSearch)) ||
                        (j.getLocation() != null && j.getLocation().toLowerCase().contains(lowerSearch)))
                .filter(j -> department == null || department.equals(j.getDepartment()))
                .filter(j -> employmentType == null || employmentType.equals(j.getEmploymentType()))
                .filter(j -> experienceLevel == null || experienceLevel.equals(j.getExperienceLevel()))
                .filter(j -> lowerLocation == null ||
                        (j.getLocation() != null && j.getLocation().toLowerCase().contains(lowerLocation)))
                .filter(j -> remoteWork == null || remoteWork.equals(j.getRemoteWorkAllowed()))
                .filter(j -> status == null || status.equals(j.getStatus()))
                .collect(Collectors.toList());

        return paginateInMemory(filtered, cursor, pageSize);
    }

    // ── Slug ─────────────────────────────────────────────────────────────────

    @Override
    public Optional<JobPosting> findBySlug(String slug) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "POSTING_SLUG#" + tenantId + "#" + slug);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return findBySlug(slug).isPresent();
    }

    @Override
    public Optional<JobPosting> findBySlugAndTenantId(String slug, String tenantId) {
        return findByGsiUnique("GSI4", "POSTING_SLUG#" + tenantId + "#" + slug);
    }

    // ── Counts ───────────────────────────────────────────────────────────────

    @Override
    public long countByStatus(JobPostingStatus status) {
        return findByStatusOrderByCreatedAtDesc(status).size();
    }

    @Override
    public long countByDepartment(String department) {
        return findByDepartmentOrderByCreatedAtDesc(department).size();
    }

    @Override
    public long countByCreatedBy(String createdBy) {
        return findByCreatedByOrderByCreatedAtDesc(createdBy).size();
    }

    // ── Deadline / Expiry queries ────────────────────────────────────────────

    @Override
    public List<JobPosting> findJobsWithUpcomingDeadlines(LocalDateTime now, LocalDateTime deadline) {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED).stream()
                .filter(j -> j.getApplicationDeadline() != null &&
                             j.getApplicationDeadline().isAfter(now) &&
                             j.getApplicationDeadline().isBefore(deadline))
                .sorted(Comparator.comparing(JobPosting::getApplicationDeadline))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findExpiredJobs(LocalDateTime now) {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED).stream()
                .filter(j -> j.getApplicationDeadline() != null && j.getApplicationDeadline().isBefore(now))
                .sorted(Comparator.comparing(JobPosting::getApplicationDeadline, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    // ── Statistics ────────────────────────────────────────────────────────────

    @Override
    public List<Object[]> getJobPostingStatusCounts() {
        Map<JobPostingStatus, Long> counts = findAll().stream()
                .collect(Collectors.groupingBy(JobPosting::getStatus, Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getJobPostingCountsByDepartment() {
        Map<String, Long> counts = findAll().stream()
                .collect(Collectors.groupingBy(JobPosting::getDepartment, Collectors.counting()));
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getJobPostingCountsByEmploymentType() {
        Map<EmploymentType, Long> counts = findAll().stream()
                .collect(Collectors.groupingBy(JobPosting::getEmploymentType, Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    // ── Misc ─────────────────────────────────────────────────────────────────

    @Override
    public List<JobPosting> findRecentlyPublishedJobs(LocalDateTime since) {
        return findByStatusOrderByCreatedAtDesc(JobPostingStatus.PUBLISHED).stream()
                .filter(j -> j.getPublishedAt() != null && j.getPublishedAt().isAfter(since))
                .sorted(Comparator.comparing(JobPosting::getPublishedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public void incrementViewCount(String id) {
        findById(id).ifPresent(jp -> {
            jp.setViewsCount((jp.getViewsCount() != null ? jp.getViewsCount() : 0L) + 1);
            save(jp);
        });
    }

    @Override
    public void incrementApplicationCount(String id) {
        findById(id).ifPresent(jp -> {
            jp.setApplicationsCount((jp.getApplicationsCount() != null ? jp.getApplicationsCount() : 0L) + 1);
            save(jp);
        });
    }

    @Override
    public List<JobPosting> findJobsCreatedBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(j -> j.getCreatedAt() != null &&
                             !j.getCreatedAt().isBefore(startDate) &&
                             !j.getCreatedAt().isAfter(endDate))
                .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findJobsApprovedBy(String approverId) {
        return findAll().stream()
                .filter(j -> j.getApprovedBy() != null && approverId.equals(j.getApprovedBy().toString()))
                .sorted(Comparator.comparing(jp -> jp.getApprovedAt() != null ? jp.getApprovedAt() : jp.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPosting> findJobsPublishedBy(String publisherId) {
        return findAll().stream()
                .filter(j -> j.getPublishedBy() != null && publisherId.equals(j.getPublishedBy().toString()))
                .sorted(Comparator.comparing(jp -> jp.getPublishedAt() != null ? jp.getPublishedAt() : jp.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    // ── Conversion: JobPostingItem <-> JobPosting ───────────────────────────

    @Override
    protected JobPosting toEntity(JobPostingItem item) {
        var jp = new JobPosting();
        if (item.getId() != null) {
            jp.setId(safeParseLong(item.getId()));
        }
        jp.setTenantId(item.getTenantId());
        jp.setTitle(item.getTitle());
        jp.setDepartment(item.getDepartment());
        jp.setLocation(item.getLocation());
        if (item.getEmploymentType() != null) {
            try { jp.setEmploymentType(EmploymentType.valueOf(item.getEmploymentType())); }
            catch (IllegalArgumentException ignored) {}
        }
        if (item.getExperienceLevel() != null) {
            try { jp.setExperienceLevel(ExperienceLevel.valueOf(item.getExperienceLevel())); }
            catch (IllegalArgumentException ignored) {}
        }
        jp.setDescription(item.getDescription());
        jp.setRequirements(item.getRequirements());
        jp.setResponsibilities(item.getResponsibilities());
        jp.setQualifications(item.getQualifications());
        jp.setBenefits(item.getBenefits());
        if (item.getSalaryMin() != null) {
            jp.setSalaryMin(new BigDecimal(item.getSalaryMin()));
        }
        if (item.getSalaryMax() != null) {
            jp.setSalaryMax(new BigDecimal(item.getSalaryMax()));
        }
        jp.setSalaryCurrency(item.getSalaryCurrency());
        jp.setRemoteWorkAllowed(item.getRemoteWorkAllowed());
        jp.setTravelRequired(item.getTravelRequired());
        if (item.getApplicationDeadline() != null) {
            jp.setApplicationDeadline(LocalDateTime.parse(item.getApplicationDeadline(), ISO_FMT));
        }
        jp.setPositionsAvailable(item.getPositionsAvailable());
        if (item.getStatus() != null) {
            jp.setStatus(JobPostingStatus.valueOf(item.getStatus()));
        }
        if (item.getCreatedBy() != null) {
            jp.setCreatedBy(safeParseLong(item.getCreatedBy()));
        }
        if (item.getApprovedBy() != null) {
            jp.setApprovedBy(safeParseLong(item.getApprovedBy()));
        }
        if (item.getPublishedBy() != null) {
            jp.setPublishedBy(safeParseLong(item.getPublishedBy()));
        }
        jp.setApprovalNotes(item.getApprovalNotes());
        jp.setRejectionReason(item.getRejectionReason());
        jp.setInternalNotes(item.getInternalNotes());
        jp.setExternalJobBoards(item.getExternalJobBoards());
        jp.setRequiredCheckTypes(item.getRequiredCheckTypes());
        jp.setEnforceCheckCompletion(item.getEnforceCheckCompletion());
        jp.setSeoTitle(item.getSeoTitle());
        jp.setSeoDescription(item.getSeoDescription());
        jp.setSeoKeywords(item.getSeoKeywords());
        jp.setSlug(item.getSlug());
        jp.setFeatured(item.getFeatured());
        jp.setUrgent(item.getUrgent());
        jp.setViewsCount(item.getViewsCount());
        jp.setApplicationsCount(item.getApplicationsCount());
        if (item.getCreatedAt() != null) {
            jp.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            jp.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getSubmittedForApprovalAt() != null) {
            jp.setSubmittedForApprovalAt(LocalDateTime.parse(item.getSubmittedForApprovalAt(), ISO_FMT));
        }
        if (item.getApprovedAt() != null) {
            jp.setApprovedAt(LocalDateTime.parse(item.getApprovedAt(), ISO_FMT));
        }
        if (item.getPublishedAt() != null) {
            jp.setPublishedAt(LocalDateTime.parse(item.getPublishedAt(), ISO_FMT));
        }
        if (item.getUnpublishedAt() != null) {
            jp.setUnpublishedAt(LocalDateTime.parse(item.getUnpublishedAt(), ISO_FMT));
        }
        if (item.getClosedAt() != null) {
            jp.setClosedAt(LocalDateTime.parse(item.getClosedAt(), ISO_FMT));
        }
        return jp;
    }

    @Override
    protected JobPostingItem toItem(JobPosting entity) {
        var item = new JobPostingItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT)
                : LocalDateTime.now().format(ISO_FMT);

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("JOB_POSTING#" + id);

        // GSI1: Status index
        item.setGsi1pk("POSTING_STATUS#" + (entity.getStatus() != null ? entity.getStatus().name() : "DRAFT"));
        item.setGsi1sk("JOB_POSTING#" + createdAtStr);

        // GSI2: Creator index
        if (entity.getCreatedBy() != null) {
            item.setGsi2pk("POSTING_CREATOR#" + entity.getCreatedBy());
            item.setGsi2sk("JOB_POSTING#" + createdAtStr);
        }

        // GSI3: Department index
        if (entity.getDepartment() != null) {
            item.setGsi3pk("POSTING_DEPT#" + entity.getDepartment());
            item.setGsi3sk("JOB_POSTING#" + createdAtStr);
        }

        // GSI4: Unique slug
        if (entity.getSlug() != null) {
            item.setGsi4pk("POSTING_SLUG#" + tenantId + "#" + entity.getSlug());
            item.setGsi4sk("JOB_POSTING#" + id);
        }

        // GSI6: Date range — created
        item.setGsi6pk("POSTING_CREATED#" + tenantId);
        item.setGsi6sk("JOB_POSTING#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setTitle(entity.getTitle());
        item.setDepartment(entity.getDepartment());
        item.setLocation(entity.getLocation());
        if (entity.getEmploymentType() != null) {
            item.setEmploymentType(entity.getEmploymentType().name());
        }
        if (entity.getExperienceLevel() != null) {
            item.setExperienceLevel(entity.getExperienceLevel().name());
        }
        item.setDescription(entity.getDescription());
        item.setRequirements(entity.getRequirements());
        item.setResponsibilities(entity.getResponsibilities());
        item.setQualifications(entity.getQualifications());
        item.setBenefits(entity.getBenefits());
        if (entity.getSalaryMin() != null) {
            item.setSalaryMin(entity.getSalaryMin().toPlainString());
        }
        if (entity.getSalaryMax() != null) {
            item.setSalaryMax(entity.getSalaryMax().toPlainString());
        }
        item.setSalaryCurrency(entity.getSalaryCurrency());
        item.setRemoteWorkAllowed(entity.getRemoteWorkAllowed());
        item.setTravelRequired(entity.getTravelRequired());
        if (entity.getApplicationDeadline() != null) {
            item.setApplicationDeadline(entity.getApplicationDeadline().format(ISO_FMT));
        }
        item.setPositionsAvailable(entity.getPositionsAvailable());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        if (entity.getCreatedBy() != null) {
            item.setCreatedBy(entity.getCreatedBy().toString());
        }
        if (entity.getApprovedBy() != null) {
            item.setApprovedBy(entity.getApprovedBy().toString());
        }
        if (entity.getPublishedBy() != null) {
            item.setPublishedBy(entity.getPublishedBy().toString());
        }
        item.setApprovalNotes(entity.getApprovalNotes());
        item.setRejectionReason(entity.getRejectionReason());
        item.setInternalNotes(entity.getInternalNotes());
        item.setExternalJobBoards(entity.getExternalJobBoards());
        item.setRequiredCheckTypes(entity.getRequiredCheckTypes());
        item.setEnforceCheckCompletion(entity.getEnforceCheckCompletion());
        item.setSeoTitle(entity.getSeoTitle());
        item.setSeoDescription(entity.getSeoDescription());
        item.setSeoKeywords(entity.getSeoKeywords());
        item.setSlug(entity.getSlug());
        item.setFeatured(entity.getFeatured());
        item.setUrgent(entity.getUrgent());
        item.setViewsCount(entity.getViewsCount());
        item.setApplicationsCount(entity.getApplicationsCount());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getSubmittedForApprovalAt() != null) {
            item.setSubmittedForApprovalAt(entity.getSubmittedForApprovalAt().format(ISO_FMT));
        }
        if (entity.getApprovedAt() != null) {
            item.setApprovedAt(entity.getApprovedAt().format(ISO_FMT));
        }
        if (entity.getPublishedAt() != null) {
            item.setPublishedAt(entity.getPublishedAt().format(ISO_FMT));
        }
        if (entity.getUnpublishedAt() != null) {
            item.setUnpublishedAt(entity.getUnpublishedAt().format(ISO_FMT));
        }
        if (entity.getClosedAt() != null) {
            item.setClosedAt(entity.getClosedAt().format(ISO_FMT));
        }

        return item;
    }

    // ── Page-based queries (JPA compatibility) ───────────────────────────────

    @Override
    public org.springframework.data.domain.Page<JobPosting> findAll(org.springframework.data.domain.Pageable pageable) {
        List<JobPosting> all = findAll();
        return toPage(all, pageable);
    }

    @Override
    public org.springframework.data.domain.Page<JobPosting> searchJobPostings(String searchTerm, org.springframework.data.domain.Pageable pageable) {
        CursorPage<JobPosting> cursorResult = searchJobPostings(searchTerm, String.valueOf(pageable.getPageNumber()), pageable.getPageSize());
        return new org.springframework.data.domain.PageImpl<>(cursorResult.content(), pageable,
                cursorResult.totalElements() != null ? cursorResult.totalElements() : cursorResult.content().size());
    }

    @Override
    public org.springframework.data.domain.Page<JobPosting> findJobsWithFilters(String searchTerm, String department,
                                                                                  EmploymentType employmentType,
                                                                                  ExperienceLevel experienceLevel,
                                                                                  String location, Boolean remoteWork,
                                                                                  JobPostingStatus status,
                                                                                  org.springframework.data.domain.Pageable pageable) {
        CursorPage<JobPosting> cursorResult = findJobsWithFilters(searchTerm, department, employmentType,
                experienceLevel, location, remoteWork, status, String.valueOf(pageable.getPageNumber()), pageable.getPageSize());
        return new org.springframework.data.domain.PageImpl<>(cursorResult.content(), pageable,
                cursorResult.totalElements() != null ? cursorResult.totalElements() : cursorResult.content().size());
    }

    @Override
    public org.springframework.data.domain.Page<JobPosting> findActivePublishedJobs(LocalDateTime now, org.springframework.data.domain.Pageable pageable) {
        CursorPage<JobPosting> cursorResult = findActivePublishedJobsPaginated(now, String.valueOf(pageable.getPageNumber()), pageable.getPageSize());
        return new org.springframework.data.domain.PageImpl<>(cursorResult.content(), pageable,
                cursorResult.totalElements() != null ? cursorResult.totalElements() : cursorResult.content().size());
    }

    @Override
    public org.springframework.data.domain.Page<JobPosting> findByCreatedBy(Long createdBy, org.springframework.data.domain.Pageable pageable) {
        CursorPage<JobPosting> cursorResult = findByCreatedByPaginated(String.valueOf(createdBy),
                String.valueOf(pageable.getPageNumber()), pageable.getPageSize());
        return new org.springframework.data.domain.PageImpl<>(cursorResult.content(), pageable,
                cursorResult.totalElements() != null ? cursorResult.totalElements() : cursorResult.content().size());
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    private org.springframework.data.domain.Page<JobPosting> toPage(List<JobPosting> all, org.springframework.data.domain.Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<JobPosting> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, all.size());
    }

    private CursorPage<JobPosting> paginateInMemory(List<JobPosting> all, String cursor, int pageSize) {
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try {
                offset = Integer.parseInt(cursor);
            } catch (NumberFormatException e) {
                offset = 0;
            }
        }
        List<JobPosting> page = all.stream()
                .skip(offset)
                .limit(pageSize)
                .collect(Collectors.toList());
        boolean hasMore = offset + pageSize < all.size();
        String nextCursor = hasMore ? String.valueOf(offset + pageSize) : null;
        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) all.size());
    }
}
