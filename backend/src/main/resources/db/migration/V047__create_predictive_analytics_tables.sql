-- Module 15: Predictive Analytics tables

CREATE TABLE attrition_risk_scores (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   VARCHAR(50) NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    risk_score  NUMERIC(3,2) NOT NULL,
    risk_level  VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    factors     TEXT,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attrition_risk_tenant ON attrition_risk_scores(tenant_id);
CREATE INDEX idx_attrition_risk_employee ON attrition_risk_scores(employee_id);
CREATE INDEX idx_attrition_risk_level ON attrition_risk_scores(tenant_id, risk_level);

CREATE TABLE succession_plans (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           VARCHAR(50) NOT NULL,
    position_title      VARCHAR(200) NOT NULL,
    department          VARCHAR(200),
    current_holder_id   BIGINT REFERENCES employees(id),
    successor_id        BIGINT REFERENCES employees(id),
    readiness_level     VARCHAR(30) NOT NULL CHECK (readiness_level IN ('READY_NOW','READY_1_YEAR','READY_2_YEARS','DEVELOPMENT_NEEDED')),
    development_actions TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','COMPLETED')),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_succession_plans_tenant ON succession_plans(tenant_id);
CREATE INDEX idx_succession_plans_status ON succession_plans(tenant_id, status);
CREATE INDEX idx_succession_plans_dept ON succession_plans(tenant_id, department);
