ALTER TABLE job_postings ADD COLUMN required_check_types TEXT;
ALTER TABLE job_postings ADD COLUMN enforce_check_completion BOOLEAN NOT NULL DEFAULT FALSE;
