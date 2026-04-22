package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public class ReviewGoalScore extends TenantAwareEntity {

    private Long id;

    private PerformanceReview review;

    private PerformanceGoal goal;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    private BigDecimal score;

    private String comment;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    private BigDecimal selfScore;

    private String selfComment;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    private BigDecimal managerScore;

    private String managerComment;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    private BigDecimal finalScore;

    // Constructors
    public ReviewGoalScore() {}

    public ReviewGoalScore(PerformanceReview review, PerformanceGoal goal, BigDecimal score) {
        this.review = review;
        this.goal = goal;
        this.score = score;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PerformanceReview getReview() { return review; }
    public void setReview(PerformanceReview review) { this.review = review; }

    public PerformanceGoal getGoal() { return goal; }
    public void setGoal(PerformanceGoal goal) { this.goal = goal; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public BigDecimal getSelfScore() { return selfScore; }
    public void setSelfScore(BigDecimal selfScore) { this.selfScore = selfScore; }

    public String getSelfComment() { return selfComment; }
    public void setSelfComment(String selfComment) { this.selfComment = selfComment; }

    public BigDecimal getManagerScore() { return managerScore; }
    public void setManagerScore(BigDecimal managerScore) { this.managerScore = managerScore; }

    public String getManagerComment() { return managerComment; }
    public void setManagerComment(String managerComment) { this.managerComment = managerComment; }

    public BigDecimal getFinalScore() { return finalScore; }
    public void setFinalScore(BigDecimal finalScore) { this.finalScore = finalScore; }
}
