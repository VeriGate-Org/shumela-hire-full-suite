package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.feed.FeedPost;
import com.arthmatic.shumelahire.repository.FeedPostDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.FeedPostItem;

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
public class DynamoFeedPostRepository extends DynamoRepository<FeedPostItem, FeedPost>
        implements FeedPostDataRepository {

    public DynamoFeedPostRepository(DynamoDbClient dynamoDbClient,
                                     DynamoDbEnhancedClient enhancedClient,
                                     @Value("${aws.dynamodb.table-name}") String tableName) {
        super(dynamoDbClient, enhancedClient, tableName, FeedPostItem.class);
    }

    @Override
    protected String entityType() {
        return "FEED_POST";
    }

    @Override
    public List<FeedPost> findByCategory(String category, int page, int size) {
        String tenantId = currentTenantId();
        List<FeedPost> posts = queryGsiAll("GSI1", "FEED_POST_CAT#" + tenantId + "#" + category);
        return posts.stream()
                .sorted(Comparator.comparing(FeedPost::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedPost> findAll(int page, int size) {
        return findAll().stream()
                .sorted(Comparator.comparing(FeedPost::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedPost> findPinned() {
        return findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getPinned()))
                .sorted(Comparator.comparing(FeedPost::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    protected FeedPost toEntity(FeedPostItem item) {
        var e = new FeedPost();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());
        if (item.getAuthorId() != null) {
            e.setAuthorId(safeParseLong(item.getAuthorId()));
        }
        e.setAuthorName(item.getAuthorName());
        e.setTitle(item.getTitle());
        e.setContent(item.getContent());
        if (item.getCategory() != null) {
            e.setCategory(FeedPost.FeedCategory.valueOf(item.getCategory()));
        }
        e.setPinned(item.getPinned());
        e.setPublishedAt(item.getPublishedAt());
        if (item.getStatus() != null) {
            e.setStatus(FeedPost.PostStatus.valueOf(item.getStatus()));
        }
        if (item.getCommentCount() != null) {
            e.setCommentCount(item.getCommentCount());
        }
        if (item.getReactionCount() != null) {
            e.setReactionCount(item.getReactionCount());
        }
        e.setCreatedAt(item.getCreatedAt());
        e.setUpdatedAt(item.getUpdatedAt());
        return e;
    }

    @Override
    protected FeedPostItem toItem(FeedPost entity) {
        var item = new FeedPostItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        LocalDateTime createdAt = entity.getCreatedAt() != null ? entity.getCreatedAt() : LocalDateTime.now();
        String category = entity.getCategory() != null ? entity.getCategory().name() : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("FEED_POST#" + id);
        if (category != null) {
            item.setGsi1pk("FEED_POST_CAT#" + tenantId + "#" + category);
            item.setGsi1sk("FEED_POST#" + createdAt);
        }

        item.setId(id);
        item.setTenantId(tenantId);
        if (entity.getAuthorId() != null) {
            item.setAuthorId(entity.getAuthorId().toString());
        }
        item.setAuthorName(entity.getAuthorName());
        item.setTitle(entity.getTitle());
        item.setContent(entity.getContent());
        item.setCategory(category);
        item.setPinned(entity.getPinned());
        item.setPublishedAt(entity.getPublishedAt());
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        item.setCommentCount(entity.getCommentCount());
        item.setReactionCount(entity.getReactionCount());
        item.setCreatedAt(createdAt);
        item.setUpdatedAt(entity.getUpdatedAt());
        return item;
    }
}
