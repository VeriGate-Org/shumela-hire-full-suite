package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.PipelineTransition;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.ApplicationItem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Application entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     APPLICATION#{id}
 *   GSI1PK: APP_STATUS#{status}           GSI1SK: APP#{submittedAt}
 *   GSI2PK: APP_JOB_POSTING#{jobPostingId} GSI2SK: APP#{id}
 *   GSI3PK: APP_DEPT#{department}          GSI3SK: APP#{submittedAt}
 *   GSI4PK: APP_APPLICANT#{applicantId}    GSI4SK: APP#{id}
 *   GSI6PK: APP_CREATED#{tenantId}         GSI6SK: APP#{submittedAt}
 * </pre>
 */
@Repository
public class DynamoApplicationRepository extends DynamoRepository<ApplicationItem, Application>
        implements ApplicationDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoApplicationRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, ApplicationItem.class);
    }

    @Override
    protected String entityType() {
        return "APPLICATION";
    }

    // ── Pageable queries ─────────────────────────────────────────────────────

    @Override
    public Page<Application> findAll(Pageable pageable) {
        List<Application> all = findAll();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<Application> pageContent = start < all.size() ? all.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    @Override
    public Page<Application> searchApplications(String searchTerm, Pageable pageable) {
        String lower = searchTerm != null ? searchTerm.toLowerCase() : "";
        List<Application> filtered = findAll().stream()
                .filter(a -> {
                    if (a.getApplicant() != null) {
                        String fullName = ((a.getApplicant().getName() != null ? a.getApplicant().getName() : "") + " "
                                + (a.getApplicant().getSurname() != null ? a.getApplicant().getSurname() : "")).toLowerCase();
                        if (fullName.contains(lower)) return true;
                        if (a.getApplicant().getEmail() != null && a.getApplicant().getEmail().toLowerCase().contains(lower)) return true;
                    }
                    return a.getJobTitle() != null && a.getJobTitle().toLowerCase().contains(lower);
                })
                .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Application> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    // ── Bulk ID lookup ────────────────────────────────────────────────────────

    @Override
    public List<Application> findAllByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> idSet = new HashSet<>(ids);
        return findAll().stream()
                .filter(a -> a.getId() != null && idSet.contains(a.getId().toString()))
                .collect(Collectors.toList());
    }

    // ── Advanced search (replaces JPA Specification usage) ──────────────────

    @Override
    public List<Application> searchApplicationsFiltered(
            String searchTerm,
            List<ApplicationStatus> statuses,
            List<String> departments,
            String jobTitle,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            Integer minRating,
            Integer maxRating) {

        return findAll().stream()
                .filter(a -> {
                    if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                        String lower = searchTerm.toLowerCase();
                        boolean matches = false;
                        if (a.getApplicant() != null) {
                            String fullName = ((a.getApplicant().getName() != null ? a.getApplicant().getName() : "") + " "
                                    + (a.getApplicant().getSurname() != null ? a.getApplicant().getSurname() : "")).toLowerCase();
                            if (fullName.contains(lower)) matches = true;
                            if (a.getApplicant().getEmail() != null && a.getApplicant().getEmail().toLowerCase().contains(lower)) matches = true;
                        }
                        if (a.getJobTitle() != null && a.getJobTitle().toLowerCase().contains(lower)) matches = true;
                        if (a.getCoverLetter() != null && a.getCoverLetter().toLowerCase().contains(lower)) matches = true;
                        if (!matches) return false;
                    }
                    if (statuses != null && !statuses.isEmpty() && !statuses.contains(a.getStatus())) return false;
                    if (departments != null && !departments.isEmpty() && !departments.contains(a.getDepartment())) return false;
                    if (jobTitle != null && !jobTitle.trim().isEmpty()) {
                        if (a.getJobTitle() == null || !a.getJobTitle().toLowerCase().contains(jobTitle.toLowerCase())) return false;
                    }
                    if (dateFrom != null && (a.getSubmittedAt() == null || a.getSubmittedAt().isBefore(dateFrom))) return false;
                    if (dateTo != null && (a.getSubmittedAt() == null || a.getSubmittedAt().isAfter(dateTo))) return false;
                    if (minRating != null && (a.getRating() == null || a.getRating() < minRating)) return false;
                    if (maxRating != null && (a.getRating() == null || a.getRating() > maxRating)) return false;
                    return true;
                })
                .collect(Collectors.toList());
    }

    // ── ApplicationDataRepository: Applicant-based queries ──────────────────

    @Override
    public List<Application> findByApplicantIdOrderBySubmittedAtDesc(String applicantId) {
        return queryGsiAll("GSI4", "APP_APPLICANT#" + applicantId).stream()
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public long countByApplicantId(String applicantId) {
        return queryGsiAll("GSI4", "APP_APPLICANT#" + applicantId).size();
    }

    // ── Job posting queries ─────────────────────────────────────────────────

    @Override
    public List<Application> findByJobPostingIdOrderBySubmittedAtDesc(String jobPostingId) {
        return queryGsiAll("GSI2", "APP_JOB_POSTING#" + jobPostingId).stream()
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findByJobPostingIdAndStatus(String jobPostingId, ApplicationStatus status) {
        return queryGsiAll("GSI2", "APP_JOB_POSTING#" + jobPostingId).stream()
                .filter(a -> status.equals(a.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByJobPostingId(String jobPostingId) {
        return queryGsiAll("GSI2", "APP_JOB_POSTING#" + jobPostingId).size();
    }

    @Override
    public List<Application> findByJobId(String jobId) {
        return findAll().stream()
                .filter(a -> jobId.equals(a.getJobId()))
                .collect(Collectors.toList());
    }

    // ── Applicant + job posting combination ─────────────────────────────────

    @Override
    public Optional<Application> findByApplicantIdAndJobPostingId(String applicantId, String jobPostingId) {
        return queryGsiAll("GSI4", "APP_APPLICANT#" + applicantId).stream()
                .filter(a -> a.getJobPostingId() != null && a.getJobPostingId().toString().equals(jobPostingId))
                .findFirst();
    }

    @Override
    public boolean existsByApplicantIdAndJobPostingId(String applicantId, String jobPostingId) {
        return findByApplicantIdAndJobPostingId(applicantId, jobPostingId).isPresent();
    }

    // ── Status-based queries ────────────────────────────────────────────────

    @Override
    public List<Application> findByStatusOrderBySubmittedAtDesc(ApplicationStatus status) {
        return queryGsiAll("GSI1", "APP_STATUS#" + status.name()).stream()
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public CursorPage<Application> findByStatus(ApplicationStatus status, String cursor, int pageSize) {
        return queryGsi("GSI1", "APP_STATUS#" + status.name(), "APP#", cursor, pageSize);
    }

    @Override
    public List<Application> findByStatusInOrderBySubmittedAtDesc(List<ApplicationStatus> statuses) {
        Set<ApplicationStatus> statusSet = new HashSet<>(statuses);
        return findAll().stream()
                .filter(a -> statusSet.contains(a.getStatus()))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(ApplicationStatus status) {
        return queryGsiAll("GSI1", "APP_STATUS#" + status.name()).size();
    }

    @Override
    public List<Application> findApplicationsPendingReview() {
        Set<ApplicationStatus> pending = Set.of(ApplicationStatus.SUBMITTED, ApplicationStatus.SCREENING);
        return findAll().stream()
                .filter(a -> pending.contains(a.getStatus()))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findApplicationsRequiringAction() {
        Set<ApplicationStatus> actionRequired = Set.of(
                ApplicationStatus.INTERVIEW_COMPLETED,
                ApplicationStatus.REFERENCE_CHECK,
                ApplicationStatus.OFFER_PENDING);
        return findAll().stream()
                .filter(a -> actionRequired.contains(a.getStatus()))
                .sorted(Comparator.comparing(Application::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findActiveApplications() {
        Set<ApplicationStatus> terminal = Set.of(
                ApplicationStatus.WITHDRAWN,
                ApplicationStatus.REJECTED,
                ApplicationStatus.HIRED,
                ApplicationStatus.OFFER_DECLINED);
        return findAll().stream()
                .filter(a -> !terminal.contains(a.getStatus()))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findByStatusAndWithdrawnAtIsNotNullOrderByWithdrawnAtDesc(ApplicationStatus status) {
        return findAll().stream()
                .filter(a -> status.equals(a.getStatus()) && a.getWithdrawnAt() != null)
                .sorted(Comparator.comparing(Application::getWithdrawnAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findByStatusInAndUpdatedAtBeforeOrderBySubmittedAtAsc(
            List<ApplicationStatus> statuses, LocalDateTime threshold) {
        Set<ApplicationStatus> statusSet = new HashSet<>(statuses);
        return findAll().stream()
                .filter(a -> statusSet.contains(a.getStatus())
                        && a.getUpdatedAt() != null
                        && a.getUpdatedAt().isBefore(threshold))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    // ── Department queries ──────────────────────────────────────────────────

    @Override
    public List<Application> findByDepartmentOrderBySubmittedAtDesc(String department) {
        return queryGsiAll("GSI3", "APP_DEPT#" + department).stream()
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Source queries ──────────────────────────────────────────────────────

    @Override
    public List<Application> findByApplicationSourceOrderBySubmittedAtDesc(String source) {
        return findAll().stream()
                .filter(a -> source.equals(a.getApplicationSource()))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Rating queries ──────────────────────────────────────────────────────

    @Override
    public List<Application> findByRatingGreaterThanEqualOrderByRatingDescSubmittedAtDesc(Integer minRating) {
        return findAll().stream()
                .filter(a -> a.getRating() != null && a.getRating() >= minRating)
                .sorted(Comparator.comparing(Application::getRating, Comparator.reverseOrder())
                        .thenComparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public long countByRating(Integer rating) {
        return findAll().stream()
                .filter(a -> rating.equals(a.getRating()))
                .count();
    }

    // ── Date range queries ──────────────────────────────────────────────────

    @Override
    public List<Application> findRecentApplications(LocalDateTime since) {
        return findAll().stream()
                .filter(a -> a.getSubmittedAt() != null && !a.getSubmittedAt().isBefore(since))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findApplicationsSubmittedBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(a -> a.getSubmittedAt() != null
                        && !a.getSubmittedAt().isBefore(startDate)
                        && !a.getSubmittedAt().isAfter(endDate))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Application> findBySubmittedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return findApplicationsSubmittedBetween(startDate, endDate);
    }

    @Override
    public List<Application> findByStatusAndSubmittedAtBetween(ApplicationStatus status,
                                                                LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(a -> status.equals(a.getStatus())
                        && a.getSubmittedAt() != null
                        && !a.getSubmittedAt().isBefore(startDate)
                        && !a.getSubmittedAt().isAfter(endDate))
                .collect(Collectors.toList());
    }

    // ── Search ──────────────────────────────────────────────────────────────

    @Override
    public CursorPage<Application> searchApplications(String searchTerm, String cursor, int pageSize) {
        String lowerSearch = searchTerm.toLowerCase();
        List<Application> filtered = findAll().stream()
                .filter(a -> matchesSearch(a, lowerSearch))
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        return paginateInMemory(filtered, cursor, pageSize);
    }

    private boolean matchesSearch(Application a, String lowerSearch) {
        // Match on applicant name (if loaded) or job title
        if (a.getJobTitle() != null && a.getJobTitle().toLowerCase().contains(lowerSearch)) {
            return true;
        }
        if (a.getApplicant() != null) {
            String fullName = ((a.getApplicant().getName() != null ? a.getApplicant().getName() : "") + " "
                    + (a.getApplicant().getSurname() != null ? a.getApplicant().getSurname() : "")).toLowerCase();
            return fullName.contains(lowerSearch);
        }
        return false;
    }

    // ── Counting / Analytics ────────────────────────────────────────────────

    @Override
    public long countBySubmittedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return findApplicationsSubmittedBetween(startDate, endDate).size();
    }

    @Override
    public long countByDepartmentAndSubmittedAtBetween(String department,
                                                        LocalDateTime startDate, LocalDateTime endDate) {
        return findAll().stream()
                .filter(a -> department.equals(a.getDepartment())
                        && a.getSubmittedAt() != null
                        && !a.getSubmittedAt().isBefore(startDate)
                        && !a.getSubmittedAt().isAfter(endDate))
                .count();
    }

    @Override
    public long countByStatusAndSubmittedAtBetween(ApplicationStatus status,
                                                    LocalDateTime startDate, LocalDateTime endDate) {
        return findByStatusAndSubmittedAtBetween(status, startDate, endDate).size();
    }

    @Override
    public long countBySubmittedAtAfter(LocalDateTime date) {
        return findAll().stream()
                .filter(a -> a.getSubmittedAt() != null && a.getSubmittedAt().isAfter(date))
                .count();
    }

    // ── Aggregate / reporting queries ───────────────────────────────────────

    @Override
    public List<Object[]> getApplicationStatusCounts() {
        return findAll().stream()
                .filter(a -> a.getStatus() != null)
                .collect(Collectors.groupingBy(Application::getStatus, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getPipelineDistribution() {
        // Same as status counts
        return getApplicationStatusCounts();
    }

    @Override
    public List<Object[]> countByDepartment() {
        return findAll().stream()
                .filter(a -> a.getDepartment() != null)
                .collect(Collectors.groupingBy(Application::getDepartment, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<PipelineTransition> findTransitionsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        // PipelineTransitions are a separate entity; in DynamoDB they would have their own
        // item type. For now, return empty. This should be handled by a dedicated
        // PipelineTransition repository when migrated.
        return Collections.emptyList();
    }

    // ── Performance analytics ───────────────────────────────────────────────

    @Override
    public List<Object[]> findHiredApplicationsWithDates() {
        return findAll().stream()
                .filter(a -> ApplicationStatus.HIRED.equals(a.getStatus()))
                .map(a -> new Object[]{
                        a.getId(),
                        a.getSubmittedAt(),
                        a.getUpdatedAt(),
                        a.getDepartment()
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> findApplicationsBySource() {
        return findAll().stream()
                .filter(a -> a.getApplicationSource() != null)
                .map(a -> new Object[]{a.getApplicationSource(), a.getStatus()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> findHiresByDepartment() {
        return findAll().stream()
                .filter(a -> ApplicationStatus.HIRED.equals(a.getStatus()) && a.getDepartment() != null)
                .collect(Collectors.groupingBy(Application::getDepartment, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> findMonthlyHiringTrends() {
        // Group by year+month, compute hired count and total count
        Map<String, long[]> monthlyData = new LinkedHashMap<>();
        for (Application a : findAll()) {
            if (a.getSubmittedAt() == null) continue;
            int month = a.getSubmittedAt().getMonthValue();
            int year = a.getSubmittedAt().getYear();
            String key = year + "-" + month;
            monthlyData.computeIfAbsent(key, k -> new long[]{month, year, 0, 0});
            long[] data = monthlyData.get(key);
            data[3]++; // total count
            if (ApplicationStatus.HIRED.equals(a.getStatus())) {
                data[2]++; // hired count
            }
        }
        return monthlyData.values().stream()
                .sorted(Comparator.comparingLong((long[] d) -> d[1]).thenComparingLong(d -> d[0]))
                .map(d -> new Object[]{(int) d[0], (int) d[1], d[2], d[3]})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> findApplicationsByPositionType() {
        return findAll().stream()
                .filter(a -> a.getJobTitle() != null)
                .collect(Collectors.groupingBy(Application::getJobTitle, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> findSeasonalHiringTrends() {
        return findAll().stream()
                .filter(a -> a.getSubmittedAt() != null)
                .collect(Collectors.groupingBy(a -> a.getSubmittedAt().getMonthValue(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    // ── Data visualization ──────────────────────────────────────────────────

    @Override
    public List<Object[]> findApplicationCountByStatus() {
        return getApplicationStatusCounts();
    }

    @Override
    public List<Object[]> findApplicationCountByDate(LocalDateTime fromDate) {
        return findAll().stream()
                .filter(a -> a.getSubmittedAt() != null && !a.getSubmittedAt().isBefore(fromDate))
                .collect(Collectors.groupingBy(a -> a.getSubmittedAt().toLocalDate(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> findTopPositionsByApplicationCount() {
        return findApplicationsByPositionType();
    }

    // ── Conversion: ApplicationItem <-> Application ─────────────────────────

    @Override
    protected Application toEntity(ApplicationItem item) {
        var app = new Application();
        if (item.getId() != null) {
            try {
                app.setId(Long.parseLong(item.getId()));
            } catch (NumberFormatException e) {
                // UUID-based ID from DynamoDB — store hash for compatibility
                app.setId((long) item.getId().hashCode());
            }
        }
        app.setTenantId(item.getTenantId());
        if (item.getJobPostingId() != null) {
            try {
                app.setJobPostingId(Long.parseLong(item.getJobPostingId()));
            } catch (NumberFormatException e) {
                // leave null if not parseable
            }
        }
        app.setJobTitle(item.getJobTitle());
        app.setJobId(item.getJobId());
        app.setDepartment(item.getDepartment());
        if (item.getStatus() != null) {
            app.setStatus(ApplicationStatus.valueOf(item.getStatus()));
        }
        if (item.getPipelineStage() != null) {
            app.setPipelineStage(PipelineStage.valueOf(item.getPipelineStage()));
        }
        if (item.getPipelineStageEnteredAt() != null) {
            app.setPipelineStageEnteredAt(LocalDateTime.parse(item.getPipelineStageEnteredAt(), ISO_FMT));
        }
        app.setCoverLetter(item.getCoverLetter());
        app.setApplicationSource(item.getApplicationSource());
        if (item.getSubmittedAt() != null) {
            app.setSubmittedAt(LocalDateTime.parse(item.getSubmittedAt(), ISO_FMT));
        }
        if (item.getWithdrawnAt() != null) {
            app.setWithdrawnAt(LocalDateTime.parse(item.getWithdrawnAt(), ISO_FMT));
        }
        app.setWithdrawalReason(item.getWithdrawalReason());
        app.setScreeningNotes(item.getScreeningNotes());
        app.setInterviewFeedback(item.getInterviewFeedback());
        if (item.getRating() != null) {
            app.setRating(Integer.parseInt(item.getRating()));
        }
        app.setRejectionReason(item.getRejectionReason());
        app.setOfferDetails(item.getOfferDetails());
        if (item.getStartDate() != null) {
            app.setStartDate(LocalDateTime.parse(item.getStartDate(), ISO_FMT));
        }
        if (item.getSalaryExpectation() != null) {
            app.setSalaryExpectation(Double.parseDouble(item.getSalaryExpectation()));
        }
        if (item.getAvailabilityDate() != null) {
            app.setAvailabilityDate(LocalDateTime.parse(item.getAvailabilityDate(), ISO_FMT));
        }
        if (item.getInterviewedAt() != null) {
            app.setInterviewedAt(LocalDateTime.parse(item.getInterviewedAt(), ISO_FMT));
        }
        if (item.getOfferExtendedAt() != null) {
            app.setOfferExtendedAt(LocalDateTime.parse(item.getOfferExtendedAt(), ISO_FMT));
        }
        if (item.getResponseDeadline() != null) {
            app.setResponseDeadline(LocalDateTime.parse(item.getResponseDeadline(), ISO_FMT));
        }
        if (item.getCreatedAt() != null) {
            app.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            app.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return app;
    }

    @Override
    protected ApplicationItem toItem(Application entity) {
        var item = new ApplicationItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String submittedAtStr = entity.getSubmittedAt() != null
                ? entity.getSubmittedAt().format(ISO_FMT)
                : LocalDateTime.now().format(ISO_FMT);

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("APPLICATION#" + id);

        // GSI1: Status queries (sorted by submission date)
        if (entity.getStatus() != null) {
            item.setGsi1pk("APP_STATUS#" + entity.getStatus().name());
            item.setGsi1sk("APP#" + submittedAtStr);
        }

        // GSI2: FK lookup by jobPostingId
        if (entity.getJobPostingId() != null) {
            item.setGsi2pk("APP_JOB_POSTING#" + entity.getJobPostingId());
            item.setGsi2sk("APP#" + id);
        } else if (entity.getJobPosting() != null && entity.getJobPosting().getId() != null) {
            item.setGsi2pk("APP_JOB_POSTING#" + entity.getJobPosting().getId());
            item.setGsi2sk("APP#" + id);
        }

        // GSI3: Department queries (sorted by submission date)
        if (entity.getDepartment() != null) {
            item.setGsi3pk("APP_DEPT#" + entity.getDepartment());
            item.setGsi3sk("APP#" + submittedAtStr);
        }

        // GSI4: Applicant lookup
        if (entity.getApplicant() != null && entity.getApplicant().getId() != null) {
            item.setGsi4pk("APP_APPLICANT#" + entity.getApplicant().getId());
            item.setGsi4sk("APP#" + id);
        }

        // GSI6: Date range queries per tenant
        item.setGsi6pk("APP_CREATED#" + tenantId);
        item.setGsi6sk("APP#" + submittedAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getApplicant() != null && entity.getApplicant().getId() != null) {
            item.setApplicantId(entity.getApplicant().getId().toString());
        }
        if (entity.getJobPostingId() != null) {
            item.setJobPostingId(entity.getJobPostingId().toString());
        } else if (entity.getJobPosting() != null && entity.getJobPosting().getId() != null) {
            item.setJobPostingId(entity.getJobPosting().getId().toString());
        }
        item.setJobTitle(entity.getJobTitle());
        item.setJobId(entity.getJobId());
        item.setDepartment(entity.getDepartment());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        if (entity.getPipelineStage() != null) {
            item.setPipelineStage(entity.getPipelineStage().name());
        }
        if (entity.getPipelineStageEnteredAt() != null) {
            item.setPipelineStageEnteredAt(entity.getPipelineStageEnteredAt().format(ISO_FMT));
        }
        item.setCoverLetter(entity.getCoverLetter());
        item.setApplicationSource(entity.getApplicationSource());
        item.setSubmittedAt(submittedAtStr);
        if (entity.getWithdrawnAt() != null) {
            item.setWithdrawnAt(entity.getWithdrawnAt().format(ISO_FMT));
        }
        item.setWithdrawalReason(entity.getWithdrawalReason());
        item.setScreeningNotes(entity.getScreeningNotes());
        item.setInterviewFeedback(entity.getInterviewFeedback());
        if (entity.getRating() != null) {
            item.setRating(entity.getRating().toString());
        }
        item.setRejectionReason(entity.getRejectionReason());
        item.setOfferDetails(entity.getOfferDetails());
        if (entity.getStartDate() != null) {
            item.setStartDate(entity.getStartDate().format(ISO_FMT));
        }
        if (entity.getSalaryExpectation() != null) {
            item.setSalaryExpectation(entity.getSalaryExpectation().toString());
        }
        if (entity.getAvailabilityDate() != null) {
            item.setAvailabilityDate(entity.getAvailabilityDate().format(ISO_FMT));
        }
        if (entity.getInterviewedAt() != null) {
            item.setInterviewedAt(entity.getInterviewedAt().format(ISO_FMT));
        }
        if (entity.getOfferExtendedAt() != null) {
            item.setOfferExtendedAt(entity.getOfferExtendedAt().format(ISO_FMT));
        }
        if (entity.getResponseDeadline() != null) {
            item.setResponseDeadline(entity.getResponseDeadline().format(ISO_FMT));
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    private CursorPage<Application> paginateInMemory(List<Application> all, String cursor, int pageSize) {
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try {
                offset = Integer.parseInt(cursor);
            } catch (NumberFormatException e) {
                offset = 0;
            }
        }
        List<Application> page = all.stream()
                .skip(offset)
                .limit(pageSize)
                .collect(Collectors.toList());
        boolean hasMore = offset + pageSize < all.size();
        String nextCursor = hasMore ? String.valueOf(offset + pageSize) : null;
        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) all.size());
    }
}
