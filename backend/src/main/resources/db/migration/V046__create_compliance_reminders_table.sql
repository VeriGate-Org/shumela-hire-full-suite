-- =====================================================
-- V046: Compliance Reminders Table
-- =====================================================

CREATE TABLE compliance_reminders (
    id BIGSERIAL PRIMARY KEY,
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX idx_cr_tenant ON compliance_reminders(tenant_id);
CREATE INDEX idx_cr_employee ON compliance_reminders(employee_id);
CREATE INDEX idx_cr_status ON compliance_reminders(tenant_id, status);
CREATE INDEX idx_cr_due_date ON compliance_reminders(tenant_id, due_date);
CREATE INDEX idx_cr_type ON compliance_reminders(tenant_id, reminder_type);
