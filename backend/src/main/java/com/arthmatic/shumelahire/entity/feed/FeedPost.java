package com.arthmatic.shumelahire.entity.feed;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public class FeedPost extends TenantAwareEntity {

    private String id;

    private String authorId;

    private String authorName;

    private String title;

    @NotBlank
    private String content;

    private FeedCategory category = FeedCategory.DISCUSSION;

    private Boolean pinned = false;

    private LocalDateTime publishedAt;

    private PostStatus status = PostStatus.PUBLISHED;

    private List<FeedComment> comments;

    private List<FeedReaction> reactions;

    private int commentCount;

    private int reactionCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum FeedCategory {
        ANNOUNCEMENT, DISCUSSION, EVENT, POLICY_UPDATE, KUDOS
    }

    public enum PostStatus {
        DRAFT, PUBLISHED, ARCHIVED
    }

    public FeedPost() {
        this.createdAt = LocalDateTime.now();
        this.publishedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public FeedCategory getCategory() { return category; }
    public void setCategory(FeedCategory category) { this.category = category; }

    public Boolean getPinned() { return pinned; }
    public void setPinned(Boolean pinned) { this.pinned = pinned; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }

    public List<FeedComment> getComments() { return comments; }
    public void setComments(List<FeedComment> comments) { this.comments = comments; }

    public List<FeedReaction> getReactions() { return reactions; }
    public void setReactions(List<FeedReaction> reactions) { this.reactions = reactions; }

    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }

    public int getReactionCount() { return reactionCount; }
    public void setReactionCount(int reactionCount) { this.reactionCount = reactionCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
