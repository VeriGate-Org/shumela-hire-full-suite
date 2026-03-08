-- V034: Create Leave Management module tables
-- Supports: leave types, policies, balances, requests, public holidays

-- Leave types (Annual, Sick, Family Responsibility, etc.)
CREATE TABLE leave_types (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    description TEXT,
    default_days_per_year NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_carry_forward_days NUMERIC(5,2) DEFAULT 0,
    requires_medical_certificate BOOLEAN NOT NULL DEFAULT FALSE,
    medical_cert_threshold_days INT DEFAULT 2,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_type_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_leave_type_code_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX idx_leave_types_tenant ON leave_types(tenant_id);

-- Leave policies (link type to employment criteria)
CREATE TABLE leave_policies (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    leave_type_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    accrual_method VARCHAR(30) NOT NULL DEFAULT 'ANNUAL',
    days_per_cycle NUMERIC(5,2) NOT NULL,
    cycle_start_month INT NOT NULL DEFAULT 1,
    min_service_months INT DEFAULT 0,
    applicable_employment_types TEXT,
    applicable_departments TEXT,
    allow_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,
    max_consecutive_days INT,
    min_notice_days INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_policy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_leave_policy_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    CONSTRAINT chk_accrual_method CHECK (accrual_method IN ('ANNUAL', 'MONTHLY', 'BIWEEKLY', 'ON_HIRE_DATE'))
);

CREATE INDEX idx_leave_policies_tenant ON leave_policies(tenant_id);
CREATE INDEX idx_leave_policies_type ON leave_policies(leave_type_id);

-- Leave balances (per employee per leave type per cycle year)
CREATE TABLE leave_balances (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    cycle_year INT NOT NULL,
    entitled_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    taken_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    pending_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    carried_forward_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    adjustment_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_balance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_leave_balance_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_leave_balance_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    CONSTRAINT uk_leave_balance_unique UNIQUE (tenant_id, employee_id, leave_type_id, cycle_year)
);

CREATE INDEX idx_leave_balances_tenant ON leave_balances(tenant_id);
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);

-- Leave requests
CREATE TABLE leave_requests (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(5,2) NOT NULL,
    is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
    half_day_period VARCHAR(10),
    reason TEXT,
    medical_certificate_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approver_id BIGINT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_request_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_leave_request_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_leave_request_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    CONSTRAINT fk_leave_request_approver FOREIGN KEY (approver_id) REFERENCES employees(id),
    CONSTRAINT chk_leave_request_status CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECALLED')),
    CONSTRAINT chk_half_day_period CHECK (half_day_period IS NULL OR half_day_period IN ('MORNING', 'AFTERNOON'))
);

CREATE INDEX idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_approver ON leave_requests(approver_id);

-- Public holidays
CREATE TABLE public_holidays (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    holiday_date DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    country VARCHAR(10) DEFAULT 'ZA',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_public_holiday_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_public_holiday_date_tenant UNIQUE (tenant_id, holiday_date, name)
);

CREATE INDEX idx_public_holidays_tenant ON public_holidays(tenant_id);
CREATE INDEX idx_public_holidays_date ON public_holidays(holiday_date);
