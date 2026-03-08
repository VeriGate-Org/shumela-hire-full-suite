CREATE TABLE document_templates (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(50) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    subject         VARCHAR(500),
    content         TEXT NOT NULL,
    placeholders    TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_doc_tpl_type CHECK (type IN (
        'OFFER_LETTER','CONTRACT','REJECTION_EMAIL',
        'WELCOME_EMAIL','NDA','PROBATION_LETTER','CONFIRMATION_LETTER'
    ))
);

CREATE INDEX idx_doc_tpl_tenant ON document_templates(tenant_id);
CREATE INDEX idx_doc_tpl_type ON document_templates(tenant_id, type);
