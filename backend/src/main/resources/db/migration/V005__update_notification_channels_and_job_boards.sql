-- V005: Update notification channels and job board types
-- Migrate SMS notifications to EMAIL, SLACK to IN_APP, remove GLASSDOOR postings

-- Convert SMS notifications to EMAIL
UPDATE notifications SET channel = 'EMAIL' WHERE channel = 'SMS';

-- Convert SLACK notifications to IN_APP
UPDATE notifications SET channel = 'IN_APP' WHERE channel = 'SLACK';

-- Convert GLASSDOOR job board postings to CUSTOM
UPDATE tg_job_board_postings SET board_type = 'CUSTOM' WHERE board_type = 'GLASSDOOR';
