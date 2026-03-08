-- V035: Create Sage Integration module tables

CREATE TABLE sage_connector_configs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    connector_type VARCHAR(30) NOT NULL,
    auth_method VARCHAR(30) NOT NULL DEFAULT 'API_KEY',
    base_url VARCHAR(500),
    credentials TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    last_tested_at TIMESTAMP,
    last_test_success BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sage_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT chk_connector_type CHECK (connector_type IN ('SAGE_300_PEOPLE', 'SAGE_EVOLUTION', 'SAGE_BUSINESS_CLOUD')),
    CONSTRAINT chk_auth_method CHECK (auth_method IN ('API_KEY', 'OAUTH2', 'BASIC_AUTH', 'CERTIFICATE'))
);

CREATE INDEX idx_sage_configs_tenant ON sage_connector_configs(tenant_id);

CREATE TABLE sage_sync_schedules (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    connector_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL DEFAULT 'IMPORT',
    frequency VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    cron_expression VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sync_schedule_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_sync_schedule_connector FOREIGN KEY (connector_id) REFERENCES sage_connector_configs(id),
    CONSTRAINT chk_entity_type CHECK (entity_type IN ('EMPLOYEE', 'DEPARTMENT', 'LEAVE', 'PAYROLL', 'ATTENDANCE')),
    CONSTRAINT chk_direction CHECK (direction IN ('IMPORT', 'EXPORT', 'BIDIRECTIONAL')),
    CONSTRAINT chk_frequency CHECK (frequency IN ('REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL'))
);

CREATE INDEX idx_sage_schedules_tenant ON sage_sync_schedules(tenant_id);
CREATE INDEX idx_sage_schedules_connector ON sage_sync_schedules(connector_id);

CREATE TABLE sage_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    schedule_id BIGINT,
    connector_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    records_processed INT DEFAULT 0,
    records_succeeded INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_sync_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_sync_log_connector FOREIGN KEY (connector_id) REFERENCES sage_connector_configs(id),
    CONSTRAINT fk_sync_log_schedule FOREIGN KEY (schedule_id) REFERENCES sage_sync_schedules(id),
    CONSTRAINT chk_sync_status CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

CREATE INDEX idx_sage_logs_tenant ON sage_sync_logs(tenant_id);
CREATE INDEX idx_sage_logs_connector ON sage_sync_logs(connector_id);
CREATE INDEX idx_sage_logs_started ON sage_sync_logs(started_at);
