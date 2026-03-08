-- ============================================================================
-- V033: Seed HRMS Module Features for Multi-Tenant Feature Gating
-- ============================================================================
-- Registers all HR modules identified in the GAP analysis against
-- RFP HR2026-BID-007 (uThukela Water HRMS requirements).
--
-- Plan tiers:
--   TRIAL      - Basic features, limited functionality
--   STARTER    - Core HR for small teams
--   STANDARD   - Full HR suite for mid-size organisations
--   ENTERPRISE - All features including advanced analytics, AI, integrations
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. HR Core Modules
-- ---------------------------------------------------------------------------

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('LEAVE_MANAGEMENT', 'Leave Administration',
        'Online leave requests, real-time balance tracking, automated approval workflows, configurable leave policies, leave encashment and carry-forward, and leave analytics.',
        'hr_core', 'STARTER,STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('TIME_ATTENDANCE', 'Time & Attendance',
        'Clock-in/clock-out via web and mobile, overtime management, integration with payroll for accurate time tracking.',
        'hr_core', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('GEOFENCING', 'GPS Geofencing Attendance',
        'GPS-based attendance verification with configurable geofence zones around work sites. Ensures employees clock in from authorised locations.',
        'hr_core', 'ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('SHIFT_SCHEDULING', 'Shift Scheduling',
        'Shift pattern management, roster creation, shift swaps, and schedule conflict detection for multi-site operations.',
        'hr_core', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('EMPLOYEE_SELF_SERVICE', 'Employee Self-Service Portal',
        'Employee-facing portal for updating personal information, uploading documents, viewing payslips, and managing leave balances.',
        'hr_core', 'STARTER,STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('EMPLOYEE_DOCUMENTS', 'Employee Document Management',
        'Structured document storage for IDs, certifications, and contracts with expiry tracking and automated renewal reminders.',
        'hr_core', 'STARTER,STANDARD,ENTERPRISE', true);

-- ---------------------------------------------------------------------------
-- 2. Talent Development & Performance Modules
-- ---------------------------------------------------------------------------

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('TRAINING_MANAGEMENT', 'Training & Development',
        'Track certifications, courses, and development plans. Training attendance tracking, feedback collection, and training effectiveness reporting.',
        'talent_development', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('LMS_INTEGRATION', 'LMS Integration',
        'Integration with external Learning Management Systems for online training delivery, progress tracking, and completion certificates.',
        'talent_development', 'ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('SKILL_GAP_ANALYSIS', 'Skill Gap Analysis',
        'Automated analysis of employee skills against role requirements and organisational competency frameworks. Generates personalised training recommendations.',
        'talent_development', 'ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('PERFORMANCE_360_FEEDBACK', '360-Degree Feedback',
        'Multi-source performance feedback from peers, subordinates, and managers. Anonymous feedback collection with aggregated reporting.',
        'talent_development', 'ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('PERFORMANCE_PIP', 'Performance Improvement Plans',
        'Structured PIP workflows with goal-setting, milestone tracking, review schedules, and outcome recording for underperforming employees.',
        'talent_development', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('COMPETENCY_MAPPING', 'Competency Framework Mapping',
        'Define organisational competency frameworks and map employees against required competencies. Links to training recommendations and career pathing.',
        'talent_development', 'ENTERPRISE', true);

-- ---------------------------------------------------------------------------
-- 3. Employee Engagement Modules
-- ---------------------------------------------------------------------------

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('EMPLOYEE_ENGAGEMENT', 'Employee Engagement',
        'Core engagement module enabling pulse surveys, recognition, and wellness program management.',
        'engagement', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('PULSE_SURVEYS', 'Pulse Surveys & Feedback',
        'Create and distribute pulse surveys with anonymous response collection. Real-time sentiment analysis and trend reporting.',
        'engagement', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('RECOGNITION_REWARDS', 'Recognition & Rewards',
        'Peer-to-peer and manager recognition system with configurable reward categories, points, and achievement badges.',
        'engagement', 'ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('WELLNESS_PROGRAMS', 'Wellness Programs',
        'Employee wellness program management including health tracking, wellness challenges, and EAP (Employee Assistance Programme) referrals.',
        'engagement', 'ENTERPRISE', true);

-- ---------------------------------------------------------------------------
-- 4. Compliance Modules
-- ---------------------------------------------------------------------------

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('POPIA_COMPLIANCE', 'POPIA Compliance Management',
        'Consent management, Data Subject Access Request (DSAR) workflows, data retention policies, and privacy impact assessments compliant with POPIA.',
        'compliance', 'STARTER,STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('LABOUR_RELATIONS', 'Labour Relations Management',
        'Disciplinary process management, grievance handling, union interaction tracking, and CCMA case management aligned with the Labour Relations Act.',
        'compliance', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('COMPLIANCE_REMINDERS', 'Automated Compliance Reminders',
        'Automated notifications for certification renewals, licence expirations, mandatory training deadlines, and regulatory compliance due dates.',
        'compliance', 'STANDARD,ENTERPRISE', true);

-- ---------------------------------------------------------------------------
-- 5. Integration Modules
-- ---------------------------------------------------------------------------

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('SAGE_300_PEOPLE', 'Sage 300 People Integration',
        'Bi-directional real-time sync with Sage 300 People for employee master data, leave balances, and HR transactions.',
        'integrations', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('SAGE_EVOLUTION', 'Sage Evolution ERP Integration',
        'Bi-directional real-time sync with Sage Evolution ERP for payroll processing, financial data exchange, and statutory reporting.',
        'integrations', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('AD_SSO', 'Active Directory SSO',
        'Full Active Directory integration for single sign-on, group-based role mapping, and centralised user lifecycle management.',
        'integrations', 'STANDARD,ENTERPRISE', true);

-- Seed missing features that are already referenced in controller annotations
INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('WORKFLOW_MANAGEMENT', 'Workflow Management',
        'Visual workflow builder for approval chains, automated task routing, and configurable business process automation.',
        'automation', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('SAP_PAYROLL', 'SAP Payroll Integration',
        'Integration with SAP SuccessFactors for payroll data transmission, salary processing, and statutory deduction management.',
        'integrations', 'ENTERPRISE', true);

-- ---------------------------------------------------------------------------
-- 6. Analytics & Reporting Modules
-- ---------------------------------------------------------------------------

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('ADVANCED_ANALYTICS', 'Advanced HR Analytics',
        'Comprehensive dashboards for leave trends, turnover rates, absenteeism patterns, training effectiveness, and workforce composition across all HR modules.',
        'analytics', 'STANDARD,ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('PREDICTIVE_ANALYTICS', 'Predictive Workforce Analytics',
        'AI-powered predictive models for workforce planning, attrition risk scoring, succession planning, and talent demand forecasting.',
        'analytics', 'ENTERPRISE', true);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('REPORT_EXPORT', 'Report Export (PDF/Excel)',
        'Export any report or dashboard to PDF, Excel, or CSV formats. Supports scheduled automated report generation and email distribution.',
        'analytics', 'STARTER,STANDARD,ENTERPRISE', true);
