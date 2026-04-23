package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.feed.FeedReaction;
import com.arthmatic.shumelahire.repository.FeedReactionDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.FeedReactionItem;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DynamoFeedReactionRepository extends DynamoRepository<FeedReactionItem, FeedReaction>
        implements FeedReactionDataRepository {

    public DynamoFeedReactionRepository(DynamoDbClient dynamoDbClient,
                                         DynamoDbEnhancedClient enhancedClient,
                                         @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, FeedReactionItem.class);
    }

    @Override
    protected String entityType() {
        return "FEED_REACTION";
    }

    @Override
    public List<FeedReaction> findByPostId(String postId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "FEED_REACTION_POST#" + tenantId + "#" + postId);
    }

    @Override
    public Optional<FeedReaction> findByPostIdAndUserId(String postId, String userId) {
        return findByPostId(postId).stream()
                .filter(r -> r.getUserId() != null && userId.equals(r.getUserId()))
                .findFirst();
    }

    @Override
    protected FeedReaction toEntity(FeedReactionItem item) {
        var e = new FeedReaction();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());
        if (item.getPostId() != null) {
            e.setPostId(item.getPostId());
        }
        if (item.getUserId() != null) {
            e.setUserId(item.getUserId());
        }
        if (item.getReactionType() != null) {
            e.setReactionType(FeedReaction.ReactionType.valueOf(item.getReactionType()));
        }
        e.setCreatedAt(item.getCreatedAt());
        return e;
    }

    @Override
    protected FeedReactionItem toItem(FeedReaction entity) {
        var item = new FeedReactionItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String postId = entity.getPostId() != null ? entity.getPostId() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("FEED_REACTION#" + id);
        if (postId != null) {
            item.setGsi1pk("FEED_REACTION_POST#" + tenantId + "#" + postId);
            item.setGsi1sk("FEED_REACTION#" + createdAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        item.setPostId(postId);
        if (entity.getUserId() != null) {
            item.setUserId(entity.getUserId());
        }
        if (entity.getReactionType() != null) {
            item.setReactionType(entity.getReactionType().name());
        }
        item.setCreatedAt(createdAt);
        return item;
    }
}
