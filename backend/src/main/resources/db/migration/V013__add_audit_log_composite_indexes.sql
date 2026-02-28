-- V013: Add composite indexes to audit_logs for query performance and userRole column

-- Composite index for entity-based lookups (used by getLogsByEntity)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp
    ON audit_logs (entity_type, entity_id, timestamp DESC);

-- Composite index for user-based lookups (used by getLogsByUser)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp
    ON audit_logs (user_id, timestamp DESC);

-- Add user_role column to track the role of the user at the time of the action
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(30);
