CREATE TABLE leave_encashment_requests (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    days NUMERIC(5,2) NOT NULL,
    rate_per_day NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hr_approved_by BIGINT,
    hr_approved_at TIMESTAMP,
    finance_approved_by BIGINT,
    finance_approved_at TIMESTAMP,
    decision_comment TEXT,
    cycle_year INTEGER NOT NULL,

    CONSTRAINT fk_leave_encashment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_leave_encashment_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_leave_encashment_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    CONSTRAINT fk_leave_encashment_hr_approved FOREIGN KEY (hr_approved_by) REFERENCES employees(id),
    CONSTRAINT fk_leave_encashment_finance_approved FOREIGN KEY (finance_approved_by) REFERENCES employees(id)
);

CREATE INDEX idx_leave_encashment_tenant ON leave_encashment_requests(tenant_id);
CREATE INDEX idx_leave_encashment_employee ON leave_encashment_requests(employee_id);
CREATE INDEX idx_leave_encashment_status ON leave_encashment_requests(status);
