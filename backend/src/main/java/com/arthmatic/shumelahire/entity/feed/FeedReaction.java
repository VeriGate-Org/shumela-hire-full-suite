package com.arthmatic.shumelahire.entity.feed;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class FeedReaction extends TenantAwareEntity {

    private String id;

    @NotNull
    private String postId;

    @NotNull
    private String userId;

    @NotNull
    private ReactionType reactionType;

    private LocalDateTime createdAt;

    public enum ReactionType {
        LIKE, CELEBRATE, SUPPORT
    }

    public FeedReaction() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public ReactionType getReactionType() { return reactionType; }
    public void setReactionType(ReactionType reactionType) { this.reactionType = reactionType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
