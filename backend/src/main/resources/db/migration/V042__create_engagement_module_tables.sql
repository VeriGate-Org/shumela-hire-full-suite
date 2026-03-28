-- =====================================================
-- V042: Employee Engagement Module Tables
-- =====================================================

CREATE TABLE surveys (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_surveys_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE survey_questions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    survey_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    options TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sq_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE TABLE survey_responses (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    survey_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    rating INT,
    text_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_question FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE recognitions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    from_employee_id BIGINT NOT NULL,
    to_employee_id BIGINT NOT NULL,
    category VARCHAR(30) NOT NULL,
    message TEXT,
    points INT NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_from FOREIGN KEY (from_employee_id) REFERENCES employees(id),
    CONSTRAINT fk_rec_to FOREIGN KEY (to_employee_id) REFERENCES employees(id)
);

CREATE TABLE wellness_programs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    program_type VARCHAR(30) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_participants INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wellness_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE wellness_program_participants (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    program_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wp_participant UNIQUE (program_id, employee_id),
    CONSTRAINT fk_wpp_program FOREIGN KEY (program_id) REFERENCES wellness_programs(id) ON DELETE CASCADE,
    CONSTRAINT fk_wpp_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX idx_surveys_tenant ON surveys(tenant_id);
CREATE INDEX idx_surveys_status ON surveys(tenant_id, status);
CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_sr_survey ON survey_responses(survey_id);
CREATE INDEX idx_sr_employee ON survey_responses(employee_id);
CREATE INDEX idx_recognitions_tenant ON recognitions(tenant_id);
CREATE INDEX idx_recognitions_to ON recognitions(to_employee_id);
CREATE INDEX idx_recognitions_from ON recognitions(from_employee_id);
CREATE INDEX idx_wellness_tenant ON wellness_programs(tenant_id);
CREATE INDEX idx_wellness_active ON wellness_programs(tenant_id, is_active);
