-- V009: User preferences table (SQL Server)

CREATE TABLE user_preferences (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    preferences NVARCHAR(MAX) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_user_preferences_user UNIQUE (user_id)
);
