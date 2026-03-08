-- V038: Create Shift Scheduling module tables

CREATE TABLE shifts (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    color_code VARCHAR(7) DEFAULT '#6366F1',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shift_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_shift_code_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX idx_shifts_tenant ON shifts(tenant_id);

CREATE TABLE shift_schedules (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    shift_id BIGINT NOT NULL,
    schedule_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_schedule_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_schedule_shift FOREIGN KEY (shift_id) REFERENCES shifts(id),
    CONSTRAINT chk_schedule_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'SWAPPED', 'CANCELLED')),
    CONSTRAINT uk_schedule_unique UNIQUE (tenant_id, employee_id, schedule_date)
);

CREATE INDEX idx_schedules_tenant ON shift_schedules(tenant_id);
CREATE INDEX idx_schedules_employee ON shift_schedules(employee_id);
CREATE INDEX idx_schedules_date ON shift_schedules(schedule_date);
