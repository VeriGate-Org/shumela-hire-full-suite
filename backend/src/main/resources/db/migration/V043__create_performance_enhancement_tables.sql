-- =====================================================
-- V043: Performance Enhancement Tables
-- =====================================================

CREATE TABLE feedback_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    feedback_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fr_tenant (tenant_id),
    INDEX idx_fr_employee (employee_id),
    INDEX idx_fr_requester (requester_id),
    CONSTRAINT fk_fr_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_fr_requester FOREIGN KEY (requester_id) REFERENCES employees(id)
);

CREATE TABLE feedback_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    request_id BIGINT NOT NULL,
    respondent_id BIGINT NOT NULL,
    ratings TEXT,
    comments TEXT,
    strengths TEXT,
    improvements TEXT,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fres_request (request_id),
    CONSTRAINT fk_fres_request FOREIGN KEY (request_id) REFERENCES feedback_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_fres_respondent FOREIGN KEY (respondent_id) REFERENCES employees(id)
);

CREATE TABLE performance_improvement_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    reason TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    outcome TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pip_tenant (tenant_id),
    INDEX idx_pip_employee (employee_id),
    INDEX idx_pip_status (tenant_id, status),
    CONSTRAINT fk_pip_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_pip_manager FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE pip_milestones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    pip_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    evidence TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pm_pip (pip_id),
    CONSTRAINT fk_pm_pip FOREIGN KEY (pip_id) REFERENCES performance_improvement_plans(id) ON DELETE CASCADE
);

CREATE TABLE competency_frameworks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cf_tenant (tenant_id),
    INDEX idx_cf_active (tenant_id, is_active)
);

CREATE TABLE competencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    framework_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    proficiency_levels TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comp_framework (framework_id),
    CONSTRAINT fk_comp_framework FOREIGN KEY (framework_id) REFERENCES competency_frameworks(id) ON DELETE CASCADE
);

CREATE TABLE employee_competencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL,
    competency_id BIGINT NOT NULL,
    current_level INT NOT NULL DEFAULT 0,
    target_level INT NOT NULL DEFAULT 0,
    assessed_at TIMESTAMP,
    assessor_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ec_employee (employee_id),
    INDEX idx_ec_competency (competency_id),
    CONSTRAINT fk_ec_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_ec_competency FOREIGN KEY (competency_id) REFERENCES competencies(id),
    CONSTRAINT fk_ec_assessor FOREIGN KEY (assessor_id) REFERENCES employees(id)
);
