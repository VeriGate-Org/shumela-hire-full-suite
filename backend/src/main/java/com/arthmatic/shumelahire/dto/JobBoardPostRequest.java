package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobBoardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class JobBoardPostRequest {

    @NotBlank(message = "Job posting ID is required")
    private String jobPostingId;

    @NotNull(message = "Board type is required")
    private JobBoardType boardType;

    private String boardConfig; // JSON string for board-specific settings

    public JobBoardPostRequest() {}

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public JobBoardType getBoardType() { return boardType; }
    public void setBoardType(JobBoardType boardType) { this.boardType = boardType; }

    public String getBoardConfig() { return boardConfig; }
    public void setBoardConfig(String boardConfig) { this.boardConfig = boardConfig; }
}
