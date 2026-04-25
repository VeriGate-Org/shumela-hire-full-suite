package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.feed.FeedComment;
import com.arthmatic.shumelahire.repository.FeedCommentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.FeedCommentItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoFeedCommentRepository extends DynamoRepository<FeedCommentItem, FeedComment>
        implements FeedCommentDataRepository {

    public DynamoFeedCommentRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, FeedCommentItem.class);
    }

    @Override
    protected String entityType() {
        return "FEED_COMMENT";
    }

    @Override
    public List<FeedComment> findByPostId(String postId) {
        String tenantId = currentTenantId();
        List<FeedComment> comments = queryGsiAll("GSI1", "FEED_COMMENT_POST#" + tenantId + "#" + postId);
        return comments.stream()
                .sorted(Comparator.comparing(FeedComment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            String cleaned = value.endsWith("Z") ? value.substring(0, value.length() - 1) : value;
            return LocalDateTime.parse(cleaned);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String formatDateTime(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }

    @Override
    protected FeedComment toEntity(FeedCommentItem item) {
        var e = new FeedComment();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());
        if (item.getPostId() != null) {
            e.setPostId(item.getPostId());
        }
        if (item.getAuthorId() != null) {
            e.setAuthorId(item.getAuthorId());
        }
        e.setAuthorName(item.getAuthorName());
        e.setContent(item.getContent());
        e.setCreatedAt(parseDateTime(item.getCreatedAt()));
        return e;
    }

    @Override
    protected FeedCommentItem toItem(FeedComment entity) {
        var item = new FeedCommentItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String postId = entity.getPostId() != null ? entity.getPostId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("FEED_COMMENT#" + id);
        if (postId != null) {
            item.setGsi1pk("FEED_COMMENT_POST#" + tenantId + "#" + postId);
            item.setGsi1sk("FEED_COMMENT#" + formatDateTime(createdAt));
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setPostId(postId);
        if (entity.getAuthorId() != null) {
            item.setAuthorId(entity.getAuthorId());
        }
        item.setAuthorName(entity.getAuthorName());
        item.setContent(entity.getContent());
        item.setCreatedAt(formatDateTime(createdAt));
        return item;
    }
}
