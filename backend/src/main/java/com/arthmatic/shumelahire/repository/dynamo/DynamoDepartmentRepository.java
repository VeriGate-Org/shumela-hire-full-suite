package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Department;
import com.arthmatic.shumelahire.repository.DepartmentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DepartmentItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Department entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     DEPARTMENT#{id}
 *   GSI1PK: DEPT_ACTIVE#{isActive}    GSI1SK: DEPARTMENT#{name}
 *   GSI4PK: DEPT_NAME#{tenantId}#{name}  GSI4SK: DEPARTMENT#{id}
 * </pre>
 */
@Repository
public class DynamoDepartmentRepository extends DynamoRepository<DepartmentItem, Department>
        implements DepartmentDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoDepartmentRepository(DynamoDbClient dynamoDbClient,
                                       DynamoDbEnhancedClient enhancedClient,
                                       String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DepartmentItem.class);
    }

    @Override
    protected String entityType() {
        return "DEPARTMENT";
    }

    // ── DepartmentDataRepository implementation ──────────────────────────────

    @Override
    public List<Department> findAllOrderByName() {
        return findAll().stream()
                .sorted(Comparator.comparing(Department::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Override
    public List<Department> findActiveOrderByName() {
        return queryGsiAll("GSI1", "DEPT_ACTIVE#true").stream()
                .sorted(Comparator.comparing(Department::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Department> findByName(String name) {
        String tenantId = currentTenantId();
        return findByGsiUnique("GSI4", "DEPT_NAME#" + tenantId + "#" + name);
    }

    @Override
    public Optional<Department> findByCode(String code) {
        // Departments per tenant are small (<100), so scan + filter is acceptable
        return findAll().stream()
                .filter(d -> code.equals(d.getCode()))
                .findFirst();
    }

    @Override
    public boolean existsByName(String name) {
        return findByName(name).isPresent();
    }

    @Override
    public boolean existsByCode(String code) {
        return findByCode(code).isPresent();
    }

    @Override
    public List<String> findActiveNames() {
        return findActiveOrderByName().stream()
                .map(Department::getName)
                .collect(Collectors.toList());
    }

    // ── Conversion: DepartmentItem <-> Department ────────────────────────────

    @Override
    protected Department toEntity(DepartmentItem item) {
        var dept = new Department();
        if (item.getId() != null) {
            dept.setId(safeParseLong(item.getId()));
        }
        dept.setTenantId(item.getTenantId());
        dept.setName(item.getName());
        dept.setCode(item.getCode());
        dept.setDescription(item.getDescription());
        dept.setIsActive(item.getIsActive());
        if (item.getCreatedAt() != null) {
            dept.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            dept.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return dept;
    }

    @Override
    protected DepartmentItem toItem(Department entity) {
        var item = new DepartmentItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId().toString() : java.util.UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("DEPARTMENT#" + id);

        // GSI1: Active status index
        item.setGsi1pk("DEPT_ACTIVE#" + entity.getIsActive());
        item.setGsi1sk("DEPARTMENT#" + entity.getName());

        // GSI4: Unique constraint on name per tenant
        item.setGsi4pk("DEPT_NAME#" + tenantId + "#" + entity.getName());
        item.setGsi4sk("DEPARTMENT#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setCode(entity.getCode());
        item.setDescription(entity.getDescription());
        item.setIsActive(entity.getIsActive());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
