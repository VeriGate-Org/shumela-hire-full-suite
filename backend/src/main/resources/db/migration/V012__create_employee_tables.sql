-- V012: Core HR Employee Module Tables
-- Creates employees, employee_documents, employment_events, custom_fields, custom_field_values

-- Employee status enum type
CREATE TYPE employee_status AS ENUM (
    'ACTIVE', 'PROBATION', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'RETIRED'
);

-- Employment event type enum
CREATE TYPE employment_event_type AS ENUM (
    'HIRE', 'PROMOTION', 'TRANSFER', 'DEMOTION', 'SUSPENSION',
    'REINSTATEMENT', 'RESIGNATION', 'DISMISSAL', 'RETIREMENT', 'CONTRACT_END'
);

-- Employee document type enum
CREATE TYPE employee_document_type AS ENUM (
    'ID_DOCUMENT', 'PASSPORT', 'WORK_PERMIT', 'TAX_CERTIFICATE', 'QUALIFICATION',
    'CONTRACT', 'OFFER_LETTER', 'DISCIPLINARY', 'MEDICAL', 'TRAINING_CERTIFICATE',
    'PERFORMANCE_REVIEW', 'OTHER'
);

-- Custom field entity type enum
CREATE TYPE custom_field_entity_type AS ENUM (
    'EMPLOYEE', 'EMPLOYEE_DOCUMENT', 'EMPLOYMENT_EVENT'
);

-- Custom field data type enum
CREATE TYPE custom_field_data_type AS ENUM (
    'TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT'
);

-- =====================================================
-- Employees table
-- =====================================================
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    employee_number VARCHAR(50) NOT NULL,
    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    personal_email VARCHAR(255),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    race VARCHAR(50),
    disability_status VARCHAR(50),
    citizenship_status VARCHAR(50),
    nationality VARCHAR(100),
    marital_status VARCHAR(30),

    -- Encrypted PII fields (AES-256-GCM via @Convert)
    id_number TEXT,
    tax_number TEXT,
    bank_account_number TEXT,
    bank_name VARCHAR(100),
    bank_branch_code VARCHAR(20),

    -- Address
    physical_address TEXT,
    postal_address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',

    -- Employment details
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    department VARCHAR(200),
    division VARCHAR(200),
    job_title VARCHAR(200),
    job_grade VARCHAR(50),
    employment_type VARCHAR(50),
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    contract_end_date DATE,

    -- Org structure
    reporting_manager_id BIGINT,
    cost_centre VARCHAR(100),
    location VARCHAR(200),
    site VARCHAR(200),

    -- Source tracking
    applicant_id BIGINT,

    -- Photo
    profile_photo_url VARCHAR(500),

    -- Emergency contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),

    -- POPIA consent
    demographics_consent BOOLEAN DEFAULT FALSE,
    demographics_consent_date TIMESTAMP,

    -- Multi-tenancy
    tenant_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_employee_reporting_manager FOREIGN KEY (reporting_manager_id) REFERENCES employees(id),
    CONSTRAINT fk_employee_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id),
    CONSTRAINT fk_employee_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_employee_number_tenant UNIQUE (employee_number, tenant_id),
    CONSTRAINT uk_employee_email_tenant UNIQUE (email, tenant_id)
);

-- Indexes for employees
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_job_title ON employees(job_title);
CREATE INDEX idx_employees_reporting_manager ON employees(reporting_manager_id);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_name ON employees(first_name, last_name);
CREATE INDEX idx_employees_applicant ON employees(applicant_id);

-- =====================================================
-- Employee documents table
-- =====================================================
CREATE TABLE employee_documents (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by VARCHAR(255),

    -- Multi-tenancy
    tenant_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_employee_doc_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_doc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes for employee_documents
CREATE INDEX idx_employee_docs_tenant_id ON employee_documents(tenant_id);
CREATE INDEX idx_employee_docs_employee ON employee_documents(employee_id);
CREATE INDEX idx_employee_docs_type ON employee_documents(document_type);
CREATE INDEX idx_employee_docs_expiry ON employee_documents(expiry_date);
CREATE INDEX idx_employee_docs_active ON employee_documents(is_active);

-- =====================================================
-- Employment events table (immutable lifecycle log)
-- =====================================================
CREATE TABLE employment_events (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    description TEXT,
    notes TEXT,

    -- Before/after snapshots for change tracking
    previous_department VARCHAR(200),
    new_department VARCHAR(200),
    previous_job_title VARCHAR(200),
    new_job_title VARCHAR(200),
    previous_job_grade VARCHAR(50),
    new_job_grade VARCHAR(50),
    previous_reporting_manager_id BIGINT,
    new_reporting_manager_id BIGINT,
    previous_location VARCHAR(200),
    new_location VARCHAR(200),

    -- Who recorded this event
    recorded_by VARCHAR(255),

    -- Multi-tenancy
    tenant_id VARCHAR(50) NOT NULL,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_event_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes for employment_events
CREATE INDEX idx_employment_events_tenant_id ON employment_events(tenant_id);
CREATE INDEX idx_employment_events_employee ON employment_events(employee_id);
CREATE INDEX idx_employment_events_type ON employment_events(event_type);
CREATE INDEX idx_employment_events_date ON employment_events(event_date);

-- =====================================================
-- Custom fields table (configurable field definitions)
-- =====================================================
CREATE TABLE custom_fields (
    id BIGSERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    data_type VARCHAR(30) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    options TEXT, -- JSON array for SELECT/MULTI_SELECT types
    default_value VARCHAR(500),
    validation_regex VARCHAR(500),
    help_text TEXT,

    -- Multi-tenancy
    tenant_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_custom_field_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_custom_field_name_entity_tenant UNIQUE (field_name, entity_type, tenant_id)
);

-- Indexes for custom_fields
CREATE INDEX idx_custom_fields_tenant_id ON custom_fields(tenant_id);
CREATE INDEX idx_custom_fields_entity_type ON custom_fields(entity_type);
CREATE INDEX idx_custom_fields_active ON custom_fields(is_active);

-- =====================================================
-- Custom field values table
-- =====================================================
CREATE TABLE custom_field_values (
    id BIGSERIAL PRIMARY KEY,
    custom_field_id BIGINT NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    field_value TEXT,

    -- Multi-tenancy
    tenant_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_field_value_field FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
    CONSTRAINT fk_field_value_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_field_value_entity UNIQUE (custom_field_id, entity_id, entity_type, tenant_id)
);

-- Indexes for custom_field_values
CREATE INDEX idx_custom_field_values_tenant_id ON custom_field_values(tenant_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(custom_field_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_id, entity_type);
