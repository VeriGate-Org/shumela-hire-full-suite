-- =====================================================
-- V042: Employee Engagement Module Tables
-- =====================================================

CREATE TABLE surveys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_surveys_tenant (tenant_id),
    INDEX idx_surveys_status (tenant_id, status)
);

CREATE TABLE survey_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    survey_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    options TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_survey_questions_survey (survey_id),
    CONSTRAINT fk_sq_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE TABLE survey_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    survey_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    rating INT,
    text_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sr_survey (survey_id),
    INDEX idx_sr_employee (employee_id),
    CONSTRAINT fk_sr_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_question FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE recognitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    from_employee_id BIGINT NOT NULL,
    to_employee_id BIGINT NOT NULL,
    category VARCHAR(30) NOT NULL,
    message TEXT,
    points INT NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recognitions_tenant (tenant_id),
    INDEX idx_recognitions_to (to_employee_id),
    INDEX idx_recognitions_from (from_employee_id),
    CONSTRAINT fk_rec_from FOREIGN KEY (from_employee_id) REFERENCES employees(id),
    CONSTRAINT fk_rec_to FOREIGN KEY (to_employee_id) REFERENCES employees(id)
);

CREATE TABLE wellness_programs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    program_type VARCHAR(30) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_participants INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wellness_tenant (tenant_id),
    INDEX idx_wellness_active (tenant_id, is_active)
);

CREATE TABLE wellness_program_participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    program_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_wp_participant (program_id, employee_id),
    CONSTRAINT fk_wpp_program FOREIGN KEY (program_id) REFERENCES wellness_programs(id) ON DELETE CASCADE,
    CONSTRAINT fk_wpp_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);
