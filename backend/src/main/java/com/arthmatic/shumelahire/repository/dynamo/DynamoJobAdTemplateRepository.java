package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.JobAdTemplate;
import com.arthmatic.shumelahire.repository.JobAdTemplateDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.JobAdTemplateItem;

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
 * DynamoDB repository for the JobAdTemplate entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     JOB_AD_TEMPLATE#{id}
 *   GSI1PK: TEMPLATE_ARCHIVED#{isArchived}      GSI1SK: JOB_AD_TEMPLATE#{createdAt}
 *   GSI3PK: TEMPLATE_EMPTYPE#{employmentType}    GSI3SK: JOB_AD_TEMPLATE#{createdAt}
 *   GSI6PK: TEMPLATE_CREATED#{tenantId}          GSI6SK: JOB_AD_TEMPLATE#{createdAt}
 * </pre>
 */
@Repository
public class DynamoJobAdTemplateRepository extends DynamoRepository<JobAdTemplateItem, JobAdTemplate>
        implements JobAdTemplateDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoJobAdTemplateRepository(DynamoDbClient dynamoDbClient,
                                          DynamoDbEnhancedClient enhancedClient,
                                          String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, JobAdTemplateItem.class);
    }

    @Override
    protected String entityType() {
        return "JOB_AD_TEMPLATE";
    }

    // ── JobAdTemplateDataRepository implementation ──────────────────────────

    @Override
    public List<JobAdTemplate> findByIsArchivedFalseOrderByCreatedAtDesc() {
        return queryGsiAll("GSI1", "TEMPLATE_ARCHIVED#false").stream()
                .sorted(Comparator.comparing(JobAdTemplate::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAdTemplate> findAllOrderByCreatedAtDesc() {
        return findAll().stream()
                .sorted(Comparator.comparing(JobAdTemplate::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public List<JobAdTemplate> findWithFilters(String search, String employmentType,
                                                String location, String createdBy,
                                                boolean showArchived) {
        return findAll().stream()
                .filter(t -> showArchived || !Boolean.TRUE.equals(t.getIsArchived()))
                .filter(t -> search == null || search.isBlank() ||
                        (t.getName() != null && t.getName().toLowerCase().contains(search.toLowerCase())) ||
                        (t.getDescription() != null && t.getDescription().toLowerCase().contains(search.toLowerCase())))
                .filter(t -> employmentType == null || employmentType.equals(t.getEmploymentType()))
                .filter(t -> location == null || location.isBlank() ||
                        (t.getLocation() != null && t.getLocation().toLowerCase().contains(location.toLowerCase())))
                .filter(t -> createdBy == null || createdBy.equals(t.getCreatedBy()))
                .sorted(Comparator.comparing(JobAdTemplate::getCreatedAt, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public long countByIsArchivedFalse() {
        return findAll().stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsArchived()))
                .count();
    }

    @Override
    public long countByIsArchivedTrue() {
        return findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsArchived()))
                .count();
    }

    @Override
    public Optional<JobAdTemplate> findMostUsedActiveTemplate() {
        return findAll().stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsArchived()))
                .max(Comparator.comparingInt(t -> t.getUsageCount() != null ? t.getUsageCount() : 0));
    }

    @Override
    public Optional<JobAdTemplate> findFirstByIsArchivedFalseOrderByUsageCountDesc() {
        return findMostUsedActiveTemplate();
    }

    @Override
    public List<JobAdTemplate> findRecentlyCreated() {
        return findByIsArchivedFalseOrderByCreatedAtDesc();
    }

    // ── Conversion: JobAdTemplateItem <-> JobAdTemplate ─────────────────────

    @Override
    protected JobAdTemplate toEntity(JobAdTemplateItem item) {
        var template = new JobAdTemplate();
        if (item.getId() != null) {
            template.setId(safeParseLong(item.getId()));
        }
        template.setTenantId(item.getTenantId());
        template.setName(item.getName());
        template.setDescription(item.getDescription());
        template.setTitle(item.getTitle());
        template.setIntro(item.getIntro());
        template.setResponsibilities(item.getResponsibilities());
        template.setRequirements(item.getRequirements());
        template.setBenefits(item.getBenefits());
        template.setLocation(item.getLocation());
        template.setEmploymentType(item.getEmploymentType());
        if (item.getSalaryRangeMin() != null) {
            template.setSalaryRangeMin(new BigDecimal(item.getSalaryRangeMin()));
        }
        if (item.getSalaryRangeMax() != null) {
            template.setSalaryRangeMax(new BigDecimal(item.getSalaryRangeMax()));
        }
        if (item.getClosingDate() != null) {
            template.setClosingDate(LocalDate.parse(item.getClosingDate()));
        }
        template.setContactEmail(item.getContactEmail());
        template.setIsArchived(item.getIsArchived());
        template.setUsageCount(item.getUsageCount());
        template.setCreatedBy(item.getCreatedBy());
        if (item.getCreatedAt() != null) {
            template.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            template.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return template;
    }

    @Override
    protected JobAdTemplateItem toItem(JobAdTemplate entity) {
        var item = new JobAdTemplateItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("JOB_AD_TEMPLATE#" + id);

        // GSI1: Archived status index
        String createdAtStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().format(ISO_FMT)
                : LocalDateTime.now().format(ISO_FMT);
        item.setGsi1pk("TEMPLATE_ARCHIVED#" + entity.getIsArchived());
        item.setGsi1sk("JOB_AD_TEMPLATE#" + createdAtStr);

        // GSI3: Employment type
        if (entity.getEmploymentType() != null) {
            item.setGsi3pk("TEMPLATE_EMPTYPE#" + entity.getEmploymentType());
            item.setGsi3sk("JOB_AD_TEMPLATE#" + createdAtStr);
        }

        // GSI6: Date range — created
        item.setGsi6pk("TEMPLATE_CREATED#" + tenantId);
        item.setGsi6sk("JOB_AD_TEMPLATE#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setTitle(entity.getTitle());
        item.setIntro(entity.getIntro());
        item.setResponsibilities(entity.getResponsibilities());
        item.setRequirements(entity.getRequirements());
        item.setBenefits(entity.getBenefits());
        item.setLocation(entity.getLocation());
        item.setEmploymentType(entity.getEmploymentType());
        if (entity.getSalaryRangeMin() != null) {
            item.setSalaryRangeMin(entity.getSalaryRangeMin().toPlainString());
        }
        if (entity.getSalaryRangeMax() != null) {
            item.setSalaryRangeMax(entity.getSalaryRangeMax().toPlainString());
        }
        if (entity.getClosingDate() != null) {
            item.setClosingDate(entity.getClosingDate().toString());
        }
        item.setContactEmail(entity.getContactEmail());
        item.setIsArchived(entity.getIsArchived());
        item.setUsageCount(entity.getUsageCount());
        item.setCreatedBy(entity.getCreatedBy());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
