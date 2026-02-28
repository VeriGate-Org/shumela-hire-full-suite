-- V006: Add multi-tenancy support across all tables (SQL Server)
-- Creates tenants table, adds tenant_id to all tables, re-scopes unique constraints
-- Note: Row Level Security handled by JPA @Filter at application layer

-- ============================================================
-- 1. TENANTS TABLE
-- ============================================================
CREATE TABLE tenants (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    subdomain       VARCHAR(63) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    plan            VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
    contact_email   VARCHAR(255) NOT NULL,
    contact_name    VARCHAR(255),
    max_users       INTEGER DEFAULT 50,
    settings        NVARCHAR(MAX) DEFAULT '{}',
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT chk_tenants_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED')),
    CONSTRAINT chk_tenants_plan CHECK (plan IN ('TRIAL', 'STARTER', 'STANDARD', 'ENTERPRISE'))
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Insert default tenant for data backfill
INSERT INTO tenants (id, name, subdomain, status, plan, contact_email, contact_name)
VALUES ('default', 'Default Organization', 'default', 'ACTIVE', 'STANDARD', 'admin@shumelahire.co.za', 'System Admin');

-- ============================================================
-- 2. ADD tenant_id TO V001 TABLES
-- ============================================================

ALTER TABLE users ADD tenant_id VARCHAR(50);
UPDATE users SET tenant_id = 'default';
ALTER TABLE users ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

ALTER TABLE applicants ADD tenant_id VARCHAR(50);
UPDATE applicants SET tenant_id = 'default';
ALTER TABLE applicants ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE applicants ADD CONSTRAINT fk_applicants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_applicants_tenant_id ON applicants(tenant_id);

ALTER TABLE job_postings ADD tenant_id VARCHAR(50);
UPDATE job_postings SET tenant_id = 'default';
ALTER TABLE job_postings ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE job_postings ADD CONSTRAINT fk_job_postings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_job_postings_tenant_id ON job_postings(tenant_id);

ALTER TABLE applications ADD tenant_id VARCHAR(50);
UPDATE applications SET tenant_id = 'default';
ALTER TABLE applications ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE applications ADD CONSTRAINT fk_applications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_applications_tenant_id ON applications(tenant_id);

ALTER TABLE documents ADD tenant_id VARCHAR(50);
UPDATE documents SET tenant_id = 'default';
ALTER TABLE documents ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);

ALTER TABLE audit_logs ADD tenant_id VARCHAR(50);
UPDATE audit_logs SET tenant_id = 'default';
ALTER TABLE audit_logs ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- ============================================================
-- 3. ADD tenant_id TO V002 TABLES
-- ============================================================

ALTER TABLE interviews ADD tenant_id VARCHAR(50);
UPDATE interviews SET tenant_id = 'default';
ALTER TABLE interviews ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE interviews ADD CONSTRAINT fk_interviews_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_interviews_tenant_id ON interviews(tenant_id);

ALTER TABLE offers ADD tenant_id VARCHAR(50);
UPDATE offers SET tenant_id = 'default';
ALTER TABLE offers ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE offers ADD CONSTRAINT fk_offers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_offers_tenant_id ON offers(tenant_id);

ALTER TABLE pipeline_transitions ADD tenant_id VARCHAR(50);
UPDATE pipeline_transitions SET tenant_id = 'default';
ALTER TABLE pipeline_transitions ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE pipeline_transitions ADD CONSTRAINT fk_pipeline_transitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_pipeline_transitions_tenant_id ON pipeline_transitions(tenant_id);

ALTER TABLE talent_pools ADD tenant_id VARCHAR(50);
UPDATE talent_pools SET tenant_id = 'default';
ALTER TABLE talent_pools ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE talent_pools ADD CONSTRAINT fk_talent_pools_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_talent_pools_tenant_id ON talent_pools(tenant_id);

ALTER TABLE talent_pool_entries ADD tenant_id VARCHAR(50);
UPDATE talent_pool_entries SET tenant_id = 'default';
ALTER TABLE talent_pool_entries ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE talent_pool_entries ADD CONSTRAINT fk_talent_pool_entries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_talent_pool_entries_tenant_id ON talent_pool_entries(tenant_id);

ALTER TABLE screening_questions ADD tenant_id VARCHAR(50);
UPDATE screening_questions SET tenant_id = 'default';
ALTER TABLE screening_questions ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE screening_questions ADD CONSTRAINT fk_screening_questions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_screening_questions_tenant_id ON screening_questions(tenant_id);

ALTER TABLE screening_answers ADD tenant_id VARCHAR(50);
UPDATE screening_answers SET tenant_id = 'default';
ALTER TABLE screening_answers ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE screening_answers ADD CONSTRAINT fk_screening_answers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_screening_answers_tenant_id ON screening_answers(tenant_id);

ALTER TABLE shortlist_scores ADD tenant_id VARCHAR(50);
UPDATE shortlist_scores SET tenant_id = 'default';
ALTER TABLE shortlist_scores ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE shortlist_scores ADD CONSTRAINT fk_shortlist_scores_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_shortlist_scores_tenant_id ON shortlist_scores(tenant_id);

ALTER TABLE messages ADD tenant_id VARCHAR(50);
UPDATE messages SET tenant_id = 'default';
ALTER TABLE messages ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE messages ADD CONSTRAINT fk_messages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);

ALTER TABLE notifications ADD tenant_id VARCHAR(50);
UPDATE notifications SET tenant_id = 'default';
ALTER TABLE notifications ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);

ALTER TABLE agency_profiles ADD tenant_id VARCHAR(50);
UPDATE agency_profiles SET tenant_id = 'default';
ALTER TABLE agency_profiles ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE agency_profiles ADD CONSTRAINT fk_agency_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_agency_profiles_tenant_id ON agency_profiles(tenant_id);

ALTER TABLE agency_submissions ADD tenant_id VARCHAR(50);
UPDATE agency_submissions SET tenant_id = 'default';
ALTER TABLE agency_submissions ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE agency_submissions ADD CONSTRAINT fk_agency_submissions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_agency_submissions_tenant_id ON agency_submissions(tenant_id);

ALTER TABLE recruitment_metrics ADD tenant_id VARCHAR(50);
UPDATE recruitment_metrics SET tenant_id = 'default';
ALTER TABLE recruitment_metrics ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE recruitment_metrics ADD CONSTRAINT fk_recruitment_metrics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_recruitment_metrics_tenant_id ON recruitment_metrics(tenant_id);

ALTER TABLE tg_salary_recommendations ADD tenant_id VARCHAR(50);
UPDATE tg_salary_recommendations SET tenant_id = 'default';
ALTER TABLE tg_salary_recommendations ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE tg_salary_recommendations ADD CONSTRAINT fk_tg_salary_recommendations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_tg_salary_recommendations_tenant_id ON tg_salary_recommendations(tenant_id);

ALTER TABLE tg_job_board_postings ADD tenant_id VARCHAR(50);
UPDATE tg_job_board_postings SET tenant_id = 'default';
ALTER TABLE tg_job_board_postings ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE tg_job_board_postings ADD CONSTRAINT fk_tg_job_board_postings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_tg_job_board_postings_tenant_id ON tg_job_board_postings(tenant_id);

-- ============================================================
-- 4. ADD tenant_id TO V003 TABLES
-- ============================================================

ALTER TABLE job_ads ADD tenant_id VARCHAR(50);
UPDATE job_ads SET tenant_id = 'default';
ALTER TABLE job_ads ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE job_ads ADD CONSTRAINT fk_job_ads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_job_ads_tenant_id ON job_ads(tenant_id);

ALTER TABLE job_ad_history ADD tenant_id VARCHAR(50);
UPDATE job_ad_history SET tenant_id = 'default';
ALTER TABLE job_ad_history ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE job_ad_history ADD CONSTRAINT fk_job_ad_history_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_job_ad_history_tenant_id ON job_ad_history(tenant_id);

-- ============================================================
-- 5. ADD tenant_id TO V004 CHILD TABLES
-- ============================================================

ALTER TABLE performance_goals ADD tenant_id VARCHAR(50);
UPDATE performance_goals SET tenant_id = 'default';
ALTER TABLE performance_goals ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE performance_goals ADD CONSTRAINT fk_performance_goals_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_performance_goals_tenant_id ON performance_goals(tenant_id);

ALTER TABLE goal_kpis ADD tenant_id VARCHAR(50);
UPDATE goal_kpis SET tenant_id = 'default';
ALTER TABLE goal_kpis ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE goal_kpis ADD CONSTRAINT fk_goal_kpis_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_goal_kpis_tenant_id ON goal_kpis(tenant_id);

ALTER TABLE review_goal_scores ADD tenant_id VARCHAR(50);
UPDATE review_goal_scores SET tenant_id = 'default';
ALTER TABLE review_goal_scores ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE review_goal_scores ADD CONSTRAINT fk_review_goal_scores_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_review_goal_scores_tenant_id ON review_goal_scores(tenant_id);

ALTER TABLE review_evidence ADD tenant_id VARCHAR(50);
UPDATE review_evidence SET tenant_id = 'default';
ALTER TABLE review_evidence ALTER COLUMN tenant_id VARCHAR(50) NOT NULL;
ALTER TABLE review_evidence ADD CONSTRAINT fk_review_evidence_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_review_evidence_tenant_id ON review_evidence(tenant_id);

-- ============================================================
-- 6. ADD FK TO V004 PARENT TABLES (already have tenant_id)
-- ============================================================

ALTER TABLE performance_templates ADD CONSTRAINT fk_performance_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE performance_cycles ADD CONSTRAINT fk_performance_cycles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE performance_contracts ADD CONSTRAINT fk_performance_contracts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE performance_reviews ADD CONSTRAINT fk_performance_reviews_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- ============================================================
-- 7. RE-SCOPE UNIQUE CONSTRAINTS TO BE TENANT-AWARE
-- ============================================================

-- users: drop global unique, add tenant-scoped
ALTER TABLE users DROP CONSTRAINT uq_users_username;
ALTER TABLE users DROP CONSTRAINT uq_users_email;
ALTER TABLE users ADD CONSTRAINT uq_users_tenant_username UNIQUE (tenant_id, username);
ALTER TABLE users ADD CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email);

-- applicants: drop global unique, add tenant-scoped
-- SQL Server: need to find and drop the unique constraint on email
DECLARE @constraint_name_applicants NVARCHAR(200);
SELECT @constraint_name_applicants = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('applicants') AND type = 'UQ'
    AND OBJECT_NAME(parent_object_id) = 'applicants';
IF @constraint_name_applicants IS NOT NULL
    EXEC('ALTER TABLE applicants DROP CONSTRAINT ' + @constraint_name_applicants);
ALTER TABLE applicants ADD CONSTRAINT uq_applicants_tenant_email UNIQUE (tenant_id, email);

-- job_postings slug
DECLARE @constraint_name_jp NVARCHAR(200);
SELECT @constraint_name_jp = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('job_postings') AND type = 'UQ';
IF @constraint_name_jp IS NOT NULL
    EXEC('ALTER TABLE job_postings DROP CONSTRAINT ' + @constraint_name_jp);
ALTER TABLE job_postings ADD CONSTRAINT uq_job_postings_tenant_slug UNIQUE (tenant_id, slug);

-- offers offer_number
DECLARE @constraint_name_offers NVARCHAR(200);
SELECT @constraint_name_offers = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('offers') AND type = 'UQ';
IF @constraint_name_offers IS NOT NULL
    EXEC('ALTER TABLE offers DROP CONSTRAINT ' + @constraint_name_offers);
ALTER TABLE offers ADD CONSTRAINT uq_offers_tenant_offer_number UNIQUE (tenant_id, offer_number);

-- talent_pools pool_name
DECLARE @constraint_name_tp NVARCHAR(200);
SELECT @constraint_name_tp = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('talent_pools') AND type = 'UQ';
IF @constraint_name_tp IS NOT NULL
    EXEC('ALTER TABLE talent_pools DROP CONSTRAINT ' + @constraint_name_tp);
ALTER TABLE talent_pools ADD CONSTRAINT uq_talent_pools_tenant_pool_name UNIQUE (tenant_id, pool_name);

-- talent_pool_entries
ALTER TABLE talent_pool_entries DROP CONSTRAINT uq_talent_pool_entries;
ALTER TABLE talent_pool_entries ADD CONSTRAINT uq_talent_pool_entries_tenant UNIQUE (tenant_id, talent_pool_id, applicant_id);

-- agency_profiles
DECLARE @constraint_name_ap1 NVARCHAR(200), @constraint_name_ap2 NVARCHAR(200), @constraint_name_ap3 NVARCHAR(200);
SELECT TOP 1 @constraint_name_ap1 = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('agency_profiles') AND type = 'UQ';
-- Drop all unique constraints and re-add as tenant-scoped
IF @constraint_name_ap1 IS NOT NULL
    EXEC('ALTER TABLE agency_profiles DROP CONSTRAINT ' + @constraint_name_ap1);
SELECT TOP 1 @constraint_name_ap2 = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('agency_profiles') AND type = 'UQ';
IF @constraint_name_ap2 IS NOT NULL
    EXEC('ALTER TABLE agency_profiles DROP CONSTRAINT ' + @constraint_name_ap2);
SELECT TOP 1 @constraint_name_ap3 = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('agency_profiles') AND type = 'UQ';
IF @constraint_name_ap3 IS NOT NULL
    EXEC('ALTER TABLE agency_profiles DROP CONSTRAINT ' + @constraint_name_ap3);
ALTER TABLE agency_profiles ADD CONSTRAINT uq_agency_profiles_tenant_name UNIQUE (tenant_id, agency_name);
ALTER TABLE agency_profiles ADD CONSTRAINT uq_agency_profiles_tenant_reg_number UNIQUE (tenant_id, registration_number);
ALTER TABLE agency_profiles ADD CONSTRAINT uq_agency_profiles_tenant_email UNIQUE (tenant_id, contact_email);

-- tg_salary_recommendations
DECLARE @constraint_name_sr NVARCHAR(200);
SELECT @constraint_name_sr = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('tg_salary_recommendations') AND type = 'UQ';
IF @constraint_name_sr IS NOT NULL
    EXEC('ALTER TABLE tg_salary_recommendations DROP CONSTRAINT ' + @constraint_name_sr);
ALTER TABLE tg_salary_recommendations ADD CONSTRAINT uq_tg_salary_recommendations_tenant_number UNIQUE (tenant_id, recommendation_number);

-- job_ads slug
DECLARE @constraint_name_ja NVARCHAR(200);
SELECT @constraint_name_ja = name FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('job_ads') AND type = 'UQ';
IF @constraint_name_ja IS NOT NULL
    EXEC('ALTER TABLE job_ads DROP CONSTRAINT ' + @constraint_name_ja);
ALTER TABLE job_ads ADD CONSTRAINT uq_job_ads_tenant_slug UNIQUE (tenant_id, slug);
