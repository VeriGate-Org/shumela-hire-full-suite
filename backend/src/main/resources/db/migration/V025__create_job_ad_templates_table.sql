-- Job Ad Templates table
CREATE TABLE job_ad_templates (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     VARCHAR(500),
    title           VARCHAR(500) NOT NULL,
    intro           TEXT,
    responsibilities TEXT,
    requirements    TEXT,
    benefits        TEXT,
    location        VARCHAR(200),
    employment_type VARCHAR(30),
    salary_range_min NUMERIC(12, 2),
    salary_range_max NUMERIC(12, 2),
    closing_date    DATE,
    contact_email   VARCHAR(200) NOT NULL,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    usage_count     INTEGER NOT NULL DEFAULT 0,
    created_by      VARCHAR(100) NOT NULL,
    tenant_id       VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_job_ad_templates_tenant_id ON job_ad_templates(tenant_id);
CREATE INDEX idx_job_ad_templates_is_archived ON job_ad_templates(is_archived);
CREATE INDEX idx_job_ad_templates_employment_type ON job_ad_templates(employment_type);
CREATE INDEX idx_job_ad_templates_created_by ON job_ad_templates(created_by);
CREATE INDEX idx_job_ad_templates_created_at ON job_ad_templates(created_at);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_job_ad_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_job_ad_templates_updated_at
    BEFORE UPDATE ON job_ad_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_job_ad_templates_updated_at();
