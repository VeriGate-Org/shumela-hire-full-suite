-- Add job_posting_id foreign key and metadata fields to job_ads
-- This links JobAd records to their source JobPosting for automatic sync

ALTER TABLE job_ads ADD COLUMN job_posting_id BIGINT;
ALTER TABLE job_ads ADD COLUMN department VARCHAR(100);
ALTER TABLE job_ads ADD COLUMN location VARCHAR(100);
ALTER TABLE job_ads ADD COLUMN employment_type VARCHAR(50);
ALTER TABLE job_ads ADD COLUMN salary_range_min DECIMAL(12, 2);
ALTER TABLE job_ads ADD COLUMN salary_range_max DECIMAL(12, 2);
ALTER TABLE job_ads ADD COLUMN salary_currency VARCHAR(3) DEFAULT 'ZAR';

-- Foreign key to job_postings (nullable — standalone ads are still allowed)
ALTER TABLE job_ads ADD CONSTRAINT fk_job_ads_job_posting
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE SET NULL;

CREATE INDEX idx_job_ads_job_posting_id ON job_ads(job_posting_id);
CREATE INDEX idx_job_ads_department ON job_ads(department);
CREATE INDEX idx_job_ads_location ON job_ads(location);

COMMENT ON COLUMN job_ads.job_posting_id IS 'Source job posting that this ad was auto-created from';
COMMENT ON COLUMN job_ads.department IS 'Department copied from job posting for display and filtering';
COMMENT ON COLUMN job_ads.employment_type IS 'Employment type copied from job posting for display';
