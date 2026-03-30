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
}
