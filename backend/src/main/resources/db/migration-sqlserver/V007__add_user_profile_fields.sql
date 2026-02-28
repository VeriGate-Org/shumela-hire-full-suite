-- V007: Add user profile fields (SQL Server)

ALTER TABLE users ADD phone VARCHAR(30);
ALTER TABLE users ADD location VARCHAR(100);
ALTER TABLE users ADD job_title VARCHAR(100);
ALTER TABLE users ADD department VARCHAR(100);
