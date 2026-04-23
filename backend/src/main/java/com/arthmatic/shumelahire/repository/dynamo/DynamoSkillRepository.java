package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.Skill;
import com.arthmatic.shumelahire.repository.SkillDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SkillItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the Skill entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     SKILL#{id}
 *   GSI1PK: SKILL_ACTIVE#{isActive}     GSI1SK: SKILL#{name}
 *   GSI3PK: SKILL_CATEGORY#{category}   GSI3SK: SKILL#{name}
 *   GSI4PK: SKILL_NAME#{name}           GSI4SK: SKILL#{id}
 * </pre>
 */
@Repository
public class DynamoSkillRepository extends DynamoRepository<SkillItem, Skill>
        implements SkillDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSkillRepository(DynamoDbClient dynamoDbClient,
                                  DynamoDbEnhancedClient enhancedClient,
                                  String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SkillItem.class);
    }

    @Override
    protected String entityType() {
        return "SKILL";
    }

    // ── SkillDataRepository implementation ───────────────────────────────────

    @Override
    public List<Skill> findAllOrderByName() {
        return findAll().stream()
                .sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Override
    public List<Skill> findActiveOrderByName() {
        return queryGsiAll("GSI1", "SKILL_ACTIVE#true").stream()
                .sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Skill> findByName(String name) {
        return findByGsiUnique("GSI4", "SKILL_NAME#" + name);
    }

    @Override
    public Optional<Skill> findByCode(String code) {
        // Skills per tenant are typically small, so scan + filter is acceptable
        return findAll().stream()
                .filter(s -> code.equals(s.getCode()))
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
                .map(Skill::getName)
                .collect(Collectors.toList());
    }

    @Override
    public List<Skill> findByCategoryAndActiveOrderByName(String category) {
        return queryGsiAll("GSI3", "SKILL_CATEGORY#" + category).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .sorted(Comparator.comparing(Skill::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    // ── Conversion: SkillItem <-> Skill ──────────────────────────────────────

    @Override
    protected Skill toEntity(SkillItem item) {
        var skill = new Skill();
        if (item.getId() != null) {
            skill.setId(item.getId());
        }
        skill.setTenantId(item.getTenantId());
        skill.setName(item.getName());
        skill.setCode(item.getCode());
        skill.setCategory(item.getCategory());
        skill.setDescription(item.getDescription());
        skill.setIsActive(item.getIsActive());
        if (item.getCreatedAt() != null) {
            skill.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            skill.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return skill;
    }

    @Override
    protected SkillItem toItem(Skill entity) {
        var item = new SkillItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : java.util.UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("SKILL#" + id);

        // GSI1: Active status index
        item.setGsi1pk("SKILL_ACTIVE#" + entity.getIsActive());
        item.setGsi1sk("SKILL#" + entity.getName());

        // GSI3: Category index
        String category = entity.getCategory() != null ? entity.getCategory() : "UNCATEGORIZED";
        item.setGsi3pk("SKILL_CATEGORY#" + category);
        item.setGsi3sk("SKILL#" + entity.getName());

        // GSI4: Unique constraint on name
        item.setGsi4pk("SKILL_NAME#" + entity.getName());
        item.setGsi4sk("SKILL#" + id);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        item.setCode(entity.getCode());
        item.setCategory(entity.getCategory());
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
