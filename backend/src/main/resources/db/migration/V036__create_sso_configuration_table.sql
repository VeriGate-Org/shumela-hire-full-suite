-- V036: Create SSO Configuration table

CREATE TABLE sso_configurations (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    client_id VARCHAR(500),
    client_secret TEXT,
    tenant_identifier VARCHAR(500),
    discovery_url VARCHAR(500),
    metadata_xml TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_provision_users BOOLEAN NOT NULL DEFAULT FALSE,
    default_role VARCHAR(50) DEFAULT 'EMPLOYEE',
    group_mappings TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sso_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_sso_config_tenant UNIQUE (tenant_id),
    CONSTRAINT chk_sso_provider CHECK (provider IN ('AZURE_AD', 'ON_PREM_AD', 'OKTA', 'CUSTOM_SAML'))
);

CREATE INDEX idx_sso_configs_tenant ON sso_configurations(tenant_id);
