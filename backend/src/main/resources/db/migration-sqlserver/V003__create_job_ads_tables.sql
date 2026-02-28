-- V003: Job advertisements tables (SQL Server)

CREATE TABLE job_ads (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    requisition_id BIGINT,
    title VARCHAR(500) NOT NULL,
    html_body NVARCHAR(MAX) NOT NULL,
    channel_internal BIT NOT NULL DEFAULT 0,
    channel_external BIT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    closing_date DATE,
    slug VARCHAR(200) UNIQUE,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT chk_job_ads_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'EXPIRED')),
    CONSTRAINT chk_job_ads_channels CHECK (channel_internal = 1 OR channel_external = 1)
);

CREATE TABLE job_ad_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    job_ad_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_user_id VARCHAR(100) NOT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    details NVARCHAR(MAX),

    CONSTRAINT fk_job_ad_history_job_ad FOREIGN KEY (job_ad_id) REFERENCES job_ads(id) ON DELETE CASCADE
);

CREATE INDEX idx_job_ads_status ON job_ads(status);
CREATE INDEX idx_job_ads_channel_internal ON job_ads(channel_internal);
CREATE INDEX idx_job_ads_channel_external ON job_ads(channel_external);
CREATE INDEX idx_job_ads_closing_date ON job_ads(closing_date);
CREATE INDEX idx_job_ads_created_by ON job_ads(created_by);
CREATE INDEX idx_job_ads_created_at ON job_ads(created_at);
CREATE INDEX idx_job_ads_requisition_id ON job_ads(requisition_id);

CREATE INDEX idx_job_ad_history_job_ad_id ON job_ad_history(job_ad_id);
CREATE INDEX idx_job_ad_history_action ON job_ad_history(action);
CREATE INDEX idx_job_ad_history_actor_user_id ON job_ad_history(actor_user_id);
CREATE INDEX idx_job_ad_history_timestamp ON job_ad_history(timestamp);
