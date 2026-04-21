-- V023: Leave auto-escalation fields
ALTER TABLE leave_policies ADD escalation_days INT NULL;
ALTER TABLE leave_policies ADD escalate_to_role NVARCHAR(100) NULL;
