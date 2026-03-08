-- Module 17: Device registrations for native mobile push notifications

CREATE TABLE device_registrations (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(50) NOT NULL,
    employee_id     BIGINT NOT NULL REFERENCES employees(id),
    device_token    VARCHAR(500) NOT NULL,
    platform        VARCHAR(20) NOT NULL CHECK (platform IN ('IOS','ANDROID','WEB')),
    device_name     VARCHAR(200),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMP,
    registered_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_reg_tenant ON device_registrations(tenant_id);
CREATE INDEX idx_device_reg_employee ON device_registrations(employee_id);
CREATE INDEX idx_device_reg_token ON device_registrations(device_token);
CREATE INDEX idx_device_reg_active ON device_registrations(tenant_id, is_active);
