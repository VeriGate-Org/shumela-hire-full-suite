CREATE TABLE workflow_definitions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    is_active BIT NOT NULL DEFAULT 0,
    trigger_type NVARCHAR(50),
    trigger_config NVARCHAR(MAX),
    steps_json NVARCHAR(MAX),
    created_by NVARCHAR(255),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE workflow_executions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(50) NOT NULL,
    workflow_definition_id BIGINT REFERENCES workflow_definitions(id),
    status NVARCHAR(20) NOT NULL DEFAULT 'running',
    started_at DATETIME2 NOT NULL,
    completed_at DATETIME2,
    triggered_by NVARCHAR(255),
    current_step INT DEFAULT 0,
    total_steps INT DEFAULT 0,
    execution_log_json NVARCHAR(MAX),
    context_json NVARCHAR(MAX)
);

CREATE INDEX idx_workflow_definitions_tenant ON workflow_definitions(tenant_id);
CREATE INDEX idx_workflow_definitions_active ON workflow_definitions(is_active);
CREATE INDEX idx_workflow_definitions_category ON workflow_definitions(category);
CREATE INDEX idx_workflow_executions_tenant ON workflow_executions(tenant_id);
CREATE INDEX idx_workflow_executions_definition ON workflow_executions(workflow_definition_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
