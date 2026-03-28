-- =====================================================
-- V045: Labour Relations Tables
-- =====================================================

CREATE TABLE disciplinary_cases (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    offence_category VARCHAR(20) NOT NULL,
    offence_description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    hearing_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    outcome VARCHAR(30),
    outcome_date DATE,
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dc_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE grievances (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    grievance_type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'FILED',
    resolution TEXT,
    filed_date DATE NOT NULL,
    resolved_date DATE,
    assigned_to BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gr_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_gr_assigned FOREIGN KEY (assigned_to) REFERENCES employees(id)
);

CREATE INDEX idx_dc_tenant ON disciplinary_cases(tenant_id);
CREATE INDEX idx_dc_employee ON disciplinary_cases(employee_id);
CREATE INDEX idx_dc_status ON disciplinary_cases(tenant_id, status);
CREATE INDEX idx_gr_tenant ON grievances(tenant_id);
CREATE INDEX idx_gr_employee ON grievances(employee_id);
CREATE INDEX idx_gr_status ON grievances(tenant_id, status);
