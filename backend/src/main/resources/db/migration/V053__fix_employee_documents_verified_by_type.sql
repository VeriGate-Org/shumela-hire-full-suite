-- Fix verified_by column type: V040 created it as BIGINT REFERENCES employees(id)
-- but the JPA entity and controller use it as VARCHAR(255) (stores username, not employee ID)
ALTER TABLE employee_documents DROP CONSTRAINT IF EXISTS employee_documents_verified_by_fkey;
ALTER TABLE employee_documents ALTER COLUMN verified_by TYPE VARCHAR(255) USING verified_by::VARCHAR;
