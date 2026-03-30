package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class JobBoardPosting extends TenantAwareEntity {

    private Long id;

    private String jobPostingId;

    private JobBoardType boardType;

    private PostingStatus status = PostingStatus.DRAFT;

    private String externalPostId;

    private String externalUrl;

    private LocalDateTime postedAt;

    private LocalDateTime expiresAt;

    private Integer viewCount = 0;

    private Integer clickCount = 0;

    private Integer applicationCount = 0;

    private String errorMessage;

    private String boardConfig; // JSON config for board-specific settings

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public JobBoardPosting() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public JobBoardType getBoardType() { return boardType; }
    public void setBoardType(JobBoardType boardType) { this.boardType = boardType; }

    public PostingStatus getStatus() { return status; }
    public void setStatus(PostingStatus status) { this.status = status; }

    public String getExternalPostId() { return externalPostId; }
    public void setExternalPostId(String externalPostId) { this.externalPostId = externalPostId; }

    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }

    public LocalDateTime getPostedAt() { return postedAt; }
    public void setPostedAt(LocalDateTime postedAt) { this.postedAt = postedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }

    public Integer getClickCount() { return clickCount; }
    public void setClickCount(Integer clickCount) { this.clickCount = clickCount; }

    public Integer getApplicationCount() { return applicationCount; }
    public void setApplicationCount(Integer applicationCount) { this.applicationCount = applicationCount; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getBoardConfig() { return boardConfig; }
    public void setBoardConfig(String boardConfig) { this.boardConfig = boardConfig; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
