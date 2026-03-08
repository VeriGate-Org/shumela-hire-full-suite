-- =====================================================
-- V045: Labour Relations Tables
-- =====================================================

CREATE TABLE disciplinary_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dc_tenant (tenant_id),
    INDEX idx_dc_employee (employee_id),
    INDEX idx_dc_status (tenant_id, status),
    CONSTRAINT fk_dc_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE grievances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gr_tenant (tenant_id),
    INDEX idx_gr_employee (employee_id),
    INDEX idx_gr_status (tenant_id, status),
    CONSTRAINT fk_gr_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_gr_assigned FOREIGN KEY (assigned_to) REFERENCES employees(id)
);
