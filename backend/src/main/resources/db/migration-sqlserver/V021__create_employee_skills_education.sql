-- V021: Employee Skills & Education tables
CREATE TABLE employee_skills (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    employee_id BIGINT NOT NULL,
    skill_name NVARCHAR(255) NOT NULL,
    proficiency_level NVARCHAR(50) DEFAULT 'INTERMEDIATE',
    years_experience INT,
    certified BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE employee_education (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tenant_id NVARCHAR(100) NOT NULL,
    employee_id BIGINT NOT NULL,
    institution NVARCHAR(255) NOT NULL,
    qualification NVARCHAR(255) NOT NULL,
    field_of_study NVARCHAR(255),
    start_date DATE,
    end_date DATE,
    grade NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_education_employee ON employee_education(employee_id);
