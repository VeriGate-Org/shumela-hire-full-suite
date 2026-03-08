-- =====================================================
-- V044: POPIA Compliance Tables
-- =====================================================

CREATE TABLE consent_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    purpose TEXT,
    is_granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consent_tenant (tenant_id),
    INDEX idx_consent_employee (employee_id),
    INDEX idx_consent_type (tenant_id, consent_type),
    CONSTRAINT fk_consent_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE data_subject_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    requester_name VARCHAR(200) NOT NULL,
    requester_email VARCHAR(200) NOT NULL,
    request_type VARCHAR(30) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    response TEXT,
    due_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dsr_tenant (tenant_id),
    INDEX idx_dsr_status (tenant_id, status),
    INDEX idx_dsr_email (requester_email)
);
