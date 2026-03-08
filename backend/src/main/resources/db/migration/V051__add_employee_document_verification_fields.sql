ALTER TABLE employee_documents ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_documents ADD COLUMN verified_by VARCHAR(255);
ALTER TABLE employee_documents ADD COLUMN verified_at TIMESTAMP;
