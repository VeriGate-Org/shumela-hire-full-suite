package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.DocumentTemplate;
import com.arthmatic.shumelahire.repository.DocumentTemplateDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.DocumentTemplateItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoDocumentTemplateRepository extends DynamoRepository<DocumentTemplateItem, DocumentTemplate>
        implements DocumentTemplateDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoDocumentTemplateRepository(DynamoDbClient dynamoDbClient,
                                             DynamoDbEnhancedClient enhancedClient,
                                             String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, DocumentTemplateItem.class);
    }

    @Override
    protected String entityType() {
        return "DOC_TEMPLATE";
    }

    @Override
    public List<DocumentTemplate> findByTypeAndNotArchived(String type) {
        String gsi1pk = "DOCTEMPL_TYPE#" + type + "_ARCHIVED#false";
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public List<DocumentTemplate> findAllNotArchived() {
        return findAll().stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsArchived()))
                .sorted((a, b) -> {
                    if (b.getCreatedAt() == null) return -1;
                    if (a.getCreatedAt() == null) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DocumentTemplate> findDefaultByType(String type) {
        String gsi3pk = "DOCTEMPL_DEFAULT#" + type;
        return findByGsiUnique("GSI3", gsi3pk);
    }

    @Override
    public CursorPage<DocumentTemplate> findWithFilters(String search, String type, boolean showArchived,
                                                         String cursor, int pageSize) {
        // For DynamoDB, use scan with filters for complex search
        // For small datasets per tenant, fetch all and filter in memory
        List<DocumentTemplate> all = findAll();
        List<DocumentTemplate> filtered = all.stream()
                .filter(t -> showArchived || !Boolean.TRUE.equals(t.getIsArchived()))
                .filter(t -> type == null || type.isBlank() || type.equals(t.getType()))
                .filter(t -> search == null || search.isBlank() ||
                        (t.getName() != null && t.getName().toLowerCase().contains(search.toLowerCase())))
                .sorted((a, b) -> {
                    if (b.getCreatedAt() == null) return -1;
                    if (a.getCreatedAt() == null) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());

        // Simple offset-based pagination from cursor
        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try { offset = Integer.parseInt(cursor); } catch (NumberFormatException ignored) {}
        }
        int end = Math.min(offset + pageSize, filtered.size());
        List<DocumentTemplate> page = filtered.subList(offset, end);
        boolean hasMore = end < filtered.size();
        String nextCursor = hasMore ? String.valueOf(end) : null;

        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) filtered.size());
    }

    @Override
    protected DocumentTemplate toEntity(DocumentTemplateItem item) {
        var entity = new DocumentTemplate();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setType(item.getType());
        entity.setName(item.getName());
        entity.setSubject(item.getSubject());
        entity.setContent(item.getContent());
        entity.setPlaceholders(item.getPlaceholders());
        entity.setIsDefault("true".equals(item.getIsDefault()));
        entity.setIsArchived("true".equals(item.getIsArchived()));
        entity.setCreatedBy(item.getCreatedBy());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected DocumentTemplateItem toItem(DocumentTemplate entity) {
        var item = new DocumentTemplateItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("DOC_TEMPLATE#" + id);

        String archivedStr = entity.getIsArchived() != null ? String.valueOf(entity.getIsArchived()) : "false";
        item.setGsi1pk("DOCTEMPL_TYPE#" + entity.getType() + "_ARCHIVED#" + archivedStr);
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";
        item.setGsi1sk("DOCTEMPL#" + createdAtStr);

        if (Boolean.TRUE.equals(entity.getIsDefault())) {
            item.setGsi3pk("DOCTEMPL_DEFAULT#" + entity.getType());
            item.setGsi3sk("DOC_TEMPLATE#" + id);
        }

        item.setId(id);
        item.setType(entity.getType());
        item.setName(entity.getName());
        item.setSubject(entity.getSubject());
        item.setContent(entity.getContent());
        item.setPlaceholders(entity.getPlaceholders());
        item.setIsDefault(entity.getIsDefault() != null ? String.valueOf(entity.getIsDefault()) : "false");
        item.setIsArchived(archivedStr);
        item.setCreatedBy(entity.getCreatedBy());
        item.setCreatedAt(createdAtStr);
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        item.setTenantId(tenantId);

        return item;
    }
}
