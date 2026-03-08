-- V041: Report Export Module

CREATE TABLE report_export_jobs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'PDF',
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    file_url VARCHAR(500),
    file_size BIGINT,
    parameters TEXT,
    requested_by BIGINT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_report_export_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_report_export_requested_by FOREIGN KEY (requested_by) REFERENCES employees(id)
);

CREATE INDEX idx_report_export_tenant ON report_export_jobs(tenant_id);
CREATE INDEX idx_report_export_status ON report_export_jobs(status);
CREATE INDEX idx_report_export_requested_by ON report_export_jobs(requested_by);
