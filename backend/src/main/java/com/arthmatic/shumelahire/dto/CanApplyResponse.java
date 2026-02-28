package com.arthmatic.shumelahire.dto;

public class CanApplyResponse {
    private boolean canApply;

    public CanApplyResponse(boolean canApply) {
        this.canApply = canApply;
    }

    public boolean isCanApply() {
        return canApply;
    }

    public void setCanApply(boolean canApply) {
        this.canApply = canApply;
    }
}
