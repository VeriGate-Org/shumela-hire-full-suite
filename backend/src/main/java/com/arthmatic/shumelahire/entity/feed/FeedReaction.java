package com.arthmatic.shumelahire.entity.feed;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class FeedReaction extends TenantAwareEntity {

    private Long id;

    @NotNull
    private Long postId;

    @NotNull
    private Long userId;

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
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public ReactionType getReactionType() { return reactionType; }
    public void setReactionType(ReactionType reactionType) { this.reactionType = reactionType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
