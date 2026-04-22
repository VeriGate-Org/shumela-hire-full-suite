-- V028: Add self/manager/final score fields to review_goal_scores

ALTER TABLE review_goal_scores ADD self_score NUMERIC(3,2);
ALTER TABLE review_goal_scores ADD self_comment NVARCHAR(MAX);
ALTER TABLE review_goal_scores ADD manager_score NUMERIC(3,2);
ALTER TABLE review_goal_scores ADD manager_comment NVARCHAR(MAX);
ALTER TABLE review_goal_scores ADD final_score NUMERIC(3,2);

-- Constraints
ALTER TABLE review_goal_scores ADD CONSTRAINT chk_rgs_self_score CHECK (self_score IS NULL OR (self_score >= 0.0 AND self_score <= 5.0));
ALTER TABLE review_goal_scores ADD CONSTRAINT chk_rgs_manager_score CHECK (manager_score IS NULL OR (manager_score >= 0.0 AND manager_score <= 5.0));
ALTER TABLE review_goal_scores ADD CONSTRAINT chk_rgs_final_score CHECK (final_score IS NULL OR (final_score >= 0.0 AND final_score <= 5.0));
