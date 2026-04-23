package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.PerformanceContractDataRepository;
import com.arthmatic.shumelahire.repository.PerformanceCycleDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewService {

    @Autowired
    private PerformanceContractDataRepository contractRepository;

    @Autowired
    private PerformanceCycleDataRepository cycleRepository;

    // In-memory store for demo (backed by entity logic, no dedicated repo needed yet)
    private final List<PerformanceReview> reviewStore = Collections.synchronizedList(new ArrayList<>());
    private long nextId = 1;

    @Transactional(readOnly = true)
    public List<PerformanceReview> getReviews(String cycleId, String employeeId, String status) {
        String tenantId = TenantContext.requireCurrentTenant();
        return reviewStore.stream()
                .filter(r -> r.getTenantId() != null && r.getTenantId().equals(tenantId))
                .filter(r -> cycleId == null || (r.getContract() != null && r.getContract().getCycle() != null
                        && r.getContract().getCycle().getId() != null
                        && r.getContract().getCycle().getId().equals(cycleId)))
                .filter(r -> employeeId == null || employeeId.isEmpty()
                        || (r.getContract() != null && employeeId.equals(r.getContract().getEmployeeId())))
                .filter(r -> status == null || status.isEmpty()
                        || r.getStatus().name().equalsIgnoreCase(status))
                .sorted(Comparator.comparing(PerformanceReview::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PerformanceReview> getReview(String id) {
        String tenantId = TenantContext.requireCurrentTenant();
        return reviewStore.stream()
                .filter(r -> r.getId() != null && r.getId().equals(id))
                .filter(r -> r.getTenantId() != null && r.getTenantId().equals(tenantId))
                .findFirst();
    }

    public PerformanceReview createReview(String contractId, String reviewType) {
        String tenantId = TenantContext.requireCurrentTenant();
        PerformanceContract contract = contractRepository.findByIdAndTenantId(contractId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Performance contract not found"));

        ReviewType type = ReviewType.valueOf(reviewType);
        PerformanceReview review = new PerformanceReview(contract, type);
        review.setId(String.valueOf(nextId++));
        review.setTenantId(tenantId);
        review.setReviewPeriodStart(LocalDateTime.now().minusMonths(6));
        review.setReviewPeriodEnd(LocalDateTime.now());
        review.setDueDate(LocalDateTime.now().plusDays(30));

        // Initialize empty goal scores from contract goals
        List<ReviewGoalScore> goalScores = new ArrayList<>();
        if (contract.getGoals() != null) {
            for (PerformanceGoal goal : contract.getGoals()) {
                ReviewGoalScore gs = new ReviewGoalScore(review, goal, null);
                goalScores.add(gs);
            }
        }
        review.setGoalScores(goalScores);

        reviewStore.add(review);
        return review;
    }

    public PerformanceReview submitSelfAssessment(String id, String notes, BigDecimal rating,
                                                   List<GoalScoreInput> goalScores) {
        PerformanceReview review = getReview(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.submitSelfAssessment(notes, rating);

        if (goalScores != null && review.getGoalScores() != null) {
            for (GoalScoreInput input : goalScores) {
                review.getGoalScores().stream()
                        .filter(gs -> gs.getGoal() != null && gs.getGoal().getId() != null
                                && gs.getGoal().getId().equals(input.goalId))
                        .findFirst()
                        .ifPresent(gs -> {
                            gs.setSelfScore(input.score);
                            gs.setSelfComment(input.comment);
                        });
            }
        }

        return review;
    }

    public PerformanceReview submitManagerAssessment(String id, String notes, BigDecimal rating,
                                                     List<GoalScoreInput> goalScores) {
        PerformanceReview review = getReview(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.submitManagerAssessment(notes, rating);

        if (goalScores != null && review.getGoalScores() != null) {
            for (GoalScoreInput input : goalScores) {
                review.getGoalScores().stream()
                        .filter(gs -> gs.getGoal() != null && gs.getGoal().getId() != null
                                && gs.getGoal().getId().equals(input.goalId))
                        .findFirst()
                        .ifPresent(gs -> {
                            gs.setManagerScore(input.score);
                            gs.setManagerComment(input.comment);
                            // Calculate final as average of self and manager
                            if (gs.getSelfScore() != null) {
                                gs.setFinalScore(gs.getSelfScore().add(input.score)
                                        .divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP));
                            } else {
                                gs.setFinalScore(input.score);
                            }
                        });
            }
        }

        return review;
    }

    public PerformanceReview completeReview(String id) {
        PerformanceReview review = getReview(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        review.completeReview();
        return review;
    }

    public static class GoalScoreInput {
        public Long goalId;
        public BigDecimal score;
        public String comment;
    }
}
