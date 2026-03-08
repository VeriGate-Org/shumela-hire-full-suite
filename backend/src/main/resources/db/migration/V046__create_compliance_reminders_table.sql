-- =====================================================
-- V046: Compliance Reminders Table
-- =====================================================

CREATE TABLE compliance_reminders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    reminder_type VARCHAR(30) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    employee_id BIGINT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cr_tenant (tenant_id),
    INDEX idx_cr_employee (employee_id),
    INDEX idx_cr_status (tenant_id, status),
    INDEX idx_cr_due_date (tenant_id, due_date),
    INDEX idx_cr_type (tenant_id, reminder_type),
    CONSTRAINT fk_cr_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);
