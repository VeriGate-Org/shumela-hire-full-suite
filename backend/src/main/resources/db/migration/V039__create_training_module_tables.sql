-- V039: Training & Development Module

CREATE TABLE training_courses (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    delivery_method VARCHAR(30) NOT NULL DEFAULT 'CLASSROOM',
    category VARCHAR(100),
    provider VARCHAR(200),
    duration_hours NUMERIC(6,2),
    max_participants INT,
    cost NUMERIC(12,2),
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_course_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_training_course_code_tenant UNIQUE (tenant_id, code)
);

CREATE TABLE training_sessions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    course_id BIGINT NOT NULL,
    trainer_name VARCHAR(200),
    location VARCHAR(300),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    available_seats INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_session_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_training_session_course FOREIGN KEY (course_id) REFERENCES training_courses(id)
);

CREATE TABLE training_enrollments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    session_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    score NUMERIC(5,2),
    certificate_url VARCHAR(500),
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_enrollment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_training_enrollment_session FOREIGN KEY (session_id) REFERENCES training_sessions(id),
    CONSTRAINT fk_training_enrollment_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT uk_training_enrollment UNIQUE (session_id, employee_id)
);

CREATE TABLE certifications (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    name VARCHAR(300) NOT NULL,
    issuing_body VARCHAR(200),
    certification_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    document_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certification_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_certification_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX idx_training_courses_tenant ON training_courses(tenant_id);
CREATE INDEX idx_training_sessions_tenant ON training_sessions(tenant_id);
CREATE INDEX idx_training_sessions_course ON training_sessions(course_id);
CREATE INDEX idx_training_enrollments_tenant ON training_enrollments(tenant_id);
CREATE INDEX idx_training_enrollments_session ON training_enrollments(session_id);
CREATE INDEX idx_training_enrollments_employee ON training_enrollments(employee_id);
CREATE INDEX idx_certifications_tenant ON certifications(tenant_id);
CREATE INDEX idx_certifications_employee ON certifications(employee_id);
CREATE INDEX idx_certifications_expiry ON certifications(expiry_date);
