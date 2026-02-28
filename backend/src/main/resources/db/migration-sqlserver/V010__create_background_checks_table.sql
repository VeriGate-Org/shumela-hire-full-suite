-- V010: Background checks table for verification provider integration (SQL Server)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'background_checks')
CREATE TABLE background_checks (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id               VARCHAR(50) NOT NULL,
    application_id          BIGINT NOT NULL,
    reference_id            VARCHAR(100) UNIQUE,
    candidate_id_number     VARCHAR(20) NOT NULL,
    candidate_name          VARCHAR(200),
    candidate_email         VARCHAR(200),
    check_types             NVARCHAR(MAX),
    status                  VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    overall_result          VARCHAR(30),
    results_json            NVARCHAR(MAX),
    consent_obtained        BIT NOT NULL DEFAULT 0,
    consent_obtained_at     DATETIME2,
    initiated_by            BIGINT NOT NULL,
    provider                VARCHAR(50),
    external_screening_id   VARCHAR(200),
    report_url              VARCHAR(500),
    error_message           NVARCHAR(MAX),
    notes                   NVARCHAR(MAX),
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at              DATETIME2,
    submitted_at            DATETIME2,
    completed_at            DATETIME2,
    cancelled_at            DATETIME2,

    CONSTRAINT fk_bgcheck_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT chk_bgcheck_status CHECK (status IN ('INITIATED','PENDING_CONSENT','IN_PROGRESS',
                                                     'PARTIAL_RESULTS','COMPLETED','FAILED','CANCELLED')),
    CONSTRAINT chk_bgcheck_result CHECK (overall_result IS NULL OR overall_result IN ('CLEAR','ADVERSE','PENDING_REVIEW','INCONCLUSIVE'))
);

CREATE INDEX idx_bgcheck_tenant ON background_checks(tenant_id);
CREATE INDEX idx_bgcheck_application ON background_checks(application_id);
CREATE INDEX idx_bgcheck_reference ON background_checks(reference_id);
CREATE INDEX idx_bgcheck_status ON background_checks(status);
CREATE INDEX idx_bgcheck_initiated_by ON background_checks(initiated_by);
CREATE INDEX idx_bgcheck_external_id ON background_checks(external_screening_id);
