-- V011: SAP Payroll Transmissions (SQL Server)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sap_payroll_transmissions')
CREATE TABLE sap_payroll_transmissions (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id           VARCHAR(50)  NOT NULL,
    offer_id            BIGINT       NOT NULL,
    transmission_id     VARCHAR(50)  NOT NULL UNIQUE,
    sap_employee_number VARCHAR(20),
    status              VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    payload_json        NVARCHAR(MAX),
    response_json       NVARCHAR(MAX),
    error_message       NVARCHAR(MAX),
    retry_count         INTEGER      NOT NULL DEFAULT 0,
    max_retries         INTEGER      NOT NULL DEFAULT 3,
    next_retry_at       DATETIME2,
    initiated_by        BIGINT,
    sap_company_code    VARCHAR(10),
    sap_payroll_area    VARCHAR(10),
    validation_errors   NVARCHAR(MAX),
    created_at          DATETIME2    NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2,
    transmitted_at      DATETIME2,
    confirmed_at        DATETIME2,
    cancelled_at        DATETIME2,
    cancelled_by        BIGINT,
    cancellation_reason NVARCHAR(MAX),

    CONSTRAINT fk_sap_transmissions_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT chk_sap_transmission_status CHECK (status IN ('PENDING', 'VALIDATING', 'TRANSMITTED', 'CONFIRMED', 'FAILED', 'RETRY_PENDING', 'CANCELLED'))
);

CREATE INDEX idx_sap_transmissions_tenant ON sap_payroll_transmissions(tenant_id);
CREATE INDEX idx_sap_transmissions_offer ON sap_payroll_transmissions(offer_id);
CREATE INDEX idx_sap_transmissions_status ON sap_payroll_transmissions(status);
CREATE INDEX idx_sap_transmissions_transmission_id ON sap_payroll_transmissions(transmission_id);
