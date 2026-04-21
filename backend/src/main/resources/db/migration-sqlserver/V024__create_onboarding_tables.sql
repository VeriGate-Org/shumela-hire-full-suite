-- V024: Onboarding checklist tables
CREATE TABLE onboarding_templates (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000),
    department NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE onboarding_template_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    template_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000),
    category NVARCHAR(50) NOT NULL,
    due_offset_days INT DEFAULT 0,
    is_required BIT DEFAULT 1,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_template_item_template FOREIGN KEY (template_id) REFERENCES onboarding_templates(id)
);

CREATE TABLE onboarding_checklists (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    employee_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE,
    status NVARCHAR(50) DEFAULT 'IN_PROGRESS',
    assigned_hr_id BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_checklist_template FOREIGN KEY (template_id) REFERENCES onboarding_templates(id)
);

CREATE TABLE onboarding_checklist_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    checklist_id BIGINT NOT NULL,
    template_item_id BIGINT,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000),
    category NVARCHAR(50) NOT NULL,
    due_date DATE,
    is_required BIT DEFAULT 1,
    status NVARCHAR(50) DEFAULT 'PENDING',
    completed_at DATETIME2,
    completed_by NVARCHAR(255),
    notes NVARCHAR(1000),
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_checklist_item_checklist FOREIGN KEY (checklist_id) REFERENCES onboarding_checklists(id)
);

CREATE INDEX idx_onboarding_checklists_employee ON onboarding_checklists(employee_id);
CREATE INDEX idx_onboarding_checklist_items_checklist ON onboarding_checklist_items(checklist_id);
