CREATE TABLE tenant_feature_entitlements (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(50) NOT NULL,
    feature_id BIGINT NOT NULL,
    is_enabled BIT NOT NULL,
    reason NVARCHAR(500),
    granted_by NVARCHAR(100),
    expires_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uq_tenant_feature UNIQUE (tenant_id, feature_id)
);
