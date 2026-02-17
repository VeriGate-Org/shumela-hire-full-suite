package com.arthmatic.shumelahire.entity.performance;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

@Entity
@Table(name = "review_goal_scores")
public class ReviewGoalScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private PerformanceReview review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private PerformanceGoal goal;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    @Column(precision = 3, scale = 2)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
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
