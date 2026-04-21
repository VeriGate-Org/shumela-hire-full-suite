-- V025: Individual Development Plans and Certification Renewal fields
ALTER TABLE certifications ADD renewal_date DATE NULL;
ALTER TABLE certifications ADD renewal_status NVARCHAR(50) NULL;
ALTER TABLE certifications ADD renewal_notification_sent BIT DEFAULT 0;

CREATE TABLE individual_development_plans (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    employee_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(2000),
    start_date DATE,
    target_date DATE,
    status NVARCHAR(50) DEFAULT 'DRAFT',
    manager_id BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE idp_goals (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000),
    target_date DATE,
    status NVARCHAR(50) DEFAULT 'NOT_STARTED',
    linked_course_id BIGINT,
    linked_certification_id BIGINT,
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_idp_goal_plan FOREIGN KEY (plan_id) REFERENCES individual_development_plans(id)
);

CREATE INDEX idx_idp_employee ON individual_development_plans(employee_id);
CREATE INDEX idx_idp_goals_plan ON idp_goals(plan_id);
