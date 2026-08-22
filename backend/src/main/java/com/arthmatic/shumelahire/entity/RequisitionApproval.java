package com.arthmatic.shumelahire.entity;

import java.time.LocalDateTime;

/**
 * A single recorded step in a requisition's approval chain.
 *
 * <p>Persisted as JSON on the requisition record rather than as a separate item, because approval
 * history is small, bounded by the length of the configured chain, and is never read independently
 * of its requisition.</p>
 *
 * <p>This is what makes the approval timeline real: before this existed, the UI derived a timeline
 * from a field the backend never supplied, so every step rendered as pending regardless of the
 * requisition's actual status.</p>
 */
public class RequisitionApproval {

    /** Role that acted, e.g. HR_MANAGER or EXECUTIVE. Matches {@link ApprovalStage}. */
    private String role;

    /** SUBMIT, APPROVE or REJECT. */
    private String action;

    /** User id of the actor. */
    private String actorUserId;

    /** Display name of the actor, captured at the time so history survives user renames. */
    private String actorName;

    private LocalDateTime timestamp;

    private String comment;

    public RequisitionApproval() {
    }

    public RequisitionApproval(String role, String action, String actorUserId, String actorName, String comment) {
        this.role = role;
        this.action = action;
        this.actorUserId = actorUserId;
        this.actorName = actorName;
        this.comment = comment;
        this.timestamp = LocalDateTime.now();
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(String actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
