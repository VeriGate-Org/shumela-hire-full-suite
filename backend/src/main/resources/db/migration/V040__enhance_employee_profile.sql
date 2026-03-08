-- V040: Enhance Employee Profile

-- Add new columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_type VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS number_of_dependants INT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS union_membership VARCHAR(100);

-- Employee document type configuration
CREATE TABLE employee_document_types (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    requires_expiry BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_type_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_doc_type_code_tenant UNIQUE (tenant_id, code)
);

ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS document_type_id BIGINT REFERENCES employee_document_types(id);
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS verified_by BIGINT REFERENCES employees(id);
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

CREATE INDEX idx_emp_doc_types_tenant ON employee_document_types(tenant_id);
