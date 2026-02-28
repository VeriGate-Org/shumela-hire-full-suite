-- V005: Update notification channels and job board types (SQL Server)

UPDATE notifications SET channel = 'EMAIL' WHERE channel = 'SMS';
UPDATE notifications SET channel = 'IN_APP' WHERE channel = 'SLACK';
UPDATE tg_job_board_postings SET board_type = 'CUSTOM' WHERE board_type = 'GLASSDOOR';
