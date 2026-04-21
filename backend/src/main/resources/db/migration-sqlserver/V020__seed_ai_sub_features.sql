-- ============================================================================
-- V020: Seed AI Sub-Feature Flags (SQL Server)
-- ============================================================================
-- Adds the individual AI tool feature codes referenced by the frontend
-- AiAssistPanel component. Without these rows the FeatureGate hides all
-- AI tool panels even when the parent AI_ENABLED feature is active.
-- ============================================================================

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('AI_ENABLED', 'AI Tools',
        'AI-powered recruitment tools and features including smart search, email drafting, job description writing, and salary benchmarking.',
        'ai', 'STANDARD,ENTERPRISE', 1);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('AI_SEARCH', 'AI Smart Search',
        'Search candidates using natural language queries instead of manual filters.',
        'ai', 'STANDARD,ENTERPRISE', 1);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('AI_EMAIL_DRAFTER', 'AI Email Drafter',
        'AI-assisted email composition for interview invitations, rejections, offers, and follow-ups.',
        'ai', 'STANDARD,ENTERPRISE', 1);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('AI_JOB_DESCRIPTION', 'AI Job Description Writer',
        'Generate complete job descriptions with built-in bias checking.',
        'ai', 'STANDARD,ENTERPRISE', 1);

INSERT INTO platform_features (code, name, description, category, included_plans, is_active)
VALUES ('AI_SALARY_BENCHMARK', 'AI Salary Benchmark',
        'AI-powered market salary analysis and recommendations for any position.',
        'ai', 'STANDARD,ENTERPRISE', 1);
