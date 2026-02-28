-- Add optimistic locking version column to interviews table
ALTER TABLE interviews ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
