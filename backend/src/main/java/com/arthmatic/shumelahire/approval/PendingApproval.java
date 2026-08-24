package com.arthmatic.shumelahire.approval;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One thing waiting for someone's approval, in a shape common to every kind.
 *
 * <p>The platform runs five separate approval mechanisms — requisitions, job adverts, offers,
 * salary recommendations and leave — each with its own screen, its own queue and its own idea of
 * who may act. Nobody has one place to see what they owe. This is the row in that place.
 *
 * <p>The field that makes five incomparable things comparable is {@link #getStakeAmount()}: what
 * approving actually commits the organisation to. A band ceiling, a package, a recommended salary.
 * Leave has no rand value and returns null for it — <b>days must never be added into a money
 * total</b>, which is why the amount and its label are separate fields rather than one string.
 */
public class PendingApproval {

    /** What kind of record this is. */
    public enum Kind {
        REQUISITION,
        JOB_ADVERT,
        OFFER,
        SALARY_RECOMMENDATION,
        LEAVE
    }

    /**
     * How confident we are that this item is waiting on <em>this</em> user.
     *
     * <p>Only two of the five sources can answer that. Leave knows its approver — its query takes a
     * manager id. Offers know an approval level and can filter on it. Requisitions, job adverts and
     * salary recommendations can only say that something is pending <em>somebody</em>, so those
     * arrive as {@link #UNCONFIRMED} and the UI must say so rather than implying ownership.
     */
    public enum Assignment {
        /** The source filtered by this user, so the item is theirs. */
        YOURS,
        /** The source could only report that it is pending someone. */
        UNCONFIRMED
    }

    private String id;
    private Kind kind;
    private String title;
    private String subtitle;
    private String raisedBy;
    private LocalDateTime waitingSince;
    private String stage;
    private Assignment assignment = Assignment.UNCONFIRMED;

    /** What approving commits, in rands. Null where the commitment is not money. */
    private BigDecimal stakeAmount;
    /** What the amount means, or what the commitment is where there is no amount. */
    private String stakeLabel;

    public PendingApproval() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getRaisedBy() { return raisedBy; }
    public void setRaisedBy(String raisedBy) { this.raisedBy = raisedBy; }

    public LocalDateTime getWaitingSince() { return waitingSince; }
    public void setWaitingSince(LocalDateTime waitingSince) { this.waitingSince = waitingSince; }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public BigDecimal getStakeAmount() { return stakeAmount; }
    public void setStakeAmount(BigDecimal stakeAmount) { this.stakeAmount = stakeAmount; }

    public String getStakeLabel() { return stakeLabel; }
    public void setStakeLabel(String stakeLabel) { this.stakeLabel = stakeLabel; }
}
