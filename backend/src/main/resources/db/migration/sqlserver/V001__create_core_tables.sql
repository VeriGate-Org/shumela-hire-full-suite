-- V001: Core tables for ShumelaHire (SQL Server)
-- Tables: users, applicants, job_postings, applications, documents, audit_logs

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'APPLICANT',
    is_enabled BIT NOT NULL DEFAULT 1,
    account_non_expired BIT NOT NULL DEFAULT 1,
    account_non_locked BIT NOT NULL DEFAULT 1,
    credentials_non_expired BIT NOT NULL DEFAULT 1,
    email_verified BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    last_login DATETIME2,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME2,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME2,
    email_verification_token VARCHAR(255),
    two_factor_enabled BIT NOT NULL DEFAULT 0,
    two_factor_secret VARCHAR(255),
    sso_provider VARCHAR(255),
    sso_user_id VARCHAR(255),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN (
        'ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'HIRING_MANAGER',
        'RECRUITER', 'INTERVIEWER', 'EMPLOYEE', 'APPLICANT'
    ))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_sso_provider ON users(sso_provider);
CREATE INDEX idx_users_sso_user_id ON users(sso_user_id);

-- ============================================================
-- APPLICANTS
-- ============================================================
CREATE TABLE applicants (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    id_passport_number VARCHAR(50),
    address NVARCHAR(MAX),
    location VARCHAR(255),
    education NVARCHAR(MAX),
    experience NVARCHAR(MAX),
    skills NVARCHAR(MAX),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    resume_url VARCHAR(255),
    cover_letter NVARCHAR(MAX),
    source VARCHAR(255),
    gender VARCHAR(255),
    race VARCHAR(255),
    disability_status VARCHAR(255),
    citizenship_status VARCHAR(255),
    demographics_consent BIT,
    demographics_consent_date DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_name_surname ON applicants(name, surname);
CREATE INDEX idx_applicants_source ON applicants(source);
CREATE INDEX idx_applicants_created_at ON applicants(created_at);

-- ============================================================
-- JOB POSTINGS
-- ============================================================
CREATE TABLE job_postings (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    experience_level VARCHAR(50) NOT NULL DEFAULT 'MID_LEVEL',
    description NVARCHAR(MAX) NOT NULL,
    requirements NVARCHAR(MAX),
    responsibilities NVARCHAR(MAX),
    qualifications NVARCHAR(MAX),
    benefits NVARCHAR(MAX),
    salary_min NUMERIC(10,2),
    salary_max NUMERIC(10,2),
    salary_currency VARCHAR(3) DEFAULT 'ZAR',
    remote_work_allowed BIT DEFAULT 0,
    travel_required BIT DEFAULT 0,
    application_deadline DATETIME2,
    positions_available INTEGER DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL,
    approved_by BIGINT,
    published_by BIGINT,
    approval_notes NVARCHAR(MAX),
    rejection_reason NVARCHAR(MAX),
    internal_notes NVARCHAR(MAX),
    external_job_boards VARCHAR(255),
    seo_title VARCHAR(60),
    seo_description VARCHAR(160),
    seo_keywords VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    featured BIT DEFAULT 0,
    urgent BIT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    applications_count BIGINT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    submitted_for_approval_at DATETIME2,
    approved_at DATETIME2,
    published_at DATETIME2,
    unpublished_at DATETIME2,
    closed_at DATETIME2,

    CONSTRAINT chk_job_postings_status CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED',
        'UNPUBLISHED', 'REJECTED', 'CLOSED', 'CANCELLED'
    )),
    CONSTRAINT chk_job_postings_employment_type CHECK (employment_type IN (
        'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE'
    )),
    CONSTRAINT chk_job_postings_experience_level CHECK (experience_level IN (
        'ENTRY_LEVEL', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE'
    )),
    CONSTRAINT chk_job_postings_positions CHECK (positions_available >= 1),
    CONSTRAINT chk_job_postings_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_department ON job_postings(department);
CREATE INDEX idx_job_postings_created_by ON job_postings(created_by);
CREATE INDEX idx_job_postings_slug ON job_postings(slug);
CREATE INDEX idx_job_postings_published_at ON job_postings(published_at);
CREATE INDEX idx_job_postings_application_deadline ON job_postings(application_deadline);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    applicant_id BIGINT NOT NULL,
    job_posting_id BIGINT,
    job_title VARCHAR(255),
    job_id VARCHAR(255),
    department VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'APPLICATION_RECEIVED',
    pipeline_stage_entered_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    cover_letter NVARCHAR(MAX),
    application_source VARCHAR(255),
    submitted_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    withdrawn_at DATETIME2,
    withdrawal_reason NVARCHAR(MAX),
    screening_notes NVARCHAR(MAX),
    interview_feedback NVARCHAR(MAX),
    rating INTEGER,
    rejection_reason NVARCHAR(MAX),
    offer_details NVARCHAR(MAX),
    start_date DATETIME2,
    salary_expectation FLOAT,
    availability_date DATETIME2,
    interviewed_at DATETIME2,
    offer_extended_at DATETIME2,
    response_deadline DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,

    CONSTRAINT fk_applications_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_job_posting FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
    CONSTRAINT chk_applications_status CHECK (status IN (
        'SUBMITTED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED',
        'REFERENCE_CHECK', 'OFFER_PENDING', 'OFFERED', 'OFFER_ACCEPTED',
        'OFFER_DECLINED', 'REJECTED', 'WITHDRAWN', 'HIRED'
    )),
    CONSTRAINT chk_applications_pipeline_stage CHECK (pipeline_stage IN (
        'APPLICATION_RECEIVED', 'INITIAL_SCREENING', 'PHONE_SCREENING',
        'FIRST_INTERVIEW', 'TECHNICAL_ASSESSMENT', 'SECOND_INTERVIEW',
        'PANEL_INTERVIEW', 'MANAGER_INTERVIEW', 'FINAL_INTERVIEW',
        'REFERENCE_CHECK', 'BACKGROUND_CHECK', 'OFFER_PREPARATION',
        'OFFER_EXTENDED', 'OFFER_NEGOTIATION', 'OFFER_ACCEPTED', 'HIRED',
        'WITHDRAWN', 'REJECTED', 'OFFER_DECLINED', 'NO_SHOW', 'DUPLICATE'
    )),
    CONSTRAINT chk_applications_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_job_posting_id ON applications(job_posting_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_pipeline_stage ON applications(pipeline_stage);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX idx_applications_department ON applications(department);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    applicant_id BIGINT NOT NULL,
    application_id BIGINT,
    type VARCHAR(20) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    uploaded_at DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_documents_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT chk_documents_type CHECK (type IN ('CV', 'SUPPORT'))
);

CREATE INDEX idx_documents_applicant_id ON documents(applicant_id);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_type ON documents(type);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255),
    details NVARCHAR(MAX)
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
