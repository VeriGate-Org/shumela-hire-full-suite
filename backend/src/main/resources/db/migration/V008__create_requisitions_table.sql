CREATE TABLE requisitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    employment_type VARCHAR(30),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    description TEXT,
    justification TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT,
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_requisition_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_tenant ON requisitions(tenant_id);
