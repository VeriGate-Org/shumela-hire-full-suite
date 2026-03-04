-- V021: Seed IDC demo tenant with realistic recruitment data
-- Industrial Development Corporation (IDC) of South Africa
-- Idempotent: skips if applicants already exist for idc-demo

DO $$
DECLARE
    v_tenant_id     VARCHAR(50);
    v_existing      INTEGER;

    -- department IDs
    v_dept_agro     BIGINT;
    v_dept_auto     BIGINT;
    v_dept_chem     BIGINT;
    v_dept_infra    BIGINT;
    v_dept_mach     BIGINT;
    v_dept_media    BIGINT;
    v_dept_mining   BIGINT;
    v_dept_text     BIGINT;
    v_dept_tourism  BIGINT;
    v_dept_sbf      BIGINT;
    v_dept_partner  BIGINT;
    v_dept_hc       BIGINT;

    -- requisition IDs
    v_req_analyst   BIGINT;
    v_req_advisor   BIGINT;
    v_req_fund_mgr  BIGINT;
    v_req_agro_spec BIGINT;

    -- job posting IDs
    v_jp_analyst    BIGINT;
    v_jp_advisor    BIGINT;
    v_jp_fund_mgr   BIGINT;
    v_jp_agro_spec  BIGINT;

    -- applicant IDs
    v_lerato        BIGINT;
    v_pieter        BIGINT;
    v_ayanda        BIGINT;
    v_fatima        BIGINT;
    v_thabo         BIGINT;
    v_chloe         BIGINT;
    v_mandla        BIGINT;
    v_priya         BIGINT;
    v_johan         BIGINT;
    v_nomsa         BIGINT;
    v_ravi          BIGINT;
    v_amahle        BIGINT;

    -- application IDs (needed for interviews/offers)
    v_app_ayanda_advisor    BIGINT;
    v_app_fatima_advisor    BIGINT;
    v_app_thabo_analyst     BIGINT;
    v_app_lerato_analyst    BIGINT;
    v_app_pieter_analyst    BIGINT;
    v_app_priya_advisor     BIGINT;

    -- talent pool IDs
    v_pool_analysts BIGINT;
    v_pool_sbf      BIGINT;

    -- admin user for created_by FK
    v_admin_user    BIGINT;

BEGIN
    -- ============================================================
    -- RESOLVE TENANT BY SUBDOMAIN
    -- ============================================================
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'idc-demo';

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant with subdomain idc-demo not found. Skipping.';
        RETURN;
    END IF;

    RAISE NOTICE 'Resolved idc-demo tenant ID: %', v_tenant_id;

    -- ============================================================
    -- IDEMPOTENCY CHECK
    -- ============================================================
    SELECT COUNT(*) INTO v_existing
    FROM applicants
    WHERE tenant_id = v_tenant_id;

    IF v_existing > 0 THEN
        RAISE NOTICE 'IDC demo data already seeded (% applicants found). Skipping.', v_existing;
        RETURN;
    END IF;

    -- ============================================================
    -- CLEANUP: Clear talent pools and agencies for idc-demo
    -- (FK-safe order: children first)
    -- ============================================================
    DELETE FROM talent_pool_entries WHERE tenant_id = v_tenant_id;
    DELETE FROM talent_pools WHERE tenant_id = v_tenant_id;
    DELETE FROM agency_profiles WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Cleared talent_pool_entries, talent_pools, and agency_profiles for %', v_tenant_id;

    -- ============================================================
    -- RESOLVE ADMIN USER (for created_by NOT NULL columns)
    -- ============================================================
    SELECT id INTO v_admin_user FROM users WHERE tenant_id = v_tenant_id ORDER BY id LIMIT 1;
    IF v_admin_user IS NULL THEN
        RAISE NOTICE 'No users found for tenant %. Cannot seed without created_by user.', v_tenant_id;
        RETURN;
    END IF;
    RAISE NOTICE 'Using admin user ID: %', v_admin_user;

    -- ============================================================
    -- TIER 1: DEPARTMENTS (12)
    -- ============================================================
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Agro-Processing & Agriculture', 'AGRO', TRUE) RETURNING id INTO v_dept_agro;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Automotive & Transport Equipment', 'AUTO', TRUE) RETURNING id INTO v_dept_auto;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Chemicals, Medical & Industrial Mineral Products', 'CHEM', TRUE) RETURNING id INTO v_dept_chem;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Infrastructure', 'INFRA', TRUE) RETURNING id INTO v_dept_infra;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Machinery, Equipment & Electronics', 'MACH', TRUE) RETURNING id INTO v_dept_mach;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Media & Audio-Visual', 'MEDIA', TRUE) RETURNING id INTO v_dept_media;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Mining & Metals', 'MINING', TRUE) RETURNING id INTO v_dept_mining;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Textiles & Wood Products', 'TEXT', TRUE) RETURNING id INTO v_dept_text;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Tourism & Services', 'TOURISM', TRUE) RETURNING id INTO v_dept_tourism;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Small Business Finance & Regions', 'SBF', TRUE) RETURNING id INTO v_dept_sbf;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Partnership Programmes', 'PARTNER', TRUE) RETURNING id INTO v_dept_partner;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Human Capital', 'HC', TRUE) RETURNING id INTO v_dept_hc;

    -- ============================================================
    -- TIER 2: REQUISITIONS (4)
    -- ============================================================
    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Senior Investment Analyst', 'Mining & Metals', 'Johannesburg', 'FULL_TIME', 850000, 1200000,
            'Evaluate and manage mining sector investment portfolios. Conduct due diligence on project finance proposals and provide strategic recommendations to the investment committee.',
            'Replacement for departing senior analyst. Critical role for mining portfolio management.', 'APPROVED')
    RETURNING id INTO v_req_analyst;

    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Regional Business Advisor', 'Small Business Finance & Regions', 'Pretoria', 'FULL_TIME', 550000, 750000,
            'Provide advisory services to SMMEs across designated regions. Assess creditworthiness, develop business plans, and facilitate access to IDC funding instruments.',
            'New position to expand regional SMME support coverage.', 'APPROVED')
    RETURNING id INTO v_req_advisor;

    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Film & Media Fund Manager', 'Media & Audio-Visual', 'Johannesburg', 'FULL_TIME', 750000, 1000000,
            'Manage the IDC Film and Media Fund. Evaluate creative project proposals, negotiate funding terms, and monitor portfolio performance across film, television, and digital media investments.',
            'Strategic hire to strengthen media fund management capability.', 'APPROVED')
    RETURNING id INTO v_req_fund_mgr;

    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Agro-Processing Development Specialist', 'Agro-Processing & Agriculture', 'Durban', 'FULL_TIME', 600000, 850000,
            'Drive agro-processing investment opportunities in KwaZulu-Natal. Evaluate agricultural value chain projects, conduct feasibility studies, and manage stakeholder relationships with farming cooperatives.',
            'New position aligned with IDC agro-processing growth strategy.', 'APPROVED')
    RETURNING id INTO v_req_agro_spec;

    -- ============================================================
    -- TIER 3: JOB POSTINGS (4 — PUBLISHED)
    -- ============================================================
    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Senior Investment Analyst', 'Mining & Metals', 'Johannesburg', 'FULL_TIME', 'SENIOR',
            'The IDC is seeking a Senior Investment Analyst to join our Mining & Metals division. You will evaluate mining sector investment portfolios and conduct due diligence on project finance proposals.',
            'CA(SA) or CFA qualification preferred. Minimum 5 years experience in investment analysis or project finance within the mining sector. Strong financial modelling skills. Knowledge of South African mining legislation.',
            'Evaluate investment proposals and prepare appraisal reports. Conduct financial due diligence and risk assessments. Present recommendations to the investment committee. Monitor portfolio performance and covenant compliance. Engage with industry stakeholders and co-investors.',
            850000, 1200000, 'ZAR', 'PUBLISHED', 'senior-investment-analyst', 1, NOW() - INTERVAL '14 days', NOW() + INTERVAL '30 days', v_admin_user)
    RETURNING id INTO v_jp_analyst;

    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Regional Business Advisor', 'Small Business Finance & Regions', 'Pretoria', 'FULL_TIME', 'MID_LEVEL',
            'Join our Small Business Finance & Regions team to support SMME development across South Africa. You will assess business proposals, develop growth plans, and facilitate access to IDC funding.',
            'B.Com or equivalent in Finance, Economics, or Business Management. Minimum 3 years experience in SMME development or commercial lending. Understanding of SMME challenges in South Africa. Valid driver''s licence.',
            'Assess SMME funding applications and creditworthiness. Develop tailored business support plans. Facilitate access to IDC funding instruments and grants. Conduct site visits and monitor funded enterprises. Build relationships with regional economic development agencies.',
            550000, 750000, 'ZAR', 'PUBLISHED', 'regional-business-advisor', 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', v_admin_user)
    RETURNING id INTO v_jp_advisor;

    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Film & Media Fund Manager', 'Media & Audio-Visual', 'Johannesburg', 'FULL_TIME', 'SENIOR',
            'The IDC seeks a Fund Manager for its Film and Media Fund. You will evaluate creative project proposals, negotiate funding terms, and oversee a growing portfolio of film, television, and digital media investments.',
            'Degree in Film Studies, Media Management, Finance, or related field. Minimum 5 years experience in media investment, film production, or fund management. Understanding of the South African film incentive landscape. Strong negotiation and stakeholder management skills.',
            'Evaluate film and media project funding applications. Structure and negotiate investment terms and co-production agreements. Monitor funded projects through production and distribution phases. Prepare portfolio performance reports for the investment committee. Represent the IDC at industry events and film markets.',
            750000, 1000000, 'ZAR', 'PUBLISHED', 'film-media-fund-manager', 1, NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', v_admin_user)
    RETURNING id INTO v_jp_fund_mgr;

    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Agro-Processing Development Specialist', 'Agro-Processing & Agriculture', 'Durban', 'FULL_TIME', 'MID_LEVEL',
            'Drive agro-processing investment opportunities in KwaZulu-Natal. Evaluate agricultural value chain projects and manage stakeholder relationships with farming cooperatives and agribusinesses.',
            'Degree in Agricultural Economics, Agribusiness, or related field. Minimum 3 years experience in agro-processing, agricultural development, or development finance. Knowledge of South African agricultural value chains. Willingness to travel extensively within KZN.',
            'Identify and evaluate agro-processing investment opportunities. Conduct feasibility studies and financial appraisals. Manage relationships with farming cooperatives and agribusinesses. Monitor funded agro-processing projects. Contribute to the IDC agro-processing sector strategy.',
            600000, 850000, 'ZAR', 'PUBLISHED', 'agro-processing-development-specialist', 1, NOW() - INTERVAL '5 days', NOW() + INTERVAL '45 days', v_admin_user)
    RETURNING id INTO v_jp_agro_spec;

    -- ============================================================
    -- TIER 4: APPLICANTS (12)
    -- ============================================================
    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Lerato', 'Mokoena', 'lerato.mokoena@email.co.za', '+27 82 123 4567', 'Johannesburg',
            'LinkedIn', 'MCom Finance (Wits), CFA Level III', '7 years in investment analysis at Rand Merchant Bank and Old Mutual Investment Group', 'Financial modelling, Due diligence, Mining sector analysis, Project finance, Valuation', 'https://linkedin.com/in/lerato-mokoena')
    RETURNING id INTO v_lerato;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Pieter', 'van der Merwe', 'pieter.vdm@email.co.za', '+27 83 234 5678', 'Cape Town',
            'Referral', 'BCom Hons Accounting (Stellenbosch), CA(SA)', '8 years at PwC Advisory and Anglo American Corporate Finance', 'Project finance, Mining economics, Financial due diligence, IFRS reporting, Risk assessment', 'https://linkedin.com/in/pieter-vdm')
    RETURNING id INTO v_pieter;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Ayanda', 'Nkosi', 'ayanda.nkosi@email.co.za', '+27 84 345 6789', 'Durban',
            'Career Portal', 'BCom Economics (UKZN), MBA (GSB)', '4 years in SMME lending at FNB Business Banking', 'Credit analysis, Business advisory, SMME development, Financial planning, Stakeholder engagement', NULL)
    RETURNING id INTO v_ayanda;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Fatima', 'Patel', 'fatima.patel@email.co.za', '+27 85 456 7890', 'Pretoria',
            'LinkedIn', 'BCom Accounting (UP), Postgrad Diploma in Development Finance', '5 years at SEFA and National Empowerment Fund', 'SMME development, Credit analysis, Regional economics, Development finance, BEE advisory', 'https://linkedin.com/in/fatima-patel')
    RETURNING id INTO v_fatima;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Thabo', 'Sithole', 'thabo.sithole@email.co.za', '+27 86 567 8901', 'Johannesburg',
            'Agency', 'BSc Engineering (Wits), MCom Finance (UCT)', '6 years at Standard Bank CIB and Investec Mining Finance', 'Financial modelling, Mining project evaluation, Technical due diligence, Equity research, Commodity markets', 'https://linkedin.com/in/thabo-sithole')
    RETURNING id INTO v_thabo;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Chloe', 'du Plessis', 'chloe.duplessis@email.co.za', '+27 87 678 9012', 'Cape Town',
            'Career Portal', 'BA Film & Media (UCT), MBA (Henley Business School)', '5 years at the National Film and Video Foundation and MultiChoice', 'Film fund management, Media investment, Content valuation, Intellectual property, Creative industry finance', NULL)
    RETURNING id INTO v_chloe;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Mandla', 'Zulu', 'mandla.zulu@email.co.za', '+27 71 789 0123', 'Durban',
            'Referral', 'BCom Finance (UKZN), PMP Certified', '4 years in media production finance at eMedia Holdings', 'Production budgeting, Fund administration, Media sector knowledge, Stakeholder management, Project management', 'https://linkedin.com/in/mandla-zulu')
    RETURNING id INTO v_mandla;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Priya', 'Naidoo', 'priya.naidoo@email.co.za', '+27 72 890 1234', 'Pretoria',
            'LinkedIn', 'BCom Economics (UP), Postgrad in Public Management', '6 years at SEDA and the DTI', 'SMME development, Policy analysis, Regional economics, Programme management, Monitoring and evaluation', 'https://linkedin.com/in/priya-naidoo')
    RETURNING id INTO v_priya;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Johan', 'Botha', 'johan.botha@email.co.za', '+27 73 901 2345', 'Bloemfontein',
            'Career Portal', 'BSc Agriculture (UFS), MSc Agribusiness (Stellenbosch)', '4 years at Land Bank and GrainSA', 'Agro-processing, Agricultural value chains, Feasibility studies, Co-operative development, Rural finance', NULL)
    RETURNING id INTO v_johan;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Nomsa', 'Dlamini', 'nomsa.dlamini@email.co.za', '+27 74 012 3456', 'Johannesburg',
            'LinkedIn', 'BSc Food Science (Wits), MBA (GIBS)', '5 years in agribusiness consulting at Deloitte and TechnoServe', 'Agro-processing, Food safety standards, Supply chain analysis, Stakeholder engagement, Development impact assessment', 'https://linkedin.com/in/nomsa-dlamini')
    RETURNING id INTO v_nomsa;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Ravi', 'Govender', 'ravi.govender@email.co.za', '+27 75 123 4567', 'Durban',
            'Referral', 'BCom Hons Finance (UKZN), CFA Level II', '3 years at Nedbank CIB and Absa Capital', 'Financial modelling, Investment analysis, Credit risk, Mining sector knowledge, Presentation skills', 'https://linkedin.com/in/ravi-govender')
    RETURNING id INTO v_ravi;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, source, education, experience, skills, linkedin_url)
    VALUES (v_tenant_id, 'Amahle', 'Mkhize', 'amahle.mkhize@email.co.za', '+27 76 234 5678', 'Cape Town',
            'Career Portal', 'BA Drama & Film (UCT), Postgrad Diploma in Arts Management', '3 years at Wesgro Film and Media Office and the DFFE Creative Sector Fund', 'Creative industry funding, Film market knowledge, Arts administration, Budget analysis, Grant management', NULL)
    RETURNING id INTO v_amahle;

    -- ============================================================
    -- TIER 5: APPLICATIONS (15 — spread across pipeline stages)
    -- ============================================================

    -- New (APPLICATION_RECEIVED)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_johan, v_jp_agro_spec, 'Agro-Processing Development Specialist', 'Agro-Processing & Agriculture', 'SUBMITTED', 'APPLICATION_RECEIVED', 'Career Portal', NOW() - INTERVAL '3 days');

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_nomsa, v_jp_agro_spec, 'Agro-Processing Development Specialist', 'Agro-Processing & Agriculture', 'SUBMITTED', 'APPLICATION_RECEIVED', 'LinkedIn', NOW() - INTERVAL '2 days');

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_ravi, v_jp_analyst, 'Senior Investment Analyst', 'Mining & Metals', 'SUBMITTED', 'APPLICATION_RECEIVED', 'Referral', NOW() - INTERVAL '4 days');

    -- Screening (INITIAL_SCREENING)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_chloe, v_jp_fund_mgr, 'Film & Media Fund Manager', 'Media & Audio-Visual', 'SCREENING', 'INITIAL_SCREENING', 'Career Portal', NOW() - INTERVAL '8 days');

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_mandla, v_jp_fund_mgr, 'Film & Media Fund Manager', 'Media & Audio-Visual', 'SCREENING', 'INITIAL_SCREENING', 'Referral', NOW() - INTERVAL '7 days');

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_amahle, v_jp_fund_mgr, 'Film & Media Fund Manager', 'Media & Audio-Visual', 'SCREENING', 'INITIAL_SCREENING', 'Career Portal', NOW() - INTERVAL '6 days');

    -- Interview (FIRST_INTERVIEW)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_ayanda, v_jp_advisor, 'Regional Business Advisor', 'Small Business Finance & Regions', 'INTERVIEW_SCHEDULED', 'FIRST_INTERVIEW', 'Career Portal', NOW() - INTERVAL '12 days')
    RETURNING id INTO v_app_ayanda_advisor;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_fatima, v_jp_advisor, 'Regional Business Advisor', 'Small Business Finance & Regions', 'INTERVIEW_SCHEDULED', 'FIRST_INTERVIEW', 'LinkedIn', NOW() - INTERVAL '11 days')
    RETURNING id INTO v_app_fatima_advisor;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_thabo, v_jp_analyst, 'Senior Investment Analyst', 'Mining & Metals', 'INTERVIEW_SCHEDULED', 'FIRST_INTERVIEW', 'Agency', NOW() - INTERVAL '13 days')
    RETURNING id INTO v_app_thabo_analyst;

    -- Post-interview (SECOND_INTERVIEW)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_lerato, v_jp_analyst, 'Senior Investment Analyst', 'Mining & Metals', 'INTERVIEW_COMPLETED', 'SECOND_INTERVIEW', 'LinkedIn', NOW() - INTERVAL '18 days')
    RETURNING id INTO v_app_lerato_analyst;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_pieter, v_jp_analyst, 'Senior Investment Analyst', 'Mining & Metals', 'INTERVIEW_COMPLETED', 'SECOND_INTERVIEW', 'Referral', NOW() - INTERVAL '20 days')
    RETURNING id INTO v_app_pieter_analyst;

    -- Offer stage (OFFER_PREPARATION)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at)
    VALUES (v_tenant_id, v_priya, v_jp_advisor, 'Regional Business Advisor', 'Small Business Finance & Regions', 'OFFER_PENDING', 'OFFER_PREPARATION', 'LinkedIn', NOW() - INTERVAL '21 days')
    RETURNING id INTO v_app_priya_advisor;

    -- Accepted (HIRED)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at, offer_extended_at)
    VALUES (v_tenant_id, v_pieter, v_jp_analyst, 'Senior Investment Analyst', 'Mining & Metals', 'OFFER_ACCEPTED', 'HIRED', 'Referral', NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days');

    -- Rejected (Johan's 2nd application — to Investment Analyst)
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, application_source, submitted_at, rejection_reason)
    VALUES (v_tenant_id, v_johan, v_jp_analyst, 'Senior Investment Analyst', 'Mining & Metals', 'REJECTED', 'REJECTED', 'Career Portal', NOW() - INTERVAL '22 days',
            'Insufficient experience in investment analysis and mining sector finance. Encouraged to reapply for agro-processing roles.');

    -- ============================================================
    -- TIER 6: INTERVIEWS (5)
    -- ============================================================
    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, meeting_link, interviewer_name, interviewer_email)
    VALUES (v_tenant_id, v_app_ayanda_advisor, 'First Interview - Ayanda Nkosi', 'VIDEO', 'FIRST', 'SCHEDULED',
            NOW() + INTERVAL '3 days', 60, 'https://teams.microsoft.com/meet/idc-interview-001',
            'Sipho Mabaso', 'sipho.mabaso@idc.co.za');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, phone_number, interviewer_name, interviewer_email)
    VALUES (v_tenant_id, v_app_fatima_advisor, 'Phone Screen - Fatima Patel', 'PHONE', 'FIRST', 'SCHEDULED',
            NOW() + INTERVAL '2 days', 45, '+27 12 313 3911',
            'Sipho Mabaso', 'sipho.mabaso@idc.co.za');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, meeting_link, interviewer_name, interviewer_email)
    VALUES (v_tenant_id, v_app_thabo_analyst, 'Technical Assessment - Thabo Sithole', 'TECHNICAL', 'FIRST', 'SCHEDULED',
            NOW() + INTERVAL '4 days', 90, 'https://teams.microsoft.com/meet/idc-interview-003',
            'Dr. Nthato Moagi', 'nthato.moagi@idc.co.za');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, meeting_link, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_lerato_analyst, 'Video Interview - Lerato Mokoena', 'VIDEO', 'SECOND', 'COMPLETED',
            NOW() - INTERVAL '5 days', 60, 'https://teams.microsoft.com/meet/idc-interview-004',
            'Dr. Nthato Moagi', 'nthato.moagi@idc.co.za',
            'Strong candidate with excellent financial modelling skills. Demonstrated deep knowledge of mining sector dynamics. Communication was clear and confident. Recommended for final round.',
            4, 'HIRE', NOW() - INTERVAL '5 days');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_pieter_analyst, 'In-Person Panel Interview - Pieter van der Merwe', 'IN_PERSON', 'SECOND', 'COMPLETED',
            NOW() - INTERVAL '8 days', 90, 'IDC Head Office, 19 Fredman Drive, Sandton',
            'Dr. Nthato Moagi', 'nthato.moagi@idc.co.za',
            'Exceptional candidate. CA(SA) with robust mining finance background from Anglo American. Impressed the panel with technical depth and strategic thinking. Unanimous recommendation to extend offer.',
            5, 'STRONG_HIRE', NOW() - INTERVAL '8 days');

    -- ============================================================
    -- TIER 7: OFFERS (2)
    -- ============================================================
    INSERT INTO offers (tenant_id, application_id, offer_number, status, offer_type, job_title, department, base_salary, currency, salary_frequency, start_date, offer_expiry_date, work_location, probationary_period_days, notice_period_days, vacation_days_annual, health_insurance, retirement_plan, retirement_contribution_percentage, accepted_at, created_by)
    VALUES (v_tenant_id, v_app_pieter_analyst, 'IDC-2026-001', 'ACCEPTED', 'FULL_TIME_PERMANENT',
            'Senior Investment Analyst', 'Mining & Metals', 1050000, 'ZAR', 'ANNUALLY',
            (NOW() + INTERVAL '30 days')::DATE, NOW() + INTERVAL '7 days', 'IDC Head Office, Sandton',
            90, 30, 20, TRUE, TRUE, 15.00, NOW() - INTERVAL '2 days', v_admin_user);

    INSERT INTO offers (tenant_id, application_id, offer_number, status, offer_type, job_title, department, base_salary, currency, salary_frequency, start_date, offer_expiry_date, work_location, probationary_period_days, notice_period_days, vacation_days_annual, health_insurance, retirement_plan, retirement_contribution_percentage, created_by)
    VALUES (v_tenant_id, v_app_priya_advisor, 'IDC-2026-002', 'DRAFT', 'FULL_TIME_PERMANENT',
            'Regional Business Advisor', 'Small Business Finance & Regions', 650000, 'ZAR', 'ANNUALLY',
            (NOW() + INTERVAL '45 days')::DATE, NOW() + INTERVAL '14 days', 'IDC Regional Office, Pretoria',
            90, 30, 20, TRUE, TRUE, 15.00, v_admin_user);

    -- ============================================================
    -- TIER 8: TALENT POOLS (2)
    -- ============================================================
    INSERT INTO talent_pools (tenant_id, pool_name, description, department, skills_criteria, experience_level, is_active)
    VALUES (v_tenant_id, 'Investment Analysts Pipeline', 'High-potential candidates for current and future investment analyst positions across IDC divisions.', 'Mining & Metals',
            'Financial modelling, Due diligence, Mining sector, Project finance', 'SENIOR', TRUE)
    RETURNING id INTO v_pool_analysts;

    INSERT INTO talent_pools (tenant_id, pool_name, description, department, skills_criteria, experience_level, is_active)
    VALUES (v_tenant_id, 'SBF Regional Advisors', 'Pipeline of candidates with SMME development and regional economics expertise for Small Business Finance roles.', 'Small Business Finance & Regions',
            'SMME development, Credit analysis, Regional economics', 'MID_LEVEL', TRUE)
    RETURNING id INTO v_pool_sbf;

    -- ============================================================
    -- TIER 9: TALENT POOL ENTRIES (5)
    -- ============================================================
    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, rating, notes, is_available, added_at)
    VALUES (v_tenant_id, v_pool_analysts, v_lerato, 5, 'Top candidate. Strong financial modelling and mining sector experience. CFA Level III.', TRUE, NOW() - INTERVAL '5 days');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, rating, notes, is_available, added_at)
    VALUES (v_tenant_id, v_pool_analysts, v_thabo, 4, 'Solid technical background with engineering and finance dual qualification. Currently in interview stage.', TRUE, NOW() - INTERVAL '10 days');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, rating, notes, is_available, added_at)
    VALUES (v_tenant_id, v_pool_analysts, v_ravi, 4, 'CFA Level II candidate with CIB experience. Promising but needs more mining-specific exposure.', TRUE, NOW() - INTERVAL '3 days');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, rating, notes, is_available, added_at)
    VALUES (v_tenant_id, v_pool_sbf, v_fatima, 3, 'Good development finance background from SEFA and NEF. Interview pending.', TRUE, NOW() - INTERVAL '8 days');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, rating, notes, is_available, added_at)
    VALUES (v_tenant_id, v_pool_sbf, v_priya, 5, 'Excellent SMME development track record. Offer in preparation.', TRUE, NOW() - INTERVAL '15 days');

    -- ============================================================
    -- TIER 10: AGENCY PROFILES (2)
    -- ============================================================
    INSERT INTO agency_profiles (tenant_id, agency_name, registration_number, contact_person, contact_email, contact_phone, specializations, status, fee_percentage, contract_start_date, contract_end_date, bee_level)
    VALUES (v_tenant_id, 'Talent Bridge Staffing', 'REG-2024-TBS-001', 'Jane Smith', 'jane@talentbridge.co.za', '+27 11 555 0100',
            'Financial services, Investment banking, Corporate finance, DFI recruitment', 'APPROVED', 12.50,
            '2025-01-01', '2026-12-31', 2);

    INSERT INTO agency_profiles (tenant_id, agency_name, registration_number, contact_person, contact_email, contact_phone, specializations, status, fee_percentage, contract_start_date, bee_level)
    VALUES (v_tenant_id, 'Mzansi Recruitment Partners', 'REG-2024-MRP-002', 'David Mahlangu', 'david@mzansirecruitment.co.za', '+27 11 555 0200',
            'Mining, Engineering, Development finance institutions, Government sector', 'PENDING_APPROVAL', 15.00,
            '2025-06-01', 1);

    RAISE NOTICE 'IDC demo data seeded successfully: 12 departments, 4 requisitions, 4 job postings, 12 applicants, 15 applications, 5 interviews, 2 offers, 2 talent pools, 5 talent pool entries, 2 agency profiles.';

END $$;
