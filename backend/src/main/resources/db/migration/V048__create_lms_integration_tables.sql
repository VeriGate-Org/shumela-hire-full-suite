-- Module 16: LMS Integration tables

CREATE TABLE lms_connector_configs (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    provider_type   VARCHAR(30) NOT NULL CHECK (provider_type IN ('MOODLE','CANVAS','BLACKBOARD','CUSTOM')),
    base_url        VARCHAR(500),
    api_key         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at  TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lms_connector_tenant ON lms_connector_configs(tenant_id);
CREATE INDEX idx_lms_connector_active ON lms_connector_configs(tenant_id, is_active);

CREATE TABLE lms_sync_logs (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(50) NOT NULL,
    connector_id    BIGINT NOT NULL REFERENCES lms_connector_configs(id),
    sync_type       VARCHAR(30) NOT NULL CHECK (sync_type IN ('COURSES','ENROLLMENTS','COMPLETIONS')),
    status          VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING','COMPLETED','FAILED')),
    records_synced  INT DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP
);

CREATE INDEX idx_lms_sync_tenant ON lms_sync_logs(tenant_id);
CREATE INDEX idx_lms_sync_connector ON lms_sync_logs(connector_id);
CREATE INDEX idx_lms_sync_status ON lms_sync_logs(tenant_id, status);
