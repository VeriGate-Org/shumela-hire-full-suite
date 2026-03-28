-- Fix verified_by column type: V040 created it as BIGINT but the JPA entity expects VARCHAR(255)
ALTER TABLE employee_documents ALTER COLUMN verified_by TYPE VARCHAR(255) USING verified_by::VARCHAR;
