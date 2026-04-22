package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.feed.FeedComment;
import com.arthmatic.shumelahire.repository.FeedCommentDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.FeedCommentItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
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

    @Override
    protected FeedComment toEntity(FeedCommentItem item) {
        var e = new FeedComment();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());
        if (item.getPostId() != null) {
            e.setPostId(safeParseLong(item.getPostId()));
        }
        if (item.getAuthorId() != null) {
            e.setAuthorId(safeParseLong(item.getAuthorId()));
        }
        e.setAuthorName(item.getAuthorName());
        e.setContent(item.getContent());
        e.setCreatedAt(item.getCreatedAt());
        return e;
    }

    @Override
    protected FeedCommentItem toItem(FeedComment entity) {
        var item = new FeedCommentItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String postId = entity.getPostId() != null ? entity.getPostId().toString() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("FEED_COMMENT#" + id);
        if (postId != null) {
            item.setGsi1pk("FEED_COMMENT_POST#" + tenantId + "#" + postId);
            item.setGsi1sk("FEED_COMMENT#" + createdAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setPostId(postId);
        if (entity.getAuthorId() != null) {
            item.setAuthorId(entity.getAuthorId().toString());
        }
        item.setAuthorName(entity.getAuthorName());
        item.setContent(entity.getContent());
        item.setCreatedAt(createdAt);
        return item;
    }
}
