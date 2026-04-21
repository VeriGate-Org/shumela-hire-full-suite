-- V026: Training attendance and evaluations
CREATE TABLE training_attendance (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    session_id BIGINT NOT NULL,
    enrollment_id BIGINT,
    employee_id BIGINT NOT NULL,
    attended BIT DEFAULT 0,
    check_in_time DATETIME2,
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE training_evaluations (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    session_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    overall_rating INT NOT NULL,
    content_rating INT,
    instructor_rating INT,
    relevance_rating INT,
    comments NVARCHAR(2000),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_training_attendance_session ON training_attendance(session_id);
CREATE INDEX idx_training_evaluations_session ON training_evaluations(session_id);
CREATE UNIQUE INDEX idx_training_evaluations_unique ON training_evaluations(session_id, employee_id);
