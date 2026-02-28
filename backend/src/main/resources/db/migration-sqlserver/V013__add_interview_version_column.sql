-- Add optimistic locking version column to interviews table
ALTER TABLE interviews ADD version BIGINT NOT NULL DEFAULT 0;
