-- =====================================================
-- V044: POPIA Compliance Tables
-- =====================================================

CREATE TABLE consent_records (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    purpose TEXT,
    is_granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consent_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE data_subject_requests (
    id BIGSERIAL PRIMARY KEY,
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_tenant ON consent_records(tenant_id);
CREATE INDEX idx_consent_employee ON consent_records(employee_id);
CREATE INDEX idx_consent_type ON consent_records(tenant_id, consent_type);
CREATE INDEX idx_dsr_tenant ON data_subject_requests(tenant_id);
CREATE INDEX idx_dsr_status ON data_subject_requests(tenant_id, status);
CREATE INDEX idx_dsr_email ON data_subject_requests(requester_email);
