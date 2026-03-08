package com.arthmatic.shumelahire.dto.integration;

import java.time.LocalDateTime;

public class SageConnectionTestResult {

    private boolean success;
    private String message;
    private LocalDateTime testedAt;

    public SageConnectionTestResult() {}

    public SageConnectionTestResult(boolean success, String message, LocalDateTime testedAt) {
        this.success = success;
        this.message = message;
        this.testedAt = testedAt;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getTestedAt() { return testedAt; }
    public void setTestedAt(LocalDateTime testedAt) { this.testedAt = testedAt; }
}
