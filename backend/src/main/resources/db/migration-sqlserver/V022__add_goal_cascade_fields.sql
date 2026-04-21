-- V022: Goal cascade hierarchy fields
ALTER TABLE performance_goals ADD parent_goal_id BIGINT NULL;
ALTER TABLE performance_goals ADD cascade_level INT DEFAULT 0;

CREATE INDEX idx_performance_goals_parent ON performance_goals(parent_goal_id);
