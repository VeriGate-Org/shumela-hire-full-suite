-- Add columns that exist in JPA entities but are missing from the database schema

-- leave_types: encashment fields
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS allow_encashment BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS encashment_rate NUMERIC(10,2);

-- leave_balances: encashed_days
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS encashed_days NUMERIC(5,2) NOT NULL DEFAULT 0;

-- training_courses: linked_competency_ids
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS linked_competency_ids TEXT;
