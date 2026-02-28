-- V2: LinkedIn org connections (SQL Server)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'linkedin_org_connections')
CREATE TABLE linkedin_org_connections (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id            VARCHAR(50) NOT NULL,
    access_token         NVARCHAR(MAX) NOT NULL,
    refresh_token        NVARCHAR(MAX),
    token_expires_at     DATETIME2 NOT NULL,
    organization_id      VARCHAR(50) NOT NULL,
    organization_name    VARCHAR(255),
    connected_by_user_id VARCHAR(255) NOT NULL,
    connected_at         DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_at           DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at           DATETIME2
);

CREATE UNIQUE INDEX idx_linkedin_org_conn_tenant ON linkedin_org_connections(tenant_id);
