package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.performance.PerformanceTemplate;
import com.arthmatic.shumelahire.repository.PerformanceTemplateDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PerformanceTemplateItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DynamoPerformanceTemplateRepository extends DynamoRepository<PerformanceTemplateItem, PerformanceTemplate>
        implements PerformanceTemplateDataRepository {

    public DynamoPerformanceTemplateRepository(
            DynamoDbClient dynamoDbClient,
            DynamoDbEnhancedClient enhancedClient,
            @Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PerformanceTemplateItem.class);
    }

    @Override
    protected String entityType() {
        return "PERF_TMPL";
    }

    @Override
    public List<PerformanceTemplate> findByTenantIdAndIsActiveOrderByNameAsc(String tenantId) {
        return findAll().stream()
                .filter(template -> Boolean.TRUE.equals(template.getIsActive()))
                .sorted(Comparator.comparing(PerformanceTemplate::getName, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PerformanceTemplate> findByIdAndTenantId(String id, String tenantId) {
        return findById(id);
    }

    @Override
    public List<PerformanceTemplate> findByDepartmentAndJobLevelAndTenantIdAndIsActive(
            String department, String jobLevel, String tenantId) {
        return findAll().stream()
                .filter(template -> {
                    boolean matchesDept = template.getDepartment() != null && template.getDepartment().equals(department);
                    boolean matchesLevel = template.getJobLevel() != null && template.getJobLevel().equals(jobLevel);
                    boolean matchesActive = Boolean.TRUE.equals(template.getIsActive());
                    return matchesDept && matchesLevel && matchesActive;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PerformanceTemplate> findByTenantIdAndIsDefaultTrue(String tenantId) {
        return findAll().stream()
                .filter(template -> Boolean.TRUE.equals(template.getIsDefault()))
                .findFirst();
    }

    @Override
    public boolean existsByNameAndTenantId(String name, String tenantId) {
        return findAll().stream()
                .anyMatch(template -> template.getName() != null && template.getName().equals(name));
    }

    @Override
    protected PerformanceTemplate toEntity(PerformanceTemplateItem item) {
        if (item == null) return null;

        PerformanceTemplate entity = new PerformanceTemplate();
        entity.setId(item.getId() != null ? Long.parseLong(item.getId()) : null);
        entity.setTenantId(item.getTenantId());
        entity.setName(item.getName());
        entity.setDescription(item.getDescription());
        entity.setDepartment(item.getDepartment());
        entity.setJobLevel(item.getJobLevel());
        entity.setJobFamily(item.getJobFamily());
        entity.setGoalTemplate(item.getGoalTemplate());
        entity.setKpiTemplate(item.getKpiTemplate());
        entity.setIsActive(item.getIsActive());
        entity.setIsDefault(item.getIsDefault());

        entity.setCreatedAt(item.getCreatedAt());
        entity.setUpdatedAt(item.getUpdatedAt());

        entity.setCreatedBy(item.getCreatedBy());

        return entity;
    }

    @Override
    protected PerformanceTemplateItem toItem(PerformanceTemplate entity) {
        if (entity == null) return null;

        PerformanceTemplateItem item = new PerformanceTemplateItem();
        item.setId(entity.getId() != null ? entity.getId().toString() : null);
        item.setTenantId(entity.getTenantId());
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setDepartment(entity.getDepartment());
        item.setJobLevel(entity.getJobLevel());
        item.setJobFamily(entity.getJobFamily());
        item.setGoalTemplate(entity.getGoalTemplate());
        item.setKpiTemplate(entity.getKpiTemplate());
        item.setIsActive(entity.getIsActive());
        item.setIsDefault(entity.getIsDefault());

        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());

        item.setCreatedBy(entity.getCreatedBy());

        return item;
    }
}
