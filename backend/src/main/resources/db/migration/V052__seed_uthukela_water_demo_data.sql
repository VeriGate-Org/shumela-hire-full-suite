-- V052: Seed uThukela Water demo tenant with realistic recruitment data
-- uThukela Water (uThukela District Municipality Water Services)
-- Idempotent: skips if applicants already exist for uthukela

DO $$
DECLARE
    v_tenant_id     VARCHAR(50);
    v_existing      INTEGER;

    -- user IDs (5 demo accounts per NDA Annexure L)
    v_user_admin        BIGINT;  -- admin@uthukela.shumelahire.co.za
    v_user_hr_manager   BIGINT;  -- hr.manager@uthukela.shumelahire.co.za
    v_user_executive    BIGINT;  -- executive@uthukela.shumelahire.co.za
    v_user_manager      BIGINT;  -- line.manager@uthukela.shumelahire.co.za
    v_user_employee     BIGINT;  -- employee@uthukela.shumelahire.co.za

    -- department IDs
    v_dept_ops      BIGINT;
    v_dept_fin      BIGINT;
    v_dept_tech     BIGINT;
    v_dept_corp     BIGINT;
    v_dept_water    BIGINT;
    v_dept_comm     BIGINT;

    -- requisition IDs
    v_req_engineer      BIGINT;
    v_req_accountant    BIGINT;
    v_req_plumber       BIGINT;
    v_req_officer       BIGINT;

    -- job posting IDs
    v_jp_engineer       BIGINT;
    v_jp_accountant     BIGINT;
    v_jp_plumber        BIGINT;
    v_jp_officer        BIGINT;

    -- applicant IDs
    v_sipho         BIGINT;
    v_thandiwe      BIGINT;
    v_bongani       BIGINT;
    v_zanele        BIGINT;
    v_themba        BIGINT;
    v_nokuthula     BIGINT;
    v_sibusiso      BIGINT;
    v_lindiwe       BIGINT;
    v_mthokozisi    BIGINT;
    v_nompilo       BIGINT;
    v_sakhile       BIGINT;
    v_hlengiwe      BIGINT;

    -- application IDs (needed for interviews/offers)
    v_app_bongani_engineer      BIGINT;
    v_app_themba_engineer       BIGINT;
    v_app_sipho_plumber         BIGINT;
    v_app_sibusiso_accountant   BIGINT;
    v_app_zanele_officer        BIGINT;
    v_app_lindiwe_officer       BIGINT;

    -- talent pool IDs
    v_pool_engineers    BIGINT;
    v_pool_water        BIGINT;

    -- employee IDs
    v_emp_moyo          BIGINT;  -- Thandi Moyo (from users)
    v_emp_vanwyk        BIGINT;  -- John van Wyk (from users)
    v_emp_nzimande      BIGINT;  -- Nomvula Nzimande (from users)
    v_emp_pillay        BIGINT;  -- Ayesha Pillay (from users)
    v_emp_botha         BIGINT;  -- Pieter Botha (from users)
    v_emp_mthembu       BIGINT;  -- Sizwe Mthembu (from users)
    v_emp_dladla        BIGINT;  -- Senzo Dladla
    v_emp_govender      BIGINT;  -- Prashna Govender
    v_emp_mabaso        BIGINT;  -- Lungile Mabaso
    v_emp_radebe        BIGINT;  -- Nkosinathi Radebe

    -- open recruitment: Water Quality Technician
    v_req_wqt           BIGINT;
    v_jp_wqt            BIGINT;
    v_app_wqt_new1      BIGINT;  -- Mbali Mthethwa
    v_app_wqt_new2      BIGINT;  -- Vuyo Ntuli
    v_app_wqt_new3      BIGINT;  -- Thabiso Mkhwanazi
    v_app_wqt_screened1 BIGINT;  -- Anele Zungu
    v_app_wqt_screened2 BIGINT;  -- Nhlanhla Ngubane
    v_app_wqt_interv1   BIGINT;  -- Bheki Majola
    v_app_wqt_interv2   BIGINT;  -- Sindisiwe Mthiyane
    v_app_wqt_short1    BIGINT;  -- Phiwokuhle Hadebe
    v_app_wqt_reject1   BIGINT;  -- Kwanele Mabena
    v_app_wqt_withdraw1 BIGINT;  -- Dumisani Sithole

    -- applicant IDs for open recruitment
    v_mbali         BIGINT;
    v_vuyo          BIGINT;
    v_thabiso       BIGINT;
    v_anele         BIGINT;
    v_nhlanhla      BIGINT;
    v_bheki         BIGINT;
    v_sindisiwe     BIGINT;
    v_phiwokuhle    BIGINT;
    v_kwanele       BIGINT;
    v_dumisani      BIGINT;

    -- performance review cycle IDs
    v_perf_cycle        BIGINT;
    v_perf_tmpl         BIGINT;
    v_pc_moyo           BIGINT;  -- contract IDs
    v_pc_vanwyk         BIGINT;
    v_pc_nzimande       BIGINT;
    v_pc_pillay         BIGINT;
    v_pc_botha          BIGINT;
    v_pc_mthembu        BIGINT;
    v_pc_dladla         BIGINT;
    v_pc_govender       BIGINT;
    v_pc_mabaso         BIGINT;
    v_pc_radebe         BIGINT;
    -- goal IDs (need for review_goal_scores)
    v_goal_id           BIGINT;
    v_goal_id2          BIGINT;
    v_goal_id3          BIGINT;
    v_goal_id4          BIGINT;
    -- review IDs
    v_rev_moyo          BIGINT;
    v_rev_vanwyk        BIGINT;
    v_rev_nzimande      BIGINT;
    v_rev_pillay        BIGINT;
    v_rev_botha         BIGINT;
    v_rev_mthembu       BIGINT;
    v_rev_dladla        BIGINT;
    v_rev_govender      BIGINT;
    v_rev_mabaso        BIGINT;
    v_rev_radebe        BIGINT;

    -- training course IDs
    v_tc_sans241        BIGINT;
    v_tc_ohs            BIGINT;
    v_tc_scada          BIGINT;
    v_tc_mfma           BIGINT;
    v_tc_batho          BIGINT;
    v_tc_leak           BIGINT;
    v_tc_excel          BIGINT;
    v_tc_leadership     BIGINT;

    -- training session IDs
    v_ts_sans241_q3     BIGINT;
    v_ts_sans241_q1     BIGINT;
    v_ts_ohs_q2         BIGINT;
    v_ts_ohs_q4         BIGINT;
    v_ts_scada_q3       BIGINT;
    v_ts_mfma_q1        BIGINT;
    v_ts_batho_q2       BIGINT;
    v_ts_leak_q4        BIGINT;
    v_ts_excel_q1       BIGINT;
    v_ts_leadership_q3  BIGINT;
    v_ts_ohs_upcoming   BIGINT;
    v_ts_scada_upcoming BIGINT;

    -- survey IDs (for training feedback)
    v_survey_sans241    BIGINT;
    v_survey_ohs        BIGINT;
    v_sq_overall        BIGINT;
    v_sq_content        BIGINT;
    v_sq_trainer        BIGINT;
    v_sq_relevance      BIGINT;
    v_sq_comment        BIGINT;
    v_sq2_overall       BIGINT;
    v_sq2_content       BIGINT;
    v_sq2_trainer       BIGINT;
    v_sq2_relevance     BIGINT;
    v_sq2_comment       BIGINT;

    -- leave type IDs
    v_lt_annual         BIGINT;
    v_lt_sick           BIGINT;
    v_lt_family         BIGINT;
    v_lt_maternity      BIGINT;
    v_lt_study          BIGINT;
    v_lt_unpaid         BIGINT;

    -- leave policy IDs
    v_lp_annual         BIGINT;
    v_lp_sick           BIGINT;
    v_lp_family         BIGINT;
    v_lp_maternity      BIGINT;
    v_lp_study          BIGINT;
    v_lp_unpaid         BIGINT;

    -- admin user for created_by FK
    v_admin_user    BIGINT;

BEGIN
    -- ============================================================
    -- CREATE TENANT (idempotent — skips if already exists)
    -- ============================================================
    INSERT INTO tenants (id, name, subdomain, status, plan, contact_email, contact_name, max_users, settings)
    VALUES (
        'uthukela',
        'uThukela Water',
        'uthukela',
        'ACTIVE',
        'STANDARD',
        'hr@uthukela.gov.za',
        'System Administrator',
        50,
        '{}'::jsonb
    )
    ON CONFLICT (subdomain) DO NOTHING;

    -- ============================================================
    -- RESOLVE TENANT BY SUBDOMAIN
    -- ============================================================
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'uthukela';

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant with subdomain uthukela not found. Skipping.';
        RETURN;
    END IF;

    RAISE NOTICE 'Resolved uthukela tenant ID: %', v_tenant_id;

    -- ============================================================
    -- IDEMPOTENCY CHECK
    -- ============================================================
    SELECT COUNT(*) INTO v_existing
    FROM applicants
    WHERE tenant_id = v_tenant_id;

    IF v_existing > 0 THEN
        RAISE NOTICE 'uThukela Water demo data already seeded (% applicants found). Skipping.', v_existing;
        RETURN;
    END IF;

    -- ============================================================
    -- CLEANUP: Clear talent pools and agencies for uthukela
    -- (FK-safe order: children first)
    -- ============================================================
    DELETE FROM talent_pool_entries WHERE tenant_id = v_tenant_id;
    DELETE FROM talent_pools WHERE tenant_id = v_tenant_id;
    DELETE FROM agency_profiles WHERE tenant_id = v_tenant_id;
    RAISE NOTICE 'Cleared talent_pool_entries, talent_pools, and agency_profiles for %', v_tenant_id;

    -- ============================================================
    -- TIER 0: USERS (5 demo accounts per NDA Annexure L)
    -- Passwords are bcrypt-hashed 'Demo@2026!' for demo purposes
    -- Emails use @uthukela.shumelahire.co.za (Cognito provisioned)
    -- ============================================================

    -- 1. Administrator — full system config, user management, Sage integration
    INSERT INTO users (tenant_id, username, email, password, first_name, last_name, role, is_enabled, email_verified, phone, job_title, department)
    VALUES (v_tenant_id, 'admin', 'admin@uthukela.shumelahire.co.za',
            '$2a$12$.LjEv7zW9uNpGQXzwl01i.Mh916jh8Qb3tRw/UVaKydec1HlMVEI2',
            'Pieter', 'Botha', 'ADMIN', TRUE, TRUE,
            '+27 82 500 0005', 'IT Systems Administrator', 'Corporate Services')
    RETURNING id INTO v_user_admin;

    -- 2. HR Manager — leave, attendance, recruitment, performance, documents
    INSERT INTO users (tenant_id, username, email, password, first_name, last_name, role, is_enabled, email_verified, phone, job_title, department)
    VALUES (v_tenant_id, 'hr.manager', 'hr.manager@uthukela.shumelahire.co.za',
            '$2a$12$.LjEv7zW9uNpGQXzwl01i.Mh916jh8Qb3tRw/UVaKydec1HlMVEI2',
            'Nomvula', 'Nzimande', 'HR_MANAGER', TRUE, TRUE,
            '+27 61 300 0003', 'HR Manager', 'Corporate Services')
    RETURNING id INTO v_user_hr_manager;

    -- 3. Executive — dashboards, analytics, workforce planning, approvals
    INSERT INTO users (tenant_id, username, email, password, first_name, last_name, role, is_enabled, email_verified, phone, job_title, department)
    VALUES (v_tenant_id, 'executive', 'executive@uthukela.shumelahire.co.za',
            '$2a$12$.LjEv7zW9uNpGQXzwl01i.Mh916jh8Qb3tRw/UVaKydec1HlMVEI2',
            'Sizwe', 'Mthembu', 'EXECUTIVE', TRUE, TRUE,
            '+27 84 600 0006', 'Municipal Manager', 'Corporate Services')
    RETURNING id INTO v_user_executive;

    -- 4. Line Manager — team dashboard, leave/attendance approvals, performance reviews
    INSERT INTO users (tenant_id, username, email, password, first_name, last_name, role, is_enabled, email_verified, phone, job_title, department)
    VALUES (v_tenant_id, 'line.manager', 'line.manager@uthukela.shumelahire.co.za',
            '$2a$12$.LjEv7zW9uNpGQXzwl01i.Mh916jh8Qb3tRw/UVaKydec1HlMVEI2',
            'John', 'van Wyk', 'HIRING_MANAGER', TRUE, TRUE,
            '+27 83 200 0002', 'Operations Manager', 'Operations')
    RETURNING id INTO v_user_manager;

    -- 5. Employee — self-service, leave requests, clock-in, training, self-assessment
    INSERT INTO users (tenant_id, username, email, password, first_name, last_name, role, is_enabled, email_verified, phone, job_title, department)
    VALUES (v_tenant_id, 'employee', 'employee@uthukela.shumelahire.co.za',
            '$2a$12$.LjEv7zW9uNpGQXzwl01i.Mh916jh8Qb3tRw/UVaKydec1HlMVEI2',
            'Thandi', 'Moyo', 'EMPLOYEE', TRUE, TRUE,
            '+27 72 100 0001', 'Water Meter Reader', 'Operations')
    RETURNING id INTO v_user_employee;

    RAISE NOTICE 'Created 5 demo user accounts per NDA Annexure L';

    -- ============================================================
    -- RESOLVE ADMIN USER (for created_by NOT NULL columns)
    -- ============================================================
    v_admin_user := v_user_admin;

    -- ============================================================
    -- SET TENANT BRANDING (colors from uthukela.gov.za)
    -- Primary: #2d3192 (deep royal blue)
    -- Secondary: #14284B (dark navy)
    -- Accent: #FFB606 (golden amber)
    -- ============================================================
    UPDATE tenants
    SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{branding}',
        '{
            "primaryColor": "#2d3192",
            "secondaryColor": "#14284B",
            "accentColor": "#FFB606"
        }'::jsonb
    ),
    name = 'uThukela Water',
    contact_email = 'hr@uthukela.gov.za'
    WHERE id = v_tenant_id;

    -- Also set company info
    UPDATE tenants
    SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{companyInfo}',
        '{
            "description": "uThukela District Municipality Water Services - providing clean, reliable water and sanitation services to the communities of uThukela District in KwaZulu-Natal, South Africa.",
            "industry": "Water & Sanitation / Local Government",
            "address": "50 Princess Street, Ladysmith, 3370, KwaZulu-Natal",
            "website": "https://www.uthukela.gov.za"
        }'::jsonb
    )
    WHERE id = v_tenant_id;

    RAISE NOTICE 'Updated tenant branding and company info';

    -- ============================================================
    -- TIER 1: DEPARTMENTS (6)
    -- ============================================================
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Operations', 'OPS', TRUE) RETURNING id INTO v_dept_ops;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Finance', 'FIN', TRUE) RETURNING id INTO v_dept_fin;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Technical Services', 'TECH', TRUE) RETURNING id INTO v_dept_tech;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Corporate Services', 'CORP', TRUE) RETURNING id INTO v_dept_corp;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Water Services', 'WATER', TRUE) RETURNING id INTO v_dept_water;
    INSERT INTO departments (tenant_id, name, code, is_active) VALUES (v_tenant_id, 'Community Services', 'COMMUNITY', TRUE) RETURNING id INTO v_dept_comm;

    -- ============================================================
    -- TIER 2: REQUISITIONS (4)
    -- ============================================================
    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Water Process Engineer', 'Water Services', 'Ladysmith', 'FULL_TIME', 550000, 780000,
            'Design and optimise water treatment processes across uThukela District treatment plants. Ensure compliance with SANS 241 drinking water quality standards and Blue Drop certification requirements.',
            'Critical vacancy — required to maintain Blue Drop compliance and oversee Ladysmith WTW upgrade project.', 'APPROVED')
    RETURNING id INTO v_req_engineer;

    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Revenue Accountant', 'Finance', 'Ladysmith', 'FULL_TIME', 380000, 520000,
            'Manage water billing, revenue collection, and debtor management for the district. Prepare financial reports aligned with mSCOA municipal accounting standards.',
            'Replacement for resigned incumbent. Revenue collection is a key performance area for the municipality.', 'APPROVED')
    RETURNING id INTO v_req_accountant;

    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Senior Plumber / Artisan', 'Technical Services', 'Estcourt', 'FULL_TIME', 280000, 380000,
            'Perform maintenance and repairs on water reticulation networks across the Estcourt area. Respond to burst pipes, conduct leak detection, and supervise plumbing teams.',
            'Additional headcount to reduce water losses in Estcourt reticulation zone (currently above 40% non-revenue water).', 'APPROVED')
    RETURNING id INTO v_req_plumber;

    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Community Liaison Officer', 'Community Services', 'Bergville', 'FULL_TIME', 300000, 420000,
            'Serve as the primary interface between uThukela Water and communities in the Bergville area. Manage water service delivery complaints, coordinate community meetings, and support public participation processes.',
            'New position to improve community engagement in Bergville following service delivery protests.', 'APPROVED')
    RETURNING id INTO v_req_officer;

    -- ============================================================
    -- TIER 3: JOB POSTINGS (4 — PUBLISHED)
    -- ============================================================
    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Water Process Engineer', 'Water Services', 'Ladysmith', 'FULL_TIME', 'SENIOR',
            'uThukela Water seeks a Water Process Engineer to join our Water Services department at the Ladysmith offices. You will oversee water treatment operations and drive compliance with national drinking water standards across the district.',
            'B.Eng or B.Sc (Eng) in Chemical, Civil, or Process Engineering. Registration with ECSA as Pr.Eng or Pr.Tech.Eng. Minimum 5 years experience in water/wastewater treatment. Knowledge of SANS 241 and Blue Drop requirements. Experience with SCADA systems an advantage.',
            'Oversee daily operations of water treatment works across the district. Ensure compliance with SANS 241 drinking water quality standards. Manage Blue Drop and Green Drop audit preparation. Optimise chemical dosing and treatment processes. Supervise process controllers and plant operators. Coordinate with DWS on water use licence compliance.',
            550000, 780000, 'ZAR', 'PUBLISHED', 'water-process-engineer', 1, NOW() - INTERVAL '14 days', NOW() + INTERVAL '30 days', v_admin_user)
    RETURNING id INTO v_jp_engineer;

    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Revenue Accountant', 'Finance', 'Ladysmith', 'FULL_TIME', 'MID_LEVEL',
            'Join uThukela Water''s Finance department to manage water billing and revenue operations. You will play a key role in ensuring financial sustainability of water services delivery.',
            'B.Com Accounting or equivalent. Minimum 3 years experience in municipal finance or revenue management. Knowledge of mSCOA and GRAP standards. Experience with municipal billing systems (e.g., Munsoft, Promun). Understanding of the Municipal Finance Management Act (MFMA).',
            'Manage water billing cycles and revenue collection processes. Prepare monthly revenue reconciliations and reports. Oversee debtor management and credit control. Ensure compliance with MFMA and mSCOA standards. Coordinate with meter reading teams on consumption data. Support annual financial statement preparation.',
            380000, 520000, 'ZAR', 'PUBLISHED', 'revenue-accountant', 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', v_admin_user)
    RETURNING id INTO v_jp_accountant;

    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Senior Plumber / Artisan', 'Technical Services', 'Estcourt', 'FULL_TIME', 'MID_LEVEL',
            'uThukela Water is looking for a Senior Plumber/Artisan to strengthen our Technical Services team in Estcourt. You will lead maintenance operations on the water reticulation network and help reduce non-revenue water losses.',
            'Trade Certificate in Plumbing (NQF Level 4). Valid PIRB registration. Minimum 5 years experience in water reticulation maintenance. Code EB driver''s licence. Experience with leak detection equipment. Ability to read engineering drawings and water network plans.',
            'Perform maintenance and emergency repairs on water reticulation infrastructure. Conduct leak detection surveys and non-revenue water reduction activities. Supervise plumbing teams and contractors. Maintain records of repairs and asset condition. Ensure compliance with OHS Act and municipal safety standards. Participate in after-hours standby roster.',
            280000, 380000, 'ZAR', 'PUBLISHED', 'senior-plumber-artisan', 1, NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', v_admin_user)
    RETURNING id INTO v_jp_plumber;

    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Community Liaison Officer', 'Community Services', 'Bergville', 'FULL_TIME', 'ENTRY_LEVEL',
            'uThukela Water invites applications for a Community Liaison Officer based in Bergville. You will be the link between the municipality and communities on all water service delivery matters.',
            'Diploma in Public Administration, Development Studies, or Social Sciences. Minimum 2 years community engagement experience, preferably in local government. Fluency in isiZulu and English. Valid Code EB driver''s licence. Knowledge of the Batho Pele principles and public participation processes.',
            'Serve as primary community contact point for water service delivery issues. Coordinate and facilitate community meetings and imbizo. Manage and resolve service delivery complaints. Support public participation processes for water projects. Prepare community engagement reports for management. Liaise with ward councillors and community development workers.',
            300000, 420000, 'ZAR', 'PUBLISHED', 'community-liaison-officer', 1, NOW() - INTERVAL '5 days', NOW() + INTERVAL '45 days', v_admin_user)
    RETURNING id INTO v_jp_officer;

    -- ============================================================
    -- TIER 4: APPLICANTS (12)
    -- ============================================================
    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Sipho', 'Mkhize', 'sipho.mkhize@email.co.za', '+27 72 345 6789', 'Ladysmith', 'Plumber Foreman at Msunduzi Municipality (8 years)', 'Water reticulation, Leak detection, Team supervision, Pipe laying, OHS compliance', 'DIRECT')
    RETURNING id INTO v_sipho;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Thandiwe', 'Dlamini', 'thandiwe.dlamini@email.co.za', '+27 83 456 7890', 'Pietermaritzburg', 'Process Engineer at Umgeni Water (6 years)', 'Water treatment, SANS 241, SCADA systems, Chemical dosing, Process optimisation', 'LINKEDIN')
    RETURNING id INTO v_thandiwe;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Bongani', 'Nkosi', 'bongani.nkosi@email.co.za', '+27 61 567 8901', 'Durban', 'Senior Water Engineer at eThekwini Municipality (10 years)', 'Water process design, Blue Drop audits, Project management, ECSA registered, Wastewater treatment', 'REFERRAL')
    RETURNING id INTO v_bongani;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Zanele', 'Shabalala', 'zanele.shabalala@email.co.za', '+27 76 678 9012', 'Bergville', 'Community Development Worker at Okhahlamba Local Municipality (4 years)', 'Community engagement, IsiZulu, Public participation, Conflict resolution, Report writing', 'DIRECT')
    RETURNING id INTO v_zanele;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Themba', 'Zulu', 'themba.zulu@email.co.za', '+27 82 789 0123', 'Richards Bay', 'Civil Engineer at Royal HaskoningDHV (7 years)', 'Water infrastructure design, Hydraulic modelling, Project management, AutoCAD, GIS', 'LINKEDIN')
    RETURNING id INTO v_themba;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Nokuthula', 'Cele', 'nokuthula.cele@email.co.za', '+27 73 890 1234', 'Estcourt', 'Public Relations Officer at Inkosi Langalibalele Municipality (5 years)', 'Stakeholder management, Media relations, IsiZulu, Event coordination, Communication strategy', 'DIRECT')
    RETURNING id INTO v_nokuthula;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Sibusiso', 'Ndlovu', 'sibusiso.ndlovu@email.co.za', '+27 84 901 2345', 'Newcastle', 'Management Accountant at Amajuba District Municipality (6 years)', 'Municipal finance, mSCOA, GRAP, Revenue management, MFMA compliance', 'REFERRAL')
    RETURNING id INTO v_sibusiso;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Lindiwe', 'Khumalo', 'lindiwe.khumalo@email.co.za', '+27 79 012 3456', 'Harrismith', 'Social Worker at Department of Social Development (3 years)', 'Community development, IsiZulu, Sesotho, Counselling, Project coordination', 'DIRECT')
    RETURNING id INTO v_lindiwe;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Mthokozisi', 'Buthelezi', 'mthokozisi.buthelezi@email.co.za', '+27 71 123 4567', 'Ladysmith', 'Water Plant Operator at uThukela District Municipality (12 years)', 'Water treatment operations, Process control, Chemical handling, Plant maintenance, Water quality testing', 'DIRECT')
    RETURNING id INTO v_mthokozisi;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Nompilo', 'Mazibuko', 'nompilo.mazibuko@email.co.za', '+27 68 234 5678', 'Pietermaritzburg', 'Financial Analyst at KZN Treasury (4 years)', 'Financial analysis, Municipal budgeting, Excel, Data analytics, PFMA compliance', 'LINKEDIN')
    RETURNING id INTO v_nompilo;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Sakhile', 'Ngcobo', 'sakhile.ngcobo@email.co.za', '+27 63 345 6789', 'Estcourt', 'Plumber, Self-employed (9 years)', 'Plumbing, Water reticulation, Pipe fitting, Welding, Maintenance planning', 'DIRECT')
    RETURNING id INTO v_sakhile;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Hlengiwe', 'Sithole', 'hlengiwe.sithole@email.co.za', '+27 65 456 7890', 'Winterton', 'Admin Officer at Department of Water and Sanitation (5 years)', 'Administration, Document management, Municipal systems, Customer service, IsiZulu', 'REFERRAL')
    RETURNING id INTO v_hlengiwe;

    -- ============================================================
    -- TIER 5: APPLICATIONS (correct statuses + pipeline_stage)
    -- ============================================================
    -- Water Process Engineer applications
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_bongani, v_jp_engineer, 'Water Process Engineer', 'Water Services', 'INTERVIEW_SCHEDULED', 'PANEL_INTERVIEW',
            'With 10 years of experience in water engineering at eThekwini Municipality, including leading Blue Drop audit preparations, I am eager to bring my expertise to uThukela Water. I hold ECSA Pr.Eng registration and have managed multiple WTW upgrade projects.',
            'Referral', NOW() - INTERVAL '12 days')
    RETURNING id INTO v_app_bongani_engineer;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_themba, v_jp_engineer, 'Water Process Engineer', 'Water Services', 'INTERVIEW_SCHEDULED', 'FIRST_INTERVIEW',
            'As a civil engineer with Royal HaskoningDHV specialising in water infrastructure, I bring strong technical skills in hydraulic modelling and project delivery. I am passionate about improving water service delivery in KwaZulu-Natal.',
            'LinkedIn', NOW() - INTERVAL '10 days')
    RETURNING id INTO v_app_themba_engineer;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_thandiwe, v_jp_engineer, 'Water Process Engineer', 'Water Services', 'SCREENING', 'INITIAL_SCREENING',
            'Currently working as a Process Engineer at Umgeni Water, I have hands-on experience with SANS 241 compliance and SCADA-based treatment process control. I am looking to take on a more senior role in municipal water treatment.',
            'Career Portal', NOW() - INTERVAL '8 days');

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_mthokozisi, v_jp_engineer, 'Water Process Engineer', 'Water Services', 'SUBMITTED', 'APPLICATION_RECEIVED',
            'With 12 years as a water plant operator at uThukela, I have deep knowledge of our treatment works and processes. I have completed my B.Tech in Chemical Engineering and am ready to step into an engineering role.',
            'Career Portal', NOW() - INTERVAL '3 days');

    -- Revenue Accountant applications
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_sibusiso, v_jp_accountant, 'Revenue Accountant', 'Finance', 'INTERVIEW_SCHEDULED', 'FIRST_INTERVIEW',
            'With 6 years in municipal finance at Amajuba District, I have extensive experience with mSCOA implementation, revenue management, and MFMA compliance. I am excited about the opportunity to strengthen uThukela Water''s financial operations.',
            'Referral', NOW() - INTERVAL '9 days')
    RETURNING id INTO v_app_sibusiso_accountant;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_nompilo, v_jp_accountant, 'Revenue Accountant', 'Finance', 'SCREENING', 'INITIAL_SCREENING',
            'As a financial analyst at KZN Treasury, I have developed strong analytical skills and deep understanding of municipal financial frameworks. I am seeking to apply my skills directly in municipal revenue management.',
            'LinkedIn', NOW() - INTERVAL '7 days');

    -- Senior Plumber applications
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at, offer_extended_at)
    VALUES (v_tenant_id, v_sipho, v_jp_plumber, 'Senior Plumber / Artisan', 'Technical Services', 'OFFERED', 'OFFER_EXTENDED',
            'With 8 years as a plumber foreman at Msunduzi Municipality, I have led teams in water reticulation maintenance and achieved significant reductions in non-revenue water. I hold a valid PIRB registration and am eager to contribute to uThukela Water.',
            'Career Portal', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day')
    RETURNING id INTO v_app_sipho_plumber;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_sakhile, v_jp_plumber, 'Senior Plumber / Artisan', 'Technical Services', 'SCREENING', 'INITIAL_SCREENING',
            'As a self-employed plumber with 9 years of experience in the Estcourt area, I have intimate knowledge of the local water network. I am looking for the stability and purpose of working directly for the municipality to serve my community.',
            'Career Portal', NOW() - INTERVAL '4 days');

    -- Community Liaison Officer applications
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_zanele, v_jp_officer, 'Community Liaison Officer', 'Community Services', 'INTERVIEW_SCHEDULED', 'FIRST_INTERVIEW',
            'As a community development worker in Bergville for 4 years, I have built strong relationships with local communities and ward councillors. I am fluent in isiZulu and understand the water service delivery challenges facing our communities.',
            'Career Portal', NOW() - INTERVAL '4 days')
    RETURNING id INTO v_app_zanele_officer;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_lindiwe, v_jp_officer, 'Community Liaison Officer', 'Community Services', 'SCREENING', 'INITIAL_SCREENING',
            'My background in social work has equipped me with strong interpersonal and conflict resolution skills. I speak isiZulu and Sesotho fluently and am passionate about ensuring communities have access to clean water.',
            'Career Portal', NOW() - INTERVAL '3 days')
    RETURNING id INTO v_app_lindiwe_officer;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_nokuthula, v_jp_officer, 'Community Liaison Officer', 'Community Services', 'SUBMITTED', 'APPLICATION_RECEIVED',
            'With 5 years in public relations at Inkosi Langalibalele Municipality, I have experience in community engagement, stakeholder management, and organising public participation events. I am keen to focus specifically on water services.',
            'Career Portal', NOW() - INTERVAL '2 days');

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_hlengiwe, v_jp_officer, 'Community Liaison Officer', 'Community Services', 'SUBMITTED', 'APPLICATION_RECEIVED',
            'Having worked at the Department of Water and Sanitation for 5 years, I understand the regulatory framework for water services. I am based in Winterton and passionate about bridging the gap between government and communities.',
            'Career Portal', NOW() - INTERVAL '1 day');

    -- ============================================================
    -- TIER 6: INTERVIEWS (using V002 schema: title, type, round)
    -- ============================================================
    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_bongani_engineer, 'Panel Interview - Bongani Nkosi (Water Process Engineer)', 'PANEL', 'PANEL', 'COMPLETED',
            NOW() - INTERVAL '5 days', 90, 'uThukela Water Head Office, Ladysmith',
            'John van Wyk', 'john.vanwyk@uthukela.gov.za',
            'Strong technical knowledge. ECSA registered. Demonstrated experience with Blue Drop compliance. Panel recommends progression to final interview.',
            4, 'HIRE', NOW() - INTERVAL '5 days');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_themba_engineer, 'Panel Interview - Themba Zulu (Water Process Engineer)', 'PANEL', 'PANEL', 'COMPLETED',
            NOW() - INTERVAL '4 days', 90, 'uThukela Water Head Office, Ladysmith',
            'John van Wyk', 'john.vanwyk@uthukela.gov.za',
            'Good project management skills. Experience is more in infrastructure design than treatment operations. Consider for future infrastructure projects.',
            3, 'CONSIDER', NOW() - INTERVAL '4 days');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email)
    VALUES (v_tenant_id, v_app_sibusiso_accountant, 'First Interview - Sibusiso Ndlovu (Revenue Accountant)', 'IN_PERSON', 'FIRST', 'SCHEDULED',
            NOW() + INTERVAL '3 days', 60, 'uThukela Water Head Office, Ladysmith',
            'Prashna Govender', 'prashna.govender@uthukela.gov.za');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email)
    VALUES (v_tenant_id, v_app_zanele_officer, 'First Interview - Zanele Shabalala (Community Liaison Officer)', 'IN_PERSON', 'FIRST', 'SCHEDULED',
            NOW() + INTERVAL '5 days', 60, 'Bergville Community Hall',
            'Nkosinathi Radebe', 'nkosinathi.radebe@uthukela.gov.za');

    -- ============================================================
    -- TIER 7: OFFERS
    -- ============================================================
    INSERT INTO offers (tenant_id, application_id, offer_number, job_title, department, base_salary, start_date, offer_expiry_date, status, special_conditions, approval_notes, created_by)
    VALUES (v_tenant_id, v_app_sipho_plumber, 'UTH-2026-001', 'Senior Plumber', 'Water Services', 340000, NOW() + INTERVAL '30 days', NOW() + INTERVAL '14 days', 'PENDING_APPROVAL',
            'Permanent appointment on salary level 7. 37-hour work week with after-hours standby roster. Municipal pension fund and medical aid contributions included. Relocation allowance of R15,000.',
            'Preferred candidate. Strong references from Msunduzi Municipality. PIRB registered.', v_admin_user);

    -- ============================================================
    -- TIER 8: TALENT POOLS
    -- ============================================================
    INSERT INTO talent_pools (tenant_id, pool_name, description, created_by)
    VALUES (v_tenant_id, 'Water Engineers & Technical Specialists', 'Pipeline of qualified water and process engineers for future vacancies across treatment works and infrastructure projects.', v_admin_user)
    RETURNING id INTO v_pool_engineers;

    INSERT INTO talent_pools (tenant_id, pool_name, description, created_by)
    VALUES (v_tenant_id, 'Water Services & Community Engagement', 'Candidates with water services and community development experience for community-facing roles.', v_admin_user)
    RETURNING id INTO v_pool_water;

    -- Add candidates to talent pools
    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, notes)
    VALUES (v_tenant_id, v_pool_engineers, v_thandiwe, 'Process engineer from Umgeni Water. Strong SANS 241 knowledge.');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, notes)
    VALUES (v_tenant_id, v_pool_engineers, v_mthokozisi, 'Internal candidate. 12 years plant operations experience. Completing B.Tech.');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, notes)
    VALUES (v_tenant_id, v_pool_water, v_nokuthula, 'PR officer with municipal community engagement experience.');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, notes)
    VALUES (v_tenant_id, v_pool_water, v_lindiwe, 'Social worker with isiZulu and Sesotho fluency. Harrismith-based.');

    INSERT INTO talent_pool_entries (tenant_id, talent_pool_id, applicant_id, notes)
    VALUES (v_tenant_id, v_pool_water, v_hlengiwe, 'DWS experience. Based in Winterton.');

    -- ============================================================
    -- TIER 8b: OPEN RECRUITMENT — Water Quality Technician
    -- Full pipeline: NEW → SCREENED → INTERVIEWED → SHORTLISTED
    -- Plus REJECTED and WITHDRAWN for realism
    -- ============================================================

    -- Requisition
    INSERT INTO requisitions (tenant_id, job_title, department, location, employment_type, salary_min, salary_max, description, justification, status)
    VALUES (v_tenant_id, 'Water Quality Technician', 'Water Services', 'Ladysmith', 'FULL_TIME', 320000, 450000,
            'Conduct water quality sampling and laboratory analysis across uThukela District treatment works and distribution networks. Monitor SANS 241 compliance, maintain laboratory equipment, and prepare quality reports for the Blue Drop assessment programme.',
            'Critical vacancy — required for Blue Drop compliance sampling regime. Previous incumbent resigned. Sampling backlog growing.', 'APPROVED')
    RETURNING id INTO v_req_wqt;

    -- Job Posting (PUBLISHED, open, 2 positions)
    INSERT INTO job_postings (tenant_id, title, department, location, employment_type, experience_level, description, requirements, responsibilities, salary_min, salary_max, salary_currency, status, slug, positions_available, published_at, application_deadline, created_by)
    VALUES (v_tenant_id, 'Water Quality Technician', 'Water Services', 'Ladysmith', 'FULL_TIME', 'MID_LEVEL',
            'uThukela Water is recruiting a Water Quality Technician to join our Water Services team at the Ladysmith laboratory. You will be responsible for water quality monitoring across the district to ensure safe, compliant drinking water for all communities.',
            'National Diploma in Analytical Chemistry, Biotechnology, or Water Care (NQF Level 6). Minimum 2 years experience in water quality analysis or laboratory work. Knowledge of SANS 241 drinking water quality standards. Proficiency with laboratory instruments (spectrophotometer, turbidimeter, pH meter). Valid Code EB driver''s licence required for field sampling.',
            'Collect water samples from treatment works, reservoirs, and distribution points according to the sampling schedule. Perform physico-chemical and microbiological analyses in the district laboratory. Record and report results in the Water Quality Management System. Flag non-compliance events and initiate corrective actions. Calibrate and maintain laboratory instruments and equipment. Prepare monthly water quality compliance reports for Blue Drop assessment. Assist with incident response during water quality emergencies. Maintain sample chain-of-custody records.',
            320000, 450000, 'ZAR', 'PUBLISHED', 'water-quality-technician', 2, NOW() - INTERVAL '21 days', NOW() + INTERVAL '14 days', v_admin_user)
    RETURNING id INTO v_jp_wqt;

    -- 10 NEW APPLICANTS for this role
    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Mbali', 'Mthethwa', 'mbali.mthethwa@email.co.za', '+27 72 501 0001', 'Ladysmith', 'Laboratory Assistant at Rand Water (3 years)', 'Water analysis, SANS 241, Spectrophotometry, Microbiological testing, Sample collection', 'CAREER_PORTAL')
    RETURNING id INTO v_mbali;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Vuyo', 'Ntuli', 'vuyo.ntuli@email.co.za', '+27 83 502 0002', 'Estcourt', 'Intern: Water Quality at uThukela District Municipality (1 year)', 'Water sampling, Laboratory safety, Data recording, Basic chemistry, MS Excel', 'CAREER_PORTAL')
    RETURNING id INTO v_vuyo;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Thabiso', 'Mkhwanazi', 'thabiso.mkhwanazi@email.co.za', '+27 61 503 0003', 'Pietermaritzburg', 'Analytical Chemist at SGS Laboratories (4 years)', 'Analytical chemistry, ICP-OES, HPLC, Quality assurance, ISO 17025, Method validation', 'LINKEDIN')
    RETURNING id INTO v_thabiso;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Anele', 'Zungu', 'anele.zungu@email.co.za', '+27 76 504 0004', 'Newcastle', 'Water Quality Monitor at Amajuba District Municipality (3 years)', 'Water quality monitoring, SANS 241, Blue Drop, Turbidimeters, pH measurement, Report writing', 'REFERRAL')
    RETURNING id INTO v_anele;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Nhlanhla', 'Ngubane', 'nhlanhla.ngubane@email.co.za', '+27 82 505 0005', 'Ladysmith', 'Lab Technician at National Health Laboratory Service (5 years)', 'Microbiology, Coliform testing, E.coli analysis, Aseptic technique, LIMS, Quality control', 'CAREER_PORTAL')
    RETURNING id INTO v_nhlanhla;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Bheki', 'Majola', 'bheki.majola@email.co.za', '+27 71 506 0006', 'Bergville', 'Environmental Technician at Department of Water and Sanitation (4 years)', 'Water quality assessment, Catchment monitoring, Environmental compliance, GIS, Report writing, SANS 241', 'LINKEDIN')
    RETURNING id INTO v_bheki;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Sindisiwe', 'Mthiyane', 'sindisiwe.mthiyane@email.co.za', '+27 73 507 0007', 'Dundee', 'Quality Control Officer at Umgeni Water (6 years)', 'Water quality management, Laboratory management, SANS 241, Blue Drop assessments, Instrument calibration, Team leadership', 'REFERRAL')
    RETURNING id INTO v_sindisiwe;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Phiwokuhle', 'Hadebe', 'phiwokuhle.hadebe@email.co.za', '+27 68 508 0008', 'Ladysmith', 'Water Quality Analyst at Midvaal Water Company (5 years)', 'Water analysis, Chemical dosing calculations, Jar testing, SCADA monitoring, SANS 241, Compliance reporting', 'CAREER_PORTAL')
    RETURNING id INTO v_phiwokuhle;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Kwanele', 'Mabena', 'kwanele.mabena@email.co.za', '+27 65 509 0009', 'Harrismith', 'General Worker at Maluti-a-Phofung Municipality (1 year)', 'Basic maintenance, Meter reading, Physical fitness, Drivers licence', 'CAREER_PORTAL')
    RETURNING id INTO v_kwanele;

    INSERT INTO applicants (tenant_id, name, surname, email, phone, location, experience, skills, source)
    VALUES (v_tenant_id, 'Dumisani', 'Sithole', 'dumisani.sithole@email.co.za', '+27 84 510 0010', 'Pietermaritzburg', 'Lab Technician at UKZN Chemistry Department (2 years)', 'Analytical chemistry, Research methods, Laboratory equipment, Data analysis, Scientific writing', 'LINKEDIN')
    RETURNING id INTO v_dumisani;

    -- ---- PIPELINE STAGE: NEW (APPLICATION_RECEIVED / SUBMITTED) — 3 applicants ----
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_mbali, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'SUBMITTED', 'APPLICATION_RECEIVED',
            'I am a laboratory assistant at Rand Water with 3 years of hands-on experience in water quality analysis. I hold a National Diploma in Analytical Chemistry from DUT and am familiar with SANS 241 requirements. I am keen to relocate back to my hometown of Ladysmith to contribute to uThukela Water.',
            'Career Portal', NOW() - INTERVAL '3 days')
    RETURNING id INTO v_app_wqt_new1;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_vuyo, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'SUBMITTED', 'APPLICATION_RECEIVED',
            'I recently completed my internship at uThukela District Municipality in the water quality section. Though I have limited experience, I am passionate about water safety and am completing my N.Dip in Water Care at Umfolozi TVET College. I would love the opportunity to continue working in this district.',
            'Career Portal', NOW() - INTERVAL '2 days')
    RETURNING id INTO v_app_wqt_new2;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, cover_letter, application_source, submitted_at)
    VALUES (v_tenant_id, v_thabiso, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'SUBMITTED', 'APPLICATION_RECEIVED',
            'As an analytical chemist at SGS with 4 years in environmental testing, I bring strong laboratory skills and a quality management mindset. I hold a B.Sc in Chemistry from UKZN and am interested in transitioning to the municipal water sector.',
            'LinkedIn', NOW() - INTERVAL '1 day')
    RETURNING id INTO v_app_wqt_new3;

    -- ---- PIPELINE STAGE: SCREENED (INITIAL_SCREENING / SCREENING) — 2 applicants ----
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, cover_letter, application_source, submitted_at, rating)
    VALUES (v_tenant_id, v_anele, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'SCREENING', 'INITIAL_SCREENING',
            'Meets all minimum requirements. Current water quality monitor at Amajuba DM — directly relevant experience. N.Dip Water Care confirmed. SANS 241 knowledge evident. Recommend for interview.',
            'I am currently a water quality monitor at Amajuba District Municipality with 3 years of experience. I hold a National Diploma in Water Care and have been involved in Blue Drop audit preparations. I am seeking to advance my career at uThukela Water where I can contribute to improving water quality compliance.',
            'Referral', NOW() - INTERVAL '14 days', 4)
    RETURNING id INTO v_app_wqt_screened1;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, cover_letter, application_source, submitted_at, rating)
    VALUES (v_tenant_id, v_nhlanhla, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'SCREENING', 'INITIAL_SCREENING',
            'Strong laboratory background from NHLS. 5 years microbiology experience. Qualification is in Biotechnology — meets NQF 6 requirement. Water sector knowledge less specific but transferable. Recommend for interview.',
            'With 5 years at the National Health Laboratory Service specialising in microbiological testing, I have extensive experience with aseptic techniques and quality control protocols. I am looking to apply my skills in the water sector and am excited by the opportunity at uThukela Water.',
            'Career Portal', NOW() - INTERVAL '12 days', 3)
    RETURNING id INTO v_app_wqt_screened2;

    -- ---- PIPELINE STAGE: INTERVIEWED (FIRST_INTERVIEW / INTERVIEW_SCHEDULED + INTERVIEW_COMPLETED) — 2 applicants ----
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, interview_feedback, cover_letter, application_source, submitted_at, interviewed_at, rating)
    VALUES (v_tenant_id, v_bheki, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'INTERVIEW_COMPLETED', 'FIRST_INTERVIEW',
            'DWS environmental technician — 4 years experience. N.Dip Environmental Science. SANS 241 knowledge confirmed. Strong references from DWS regional manager.',
            'Solid technical foundation. Good understanding of catchment-to-tap water quality chain. Presented well on Blue Drop framework. Slightly weaker on laboratory instrumentation specifics. Recommended for second round.',
            'Having spent 4 years at DWS monitoring water quality across the uThukela catchment area, I have deep knowledge of the local water resources. I hold an N.Dip in Environmental Science and have contributed to several Blue Drop assessments. I would welcome the chance to work more directly in the laboratory.',
            'LinkedIn', NOW() - INTERVAL '18 days', NOW() - INTERVAL '7 days', 4)
    RETURNING id INTO v_app_wqt_interv1;

    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, interview_feedback, cover_letter, application_source, submitted_at, interviewed_at, rating)
    VALUES (v_tenant_id, v_sindisiwe, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'INTERVIEW_COMPLETED', 'FIRST_INTERVIEW',
            'QC Officer at Umgeni Water — 6 years. N.Dip Analytical Chemistry + B.Tech Water Care. Blue Drop experience. Overqualified for the role but has expressed strong interest. Interview to assess fit.',
            'Excellent candidate. Deep water quality expertise and Blue Drop audit experience. Managed a team of 3 at Umgeni Water. Articulate and professional. Concern: may be overqualified — discussed career growth path and she confirmed interest in leading uThukela''s lab long-term. Strongly recommended.',
            'As a quality control officer at Umgeni Water with 6 years of experience, I have managed water quality monitoring programmes across multiple treatment works. I hold a B.Tech in Water Care and have led Blue Drop audit preparations. I am relocating to Dundee for family reasons and am eager to join uThukela Water''s team.',
            'Referral', NOW() - INTERVAL '19 days', NOW() - INTERVAL '6 days', 5)
    RETURNING id INTO v_app_wqt_interv2;

    -- Interviews for the interviewed candidates
    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_wqt_interv1, 'First Interview - Bheki Majola (Water Quality Technician)', 'IN_PERSON', 'FIRST', 'COMPLETED',
            NOW() - INTERVAL '7 days', 60, 'uThukela Water Head Office, Ladysmith',
            'Senzo Dladla', 'senzo.dladla@uthukela.gov.za',
            'Solid technical foundation. Good understanding of catchment-to-tap water quality chain. Presented well on Blue Drop framework. Slightly weaker on laboratory instrumentation specifics. Recommended for second round.',
            4, 'ANOTHER_ROUND', NOW() - INTERVAL '7 days');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_wqt_interv2, 'First Interview - Sindisiwe Mthiyane (Water Quality Technician)', 'IN_PERSON', 'FIRST', 'COMPLETED',
            NOW() - INTERVAL '6 days', 60, 'uThukela Water Head Office, Ladysmith',
            'Senzo Dladla', 'senzo.dladla@uthukela.gov.za',
            'Excellent candidate. Deep water quality expertise and Blue Drop audit experience. Managed a team of 3 at Umgeni Water. Concern about overqualification addressed — she wants to lead the lab long-term. Strongly recommended.',
            5, 'HIRE', NOW() - INTERVAL '6 days');

    -- ---- PIPELINE STAGE: SHORTLISTED (SECOND_INTERVIEW / INTERVIEW_COMPLETED) — 1 applicant ----
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, interview_feedback, cover_letter, application_source, submitted_at, interviewed_at, rating)
    VALUES (v_tenant_id, v_phiwokuhle, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'INTERVIEW_COMPLETED', 'SECOND_INTERVIEW',
            'Water Quality Analyst at Midvaal Water — 5 years. N.Dip Analytical Chemistry. Strong SANS 241 and SCADA knowledge. Excellent references.',
            'Outstanding candidate. First interview was exceptional — strong on both theory and practical. Second panel interview confirmed depth of knowledge. Unanimous shortlist recommendation. Final references outstanding from Midvaal Water. Top pick for position 1.',
            'With 5 years at Midvaal Water Company as a Water Quality Analyst, I have comprehensive experience in drinking water analysis, compliance reporting, and chemical dosing optimisation. I hold an N.Dip in Analytical Chemistry and am passionate about ensuring safe water for communities. I am relocating to Ladysmith and this role aligns perfectly with my career goals.',
            'Career Portal', NOW() - INTERVAL '20 days', NOW() - INTERVAL '4 days', 5)
    RETURNING id INTO v_app_wqt_short1;

    -- Two interviews for shortlisted candidate
    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_wqt_short1, 'First Interview - Phiwokuhle Hadebe (Water Quality Technician)', 'IN_PERSON', 'FIRST', 'COMPLETED',
            NOW() - INTERVAL '12 days', 60, 'uThukela Water Head Office, Ladysmith',
            'Senzo Dladla', 'senzo.dladla@uthukela.gov.za',
            'Exceptional knowledge of water quality analysis. Practical experience with jar testing and chemical dosing very relevant. Articulate and confident. Strongly recommended for panel interview.',
            5, 'ANOTHER_ROUND', NOW() - INTERVAL '12 days');

    INSERT INTO interviews (tenant_id, application_id, title, type, round, status, scheduled_at, duration_minutes, location, interviewer_name, interviewer_email, additional_interviewers, feedback, rating, recommendation, completed_at)
    VALUES (v_tenant_id, v_app_wqt_short1, 'Panel Interview - Phiwokuhle Hadebe (Water Quality Technician)', 'PANEL', 'PANEL', 'COMPLETED',
            NOW() - INTERVAL '4 days', 90, 'uThukela Water Head Office, Ladysmith',
            'John van Wyk', 'john.vanwyk@uthukela.gov.za', 'Senzo Dladla, Nomvula Nzimande',
            'Panel unanimously impressed. Demonstrated deep practical knowledge of SANS 241, Blue Drop, and laboratory management. Excellent communication skills and clear career vision. Shortlisted for appointment — position 1 of 2.',
            5, 'HIRE', NOW() - INTERVAL '4 days');

    -- ---- REJECTED — 1 applicant (does not meet minimum requirements) ----
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, rejection_reason, cover_letter, application_source, submitted_at, rating)
    VALUES (v_tenant_id, v_kwanele, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'REJECTED', 'REJECTED',
            'Does not meet minimum qualification requirement. No NQF Level 6 in relevant field. No laboratory experience. Current role is general worker.',
            'Application does not meet the minimum requirements for this position. The role requires an NQF Level 6 qualification in Analytical Chemistry, Biotechnology, or Water Care, and minimum 2 years laboratory experience. We encourage you to consider the Artisan/General Worker vacancies.',
            'I am a hard worker currently at Maluti-a-Phofung Municipality. I have always wanted to work in water quality and am willing to learn. I have a matric certificate with mathematics.',
            'Career Portal', NOW() - INTERVAL '15 days', 1)
    RETURNING id INTO v_app_wqt_reject1;

    -- ---- WITHDRAWN — 1 applicant (accepted another offer) ----
    INSERT INTO applications (tenant_id, applicant_id, job_posting_id, job_title, department, status, pipeline_stage, screening_notes, cover_letter, application_source, submitted_at, withdrawn_at, withdrawal_reason, rating)
    VALUES (v_tenant_id, v_dumisani, v_jp_wqt, 'Water Quality Technician', 'Water Services', 'WITHDRAWN', 'WITHDRAWN',
            'UKZN lab technician — 2 years. B.Sc Chemistry. Academic background strong but limited water sector experience. Scheduled for screening call.',
            'As a laboratory technician in the UKZN Chemistry Department, I have developed strong analytical skills working with advanced instrumentation. I am looking to transition from academia to applied water quality work and am excited about this role at uThukela Water.',
            'LinkedIn', NOW() - INTERVAL '16 days', NOW() - INTERVAL '8 days',
            'Thank you for considering my application. I have accepted a position at Umgeni Water that was offered before my interview with uThukela. I wish you well with the recruitment.', 3)
    RETURNING id INTO v_app_wqt_withdraw1;

    RAISE NOTICE 'Created open recruitment: Water Quality Technician — 10 applicants across full pipeline';

    -- ============================================================
    -- TIER 9: EMPLOYEES (10 full profiles)
    -- 6 matching the demo user accounts + 4 additional staff
    -- ============================================================

    -- 1. Thandi Moyo — Employee / Water Meter Reader
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date, probation_end_date,
        cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-001', 'Ms', 'Thandi', 'Moyo', 'Thandi',
        'thandi.moyo@uthukela.gov.za', 'thandi.m@gmail.com', '+27 36 637 0001', '+27 72 100 0001',
        '1994-03-15', 'Female', 'African', 'None', 'Citizen', 'South African', 'Single',
        '9403150001081', 'SA_ID', '0123456789',
        'FNB', '260550', '62890001001',
        '14 Murchison Street, Ladysmith, 3370', 'PO Box 3014, Ladysmith, 3370', 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Operations', 'Meter Reading', 'Water Meter Reader', 'T8', 'PERMANENT',
        '2022-06-01', '2022-12-01',
        'CC-OPS-001', 'Ladysmith', 'Head Office', 0,
        'Siphiwe Moyo', '+27 72 100 9001', 'Mother',
        TRUE, NOW() - INTERVAL '2 years'
    ) RETURNING id INTO v_emp_moyo;

    -- 2. John van Wyk — Hiring Manager / Operations Manager
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-002', 'Mr', 'John', 'van Wyk', 'John',
        'john.vanwyk@uthukela.gov.za', 'jvw.personal@outlook.com', '+27 36 637 0002', '+27 83 200 0002',
        '1978-11-22', 'Male', 'White', 'None', 'Citizen', 'South African', 'Married',
        '7811225001085', 'SA_ID', '9876543210',
        'Standard Bank', '051001', '00230002002',
        '8 King Street, Ladysmith, 3370', 'PO Box 1122, Ladysmith, 3370', 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Operations', NULL, 'Operations Manager', 'D3', 'PERMANENT',
        '2015-02-01',
        'CC-OPS-001', 'Ladysmith', 'Head Office', 2,
        'Elaine van Wyk', '+27 83 200 9002', 'Spouse',
        TRUE, NOW() - INTERVAL '9 years'
    ) RETURNING id INTO v_emp_vanwyk;

    -- 3. Nomvula Nzimande — HR Manager
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-003', 'Ms', 'Nomvula', 'Nzimande', 'Nomvula',
        'nomvula.nzimande@uthukela.gov.za', 'nomvula.n@yahoo.com', '+27 36 637 0003', '+27 61 300 0003',
        '1985-07-28', 'Female', 'African', 'None', 'Citizen', 'South African', 'Married',
        '8507280002087', 'SA_ID', '2345678901',
        'Nedbank', '198765', '10030003003',
        '22 Lyell Street, Ladysmith, 3370', 'PO Box 555, Ladysmith, 3370', 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Corporate Services', 'Human Resources', 'HR Manager', 'D2', 'PERMANENT',
        '2017-08-01',
        'CC-CORP-001', 'Ladysmith', 'Head Office', 1,
        'Mandla Nzimande', '+27 61 300 9003', 'Spouse',
        TRUE, NOW() - INTERVAL '7 years'
    ) RETURNING id INTO v_emp_nzimande;

    -- 4. Ayesha Pillay — Recruiter / Talent Acquisition Specialist
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date, probation_end_date,
        reporting_manager_id, cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-004', 'Ms', 'Ayesha', 'Pillay', 'Ayesha',
        'ayesha.pillay@uthukela.gov.za', 'ayesha.pillay@hotmail.com', '+27 36 637 0004', '+27 76 400 0004',
        '1992-01-09', 'Female', 'Indian', 'None', 'Citizen', 'South African', 'Single',
        '9201090003083', 'SA_ID', '3456789012',
        'Capitec', '470010', '12040004004',
        '5 Forbes Street, Ladysmith, 3370', NULL, 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Corporate Services', 'Human Resources', 'Talent Acquisition Specialist', 'T10', 'PERMANENT',
        '2023-03-01', '2023-09-01',
        v_emp_nzimande, 'CC-CORP-001', 'Ladysmith', 'Head Office', 0,
        'Vikash Pillay', '+27 76 400 9004', 'Father',
        TRUE, NOW() - INTERVAL '1 year'
    ) RETURNING id INTO v_emp_pillay;

    -- 5. Pieter Botha — System Admin / IT Systems Administrator
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-005', 'Mr', 'Pieter', 'Botha', 'Pieter',
        'pieter.botha@uthukela.gov.za', 'pieter.b@gmail.com', '+27 36 637 0005', '+27 82 500 0005',
        '1983-05-12', 'Male', 'White', 'None', 'Citizen', 'South African', 'Married',
        '8305125002089', 'SA_ID', '4567890123',
        'ABSA', '632005', '40750005005',
        '31 Queen Street, Ladysmith, 3370', 'PO Box 808, Ladysmith, 3370', 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Corporate Services', 'Information Technology', 'IT Systems Administrator', 'D1', 'PERMANENT',
        '2016-04-01',
        'CC-CORP-002', 'Ladysmith', 'Head Office', 3,
        'Marinda Botha', '+27 82 500 9005', 'Spouse',
        TRUE, NOW() - INTERVAL '8 years'
    ) RETURNING id INTO v_emp_botha;

    -- 6. Sizwe Mthembu — Executive / Municipal Manager
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-006', 'Mr', 'Sizwe', 'Mthembu', 'Sizwe',
        'sizwe.mthembu@uthukela.gov.za', 'sizwe.mthembu@icloud.com', '+27 36 637 0006', '+27 84 600 0006',
        '1972-09-03', 'Male', 'African', 'None', 'Citizen', 'South African', 'Married',
        '7209035003082', 'SA_ID', '5678901234',
        'FNB', '260550', '62890006006',
        '1 Protea Lane, Ladysmith, 3370', 'Private Bag X9012, Ladysmith, 3370', 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Corporate Services', 'Executive Office', 'Municipal Manager', 'MM', 'PERMANENT',
        '2013-07-01',
        'CC-EXEC-001', 'Ladysmith', 'Head Office', 3,
        'Ntombi Mthembu', '+27 84 600 9006', 'Spouse',
        TRUE, NOW() - INTERVAL '11 years'
    ) RETURNING id INTO v_emp_mthembu;

    -- 7. Senzo Dladla — Senior Process Controller (Water Services)
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        reporting_manager_id, cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-007', 'Mr', 'Senzo', 'Dladla', 'Senzo',
        'senzo.dladla@uthukela.gov.za', 'senzo.d@gmail.com', '+27 36 637 0007', '+27 71 700 0007',
        '1988-12-04', 'Male', 'African', 'None', 'Citizen', 'South African', 'Married',
        '8812045004086', 'SA_ID', '6789012345',
        'Standard Bank', '051001', '00230007007',
        '9 Tugela Road, Ladysmith, 3370', NULL, 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Water Services', 'Water Treatment', 'Senior Process Controller', 'T10', 'PERMANENT',
        '2018-01-15',
        v_emp_vanwyk, 'CC-WAT-001', 'Ladysmith', 'Ladysmith WTW', 2,
        'Bongiwe Dladla', '+27 71 700 9007', 'Spouse',
        TRUE, NOW() - INTERVAL '6 years'
    ) RETURNING id INTO v_emp_dladla;

    -- 8. Prashna Govender — Finance Officer
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-008', 'Mrs', 'Prashna', 'Govender', 'Prash',
        'prashna.govender@uthukela.gov.za', 'prashna.g@outlook.co.za', '+27 36 637 0008', '+27 73 800 0008',
        '1990-04-18', 'Female', 'Indian', 'None', 'Citizen', 'South African', 'Married',
        '9004180005088', 'SA_ID', '7890123456',
        'Nedbank', '198765', '10030008008',
        '17 Albert Street, Ladysmith, 3370', 'PO Box 221, Ladysmith, 3370', 'Ladysmith', 'KwaZulu-Natal', '3370', 'South Africa',
        'ACTIVE', 'Finance', 'Revenue Management', 'Finance Officer', 'T11', 'PERMANENT',
        '2020-09-01',
        'CC-FIN-001', 'Ladysmith', 'Head Office', 1,
        'Rajan Govender', '+27 73 800 9008', 'Spouse',
        TRUE, NOW() - INTERVAL '4 years'
    ) RETURNING id INTO v_emp_govender;

    -- 9. Lungile Mabaso — Artisan Plumber (Technical Services) — on probation
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date, probation_end_date,
        reporting_manager_id, cost_centre, location, site, number_of_dependants,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-009', 'Mr', 'Lungile', 'Mabaso', 'Lungi',
        'lungile.mabaso@uthukela.gov.za', 'lungi.mabaso@gmail.com', '+27 36 352 0009', '+27 68 900 0009',
        '1996-08-21', 'Male', 'African', 'None', 'Citizen', 'South African', 'Single',
        '9608215006084', 'SA_ID', '8901234567',
        'Capitec', '470010', '12040009009',
        '3 Harding Street, Estcourt, 3310', NULL, 'Estcourt', 'KwaZulu-Natal', '3310', 'South Africa',
        'PROBATION', 'Technical Services', 'Reticulation Maintenance', 'Artisan Plumber', 'T8', 'PERMANENT',
        '2025-11-01', '2026-05-01',
        v_emp_vanwyk, 'CC-TECH-001', 'Estcourt', 'Estcourt Depot', 0,
        'Zinhle Mabaso', '+27 68 900 9009', 'Sister',
        TRUE, NOW() - INTERVAL '4 months'
    ) RETURNING id INTO v_emp_mabaso;

    -- 10. Nkosinathi Radebe — Community Liaison Officer (Community Services)
    INSERT INTO employees (
        tenant_id, employee_number, title, first_name, last_name, preferred_name,
        email, personal_email, phone, mobile_phone,
        date_of_birth, gender, race, disability_status, citizenship_status, nationality, marital_status,
        id_number, id_type, tax_number,
        bank_name, bank_branch_code, bank_account_number,
        physical_address, postal_address, city, province, postal_code, country,
        status, department, division, job_title, job_grade, employment_type,
        hire_date,
        cost_centre, location, site, number_of_dependants, union_membership,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        demographics_consent, demographics_consent_date
    ) VALUES (
        v_tenant_id, 'UTW-010', 'Mr', 'Nkosinathi', 'Radebe', 'Nathi',
        'nkosinathi.radebe@uthukela.gov.za', 'nathi.radebe@gmail.com', '+27 36 448 0010', '+27 65 100 0010',
        '1991-06-30', 'Male', 'African', 'None', 'Citizen', 'South African', 'Married',
        '9106305007080', 'SA_ID', '9012345678',
        'FNB', '260550', '62890010010',
        '21 Bergville Road, Bergville, 3350', 'PO Box 88, Bergville, 3350', 'Bergville', 'KwaZulu-Natal', '3350', 'South Africa',
        'ACTIVE', 'Community Services', 'Community Liaison', 'Community Liaison Officer', 'T9', 'PERMANENT',
        '2019-03-01',
        'CC-COMM-001', 'Bergville', 'Bergville Office', 2, 'SAMWU',
        'Nosipho Radebe', '+27 65 100 9010', 'Spouse',
        TRUE, NOW() - INTERVAL '5 years'
    ) RETURNING id INTO v_emp_radebe;

    -- Set reporting managers now that all employees exist
    UPDATE employees SET reporting_manager_id = v_emp_vanwyk WHERE id = v_emp_moyo AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_mthembu WHERE id = v_emp_vanwyk AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_mthembu WHERE id = v_emp_nzimande AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_nzimande WHERE id = v_emp_pillay AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_mthembu WHERE id = v_emp_botha AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_vanwyk WHERE id = v_emp_dladla AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_nzimande WHERE id = v_emp_govender AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_vanwyk WHERE id = v_emp_mabaso AND tenant_id = v_tenant_id;
    UPDATE employees SET reporting_manager_id = v_emp_vanwyk WHERE id = v_emp_radebe AND tenant_id = v_tenant_id;

    RAISE NOTICE 'Created 10 employee profiles with org hierarchy';

    -- ============================================================
    -- TIER 10: EMPLOYMENT EVENTS (hire events + promotions/transfers)
    -- ============================================================

    -- Hire events for all 10 employees
    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_moyo, 'HIRE', '2022-06-01', '2022-06-01', 'New hire — Water Meter Reader, Operations', 'Operations', 'Water Meter Reader', 'T8', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_vanwyk, 'HIRE', '2015-02-01', '2015-02-01', 'New hire — Assistant Operations Manager', 'Operations', 'Assistant Operations Manager', 'D1', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_nzimande, 'HIRE', '2017-08-01', '2017-08-01', 'New hire — HR Officer, Corporate Services', 'Corporate Services', 'HR Officer', 'T11', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_pillay, 'HIRE', '2023-03-01', '2023-03-01', 'New hire — Talent Acquisition Specialist', 'Corporate Services', 'Talent Acquisition Specialist', 'T10', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_botha, 'HIRE', '2016-04-01', '2016-04-01', 'New hire — IT Administrator', 'Corporate Services', 'IT Administrator', 'T12', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_mthembu, 'HIRE', '2013-07-01', '2013-07-01', 'New hire — Director: Corporate Services', 'Corporate Services', 'Director: Corporate Services', 'D4', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_dladla, 'HIRE', '2018-01-15', '2018-01-15', 'New hire — Process Controller, Water Treatment', 'Water Services', 'Process Controller', 'T8', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_govender, 'HIRE', '2020-09-01', '2020-09-01', 'New hire — Finance Officer, Revenue Management', 'Finance', 'Finance Officer', 'T11', 'Ladysmith', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_mabaso, 'HIRE', '2025-11-01', '2025-11-01', 'New hire — Artisan Plumber, Reticulation Maintenance', 'Technical Services', 'Artisan Plumber', 'T8', 'Estcourt', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description, new_department, new_job_title, new_job_grade, new_location, recorded_by)
    VALUES (v_tenant_id, v_emp_radebe, 'HIRE', '2019-03-01', '2019-03-01', 'New hire — Community Liaison Officer', 'Community Services', 'Community Liaison Officer', 'T9', 'Bergville', 'System');

    -- Promotions
    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description,
        previous_job_title, new_job_title, previous_job_grade, new_job_grade, recorded_by)
    VALUES (v_tenant_id, v_emp_vanwyk, 'PROMOTION', '2019-07-01', '2019-07-01',
        'Promoted to Operations Manager after 4 years of strong performance and completion of MBL programme',
        'Assistant Operations Manager', 'Operations Manager', 'D1', 'D3', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description,
        previous_job_title, new_job_title, previous_job_grade, new_job_grade, recorded_by)
    VALUES (v_tenant_id, v_emp_nzimande, 'PROMOTION', '2021-01-01', '2021-01-01',
        'Promoted to HR Manager following successful implementation of new recruitment process',
        'HR Officer', 'HR Manager', 'T11', 'D2', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description,
        previous_job_title, new_job_title, previous_job_grade, new_job_grade, recorded_by)
    VALUES (v_tenant_id, v_emp_botha, 'PROMOTION', '2020-04-01', '2020-04-01',
        'Promoted to IT Systems Administrator after leading successful SCADA network upgrade',
        'IT Administrator', 'IT Systems Administrator', 'T12', 'D1', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description,
        previous_job_title, new_job_title, previous_job_grade, new_job_grade, recorded_by)
    VALUES (v_tenant_id, v_emp_mthembu, 'PROMOTION', '2018-01-01', '2018-01-01',
        'Appointed Municipal Manager following council resolution',
        'Director: Corporate Services', 'Municipal Manager', 'D4', 'MM', 'System');

    INSERT INTO employment_events (tenant_id, employee_id, event_type, event_date, effective_date, description,
        previous_job_title, new_job_title, previous_job_grade, new_job_grade, recorded_by)
    VALUES (v_tenant_id, v_emp_dladla, 'PROMOTION', '2022-07-01', '2022-07-01',
        'Promoted to Senior Process Controller after obtaining NQF Level 4 Water Treatment certificate',
        'Process Controller', 'Senior Process Controller', 'T8', 'T10', 'System');

    RAISE NOTICE 'Created employment events (hires + promotions)';

    -- ============================================================
    -- TIER 11: EMPLOYEE DOCUMENTS (qualifications, contracts, IDs)
    -- ============================================================

    -- Thandi Moyo
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_moyo, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'moyo_id.pdf', 's3://uthukela-docs/employees/UTW-001/moyo_id.pdf', 245000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_moyo, 'QUALIFICATION', 'National Diploma: Water Care', 'DUT — National Diploma in Water Care (2016)', 'moyo_diploma.pdf', 's3://uthukela-docs/employees/UTW-001/moyo_diploma.pdf', 512000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_moyo, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2022-06-01', 'moyo_contract.pdf', 's3://uthukela-docs/employees/UTW-001/moyo_contract.pdf', 189000, 'application/pdf', 'System');

    -- John van Wyk
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_vanwyk, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'vanwyk_id.pdf', 's3://uthukela-docs/employees/UTW-002/vanwyk_id.pdf', 230000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_vanwyk, 'QUALIFICATION', 'B.Eng Civil Engineering (UCT)', 'University of Cape Town — B.Eng Civil Engineering (2001)', 'vanwyk_beng.pdf', 's3://uthukela-docs/employees/UTW-002/vanwyk_beng.pdf', 498000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_vanwyk, 'QUALIFICATION', 'MBL (UNISA SBL)', 'UNISA School of Business Leadership — Master of Business Leadership (2018)', 'vanwyk_mbl.pdf', 's3://uthukela-docs/employees/UTW-002/vanwyk_mbl.pdf', 534000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_vanwyk, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2015-02-01', 'vanwyk_contract.pdf', 's3://uthukela-docs/employees/UTW-002/vanwyk_contract.pdf', 201000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by, expiry_date)
    VALUES (v_tenant_id, v_emp_vanwyk, 'TRAINING_CERTIFICATE', 'ECSA Pr.Eng Certificate', 'Professional Engineer registration with ECSA', 'vanwyk_ecsa.pdf', 's3://uthukela-docs/employees/UTW-002/vanwyk_ecsa.pdf', 156000, 'application/pdf', 'System', '2027-03-31');

    -- Nomvula Nzimande
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_nzimande, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'nzimande_id.pdf', 's3://uthukela-docs/employees/UTW-003/nzimande_id.pdf', 240000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_nzimande, 'QUALIFICATION', 'B.Com Honours in HRM (UKZN)', 'University of KwaZulu-Natal — B.Com Honours Human Resource Management (2009)', 'nzimande_bcom.pdf', 's3://uthukela-docs/employees/UTW-003/nzimande_bcom.pdf', 476000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_nzimande, 'QUALIFICATION', 'Postgrad Diploma Labour Law (UFS)', 'University of the Free State — Postgraduate Diploma in Labour Law (2015)', 'nzimande_pglabour.pdf', 's3://uthukela-docs/employees/UTW-003/nzimande_pglabour.pdf', 389000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_nzimande, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2017-08-01', 'nzimande_contract.pdf', 's3://uthukela-docs/employees/UTW-003/nzimande_contract.pdf', 195000, 'application/pdf', 'System');

    -- Ayesha Pillay
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_pillay, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'pillay_id.pdf', 's3://uthukela-docs/employees/UTW-004/pillay_id.pdf', 235000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_pillay, 'QUALIFICATION', 'BA Industrial Psychology (UKZN)', 'University of KwaZulu-Natal — BA Industrial Psychology (2014)', 'pillay_ba.pdf', 's3://uthukela-docs/employees/UTW-004/pillay_ba.pdf', 456000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_pillay, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2023-03-01', 'pillay_contract.pdf', 's3://uthukela-docs/employees/UTW-004/pillay_contract.pdf', 187000, 'application/pdf', 'System');

    -- Pieter Botha
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_botha, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'botha_id.pdf', 's3://uthukela-docs/employees/UTW-005/botha_id.pdf', 228000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_botha, 'QUALIFICATION', 'B.Sc Computer Science (UP)', 'University of Pretoria — B.Sc Computer Science (2005)', 'botha_bsc.pdf', 's3://uthukela-docs/employees/UTW-005/botha_bsc.pdf', 467000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by, expiry_date)
    VALUES (v_tenant_id, v_emp_botha, 'TRAINING_CERTIFICATE', 'ITIL Foundation v4 Certificate', 'ITIL 4 Foundation — Axelos (2023)', 'botha_itil.pdf', 's3://uthukela-docs/employees/UTW-005/botha_itil.pdf', 178000, 'application/pdf', 'System', '2028-06-30');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_botha, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2016-04-01', 'botha_contract.pdf', 's3://uthukela-docs/employees/UTW-005/botha_contract.pdf', 198000, 'application/pdf', 'System');

    -- Sizwe Mthembu
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mthembu, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'mthembu_id.pdf', 's3://uthukela-docs/employees/UTW-006/mthembu_id.pdf', 242000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mthembu, 'QUALIFICATION', 'MBA (Wits Business School)', 'University of the Witwatersrand — Master of Business Administration (2010)', 'mthembu_mba.pdf', 's3://uthukela-docs/employees/UTW-006/mthembu_mba.pdf', 543000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mthembu, 'QUALIFICATION', 'B.Admin (University of Zululand)', 'University of Zululand — Bachelor of Administration (2000)', 'mthembu_badmin.pdf', 's3://uthukela-docs/employees/UTW-006/mthembu_badmin.pdf', 412000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mthembu, 'CONTRACT', 'Employment Contract', 'Section 57 fixed-term contract — Municipal Manager appointment', 'mthembu_contract.pdf', 's3://uthukela-docs/employees/UTW-006/mthembu_contract.pdf', 267000, 'application/pdf', 'System');

    -- Senzo Dladla
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_dladla, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'dladla_id.pdf', 's3://uthukela-docs/employees/UTW-007/dladla_id.pdf', 238000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_dladla, 'QUALIFICATION', 'N.Dip Water Treatment (Umfolozi TVET)', 'Umfolozi TVET College — National Diploma Water Treatment Practice (2017)', 'dladla_ndip.pdf', 's3://uthukela-docs/employees/UTW-007/dladla_ndip.pdf', 489000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by, expiry_date)
    VALUES (v_tenant_id, v_emp_dladla, 'TRAINING_CERTIFICATE', 'Water Treatment NQF Level 4', 'EWSETA registered — Water and Wastewater Treatment Process Controller NQF 4', 'dladla_nqf4.pdf', 's3://uthukela-docs/employees/UTW-007/dladla_nqf4.pdf', 167000, 'application/pdf', 'System', '2027-12-31');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_dladla, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2018-01-15', 'dladla_contract.pdf', 's3://uthukela-docs/employees/UTW-007/dladla_contract.pdf', 192000, 'application/pdf', 'System');

    -- Prashna Govender
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_govender, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'govender_id.pdf', 's3://uthukela-docs/employees/UTW-008/govender_id.pdf', 237000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_govender, 'QUALIFICATION', 'B.Com Accounting (UKZN)', 'University of KwaZulu-Natal — B.Com Accounting (2012)', 'govender_bcom.pdf', 's3://uthukela-docs/employees/UTW-008/govender_bcom.pdf', 478000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by, expiry_date)
    VALUES (v_tenant_id, v_emp_govender, 'TRAINING_CERTIFICATE', 'mSCOA Practitioner Certificate', 'Municipal Standard Chart of Accounts — National Treasury (2021)', 'govender_mscoa.pdf', 's3://uthukela-docs/employees/UTW-008/govender_mscoa.pdf', 145000, 'application/pdf', 'System', '2026-12-31');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_govender, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2020-09-01', 'govender_contract.pdf', 's3://uthukela-docs/employees/UTW-008/govender_contract.pdf', 190000, 'application/pdf', 'System');

    -- Lungile Mabaso
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mabaso, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'mabaso_id.pdf', 's3://uthukela-docs/employees/UTW-009/mabaso_id.pdf', 233000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mabaso, 'QUALIFICATION', 'Trade Certificate: Plumbing (NQF 4)', 'Majuba TVET College — Trade Certificate Plumbing (2018)', 'mabaso_trade.pdf', 's3://uthukela-docs/employees/UTW-009/mabaso_trade.pdf', 356000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by, expiry_date)
    VALUES (v_tenant_id, v_emp_mabaso, 'TRAINING_CERTIFICATE', 'PIRB Registration Certificate', 'Plumbing Industry Registration Board — registered plumber', 'mabaso_pirb.pdf', 's3://uthukela-docs/employees/UTW-009/mabaso_pirb.pdf', 134000, 'application/pdf', 'System', '2027-06-30');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mabaso, 'CONTRACT', 'Employment Contract', 'Permanent employment contract with 6-month probation — effective 2025-11-01', 'mabaso_contract.pdf', 's3://uthukela-docs/employees/UTW-009/mabaso_contract.pdf', 194000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_mabaso, 'MEDICAL', 'Pre-employment Medical Certificate', 'Occupational health assessment — fit for duty', 'mabaso_medical.pdf', 's3://uthukela-docs/employees/UTW-009/mabaso_medical.pdf', 178000, 'application/pdf', 'System');

    -- Nkosinathi Radebe
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_radebe, 'ID_DOCUMENT', 'SA ID Document', 'Certified copy of South African ID', 'radebe_id.pdf', 's3://uthukela-docs/employees/UTW-010/radebe_id.pdf', 241000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_radebe, 'QUALIFICATION', 'Diploma Public Administration (MUT)', 'Mangosuthu University of Technology — Diploma in Public Administration (2014)', 'radebe_diploma.pdf', 's3://uthukela-docs/employees/UTW-010/radebe_diploma.pdf', 434000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_radebe, 'QUALIFICATION', 'Certificate: Conflict Resolution (UNISA)', 'UNISA — Short Course in Conflict Resolution and Mediation (2020)', 'radebe_conflict.pdf', 's3://uthukela-docs/employees/UTW-010/radebe_conflict.pdf', 267000, 'application/pdf', 'System');
    INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, description, filename, file_url, file_size, content_type, uploaded_by)
    VALUES (v_tenant_id, v_emp_radebe, 'CONTRACT', 'Employment Contract', 'Permanent employment contract — effective 2019-03-01', 'radebe_contract.pdf', 's3://uthukela-docs/employees/UTW-010/radebe_contract.pdf', 191000, 'application/pdf', 'System');

    RAISE NOTICE 'Created employee documents (IDs, qualifications, contracts, certificates)';

    -- ============================================================
    -- TIER 12: SKILLS (water utility relevant)
    -- ============================================================
    INSERT INTO skills (tenant_id, name, code, category) VALUES
        (v_tenant_id, 'Water Treatment Operations', 'water-treatment-ops', 'TECHNICAL'),
        (v_tenant_id, 'SANS 241 Compliance', 'sans-241', 'TECHNICAL'),
        (v_tenant_id, 'SCADA Systems', 'scada', 'TECHNICAL'),
        (v_tenant_id, 'Blue Drop Audit', 'blue-drop', 'DOMAIN'),
        (v_tenant_id, 'Plumbing & Pipe Fitting', 'plumbing', 'TECHNICAL'),
        (v_tenant_id, 'Leak Detection', 'leak-detection', 'TECHNICAL'),
        (v_tenant_id, 'Water Reticulation', 'water-reticulation', 'TECHNICAL'),
        (v_tenant_id, 'Hydraulic Modelling', 'hydraulic-modelling', 'TECHNICAL'),
        (v_tenant_id, 'GIS Mapping', 'gis-mapping', 'TECHNICAL'),
        (v_tenant_id, 'Chemical Dosing', 'chemical-dosing', 'TECHNICAL'),
        (v_tenant_id, 'Municipal Finance (MFMA)', 'mfma', 'DOMAIN'),
        (v_tenant_id, 'mSCOA Standards', 'mscoa', 'DOMAIN'),
        (v_tenant_id, 'GRAP Accounting', 'grap', 'DOMAIN'),
        (v_tenant_id, 'Revenue Management', 'revenue-mgmt', 'DOMAIN'),
        (v_tenant_id, 'Municipal Billing Systems', 'billing-systems', 'TECHNICAL'),
        (v_tenant_id, 'Community Engagement', 'community-engagement', 'SOFT_SKILL'),
        (v_tenant_id, 'IsiZulu (Fluent)', 'isizulu', 'SOFT_SKILL'),
        (v_tenant_id, 'Public Participation', 'public-participation', 'DOMAIN'),
        (v_tenant_id, 'Conflict Resolution', 'conflict-resolution', 'SOFT_SKILL'),
        (v_tenant_id, 'OHS Act Compliance', 'ohs-compliance', 'DOMAIN'),
        (v_tenant_id, 'Project Management', 'project-management', 'DOMAIN'),
        (v_tenant_id, 'IT Infrastructure', 'it-infrastructure', 'TECHNICAL'),
        (v_tenant_id, 'Network Administration', 'network-admin', 'TECHNICAL'),
        (v_tenant_id, 'ITIL Service Management', 'itil', 'DOMAIN'),
        (v_tenant_id, 'Labour Relations', 'labour-relations', 'DOMAIN'),
        (v_tenant_id, 'Talent Acquisition', 'talent-acquisition', 'DOMAIN'),
        (v_tenant_id, 'Batho Pele Principles', 'batho-pele', 'DOMAIN'),
        (v_tenant_id, 'Leadership', 'leadership', 'SOFT_SKILL'),
        (v_tenant_id, 'Report Writing', 'report-writing', 'SOFT_SKILL'),
        (v_tenant_id, 'Stakeholder Management', 'stakeholder-mgmt', 'SOFT_SKILL')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded 30 water-utility skills';

    -- ============================================================
    -- TIER 13: LEAVE TYPES (per BCEA & municipal collective agreement)
    -- ============================================================
    INSERT INTO leave_types (tenant_id, name, code, description, default_days_per_year, max_carry_forward_days, requires_medical_certificate, medical_cert_threshold_days, is_paid, color_code)
    VALUES (v_tenant_id, 'Annual Leave', 'ANNUAL', 'Paid annual leave as per Basic Conditions of Employment Act — 21 consecutive days (15 working days) per cycle', 15, 5, FALSE, NULL, TRUE, '#2d3192')
    RETURNING id INTO v_lt_annual;

    INSERT INTO leave_types (tenant_id, name, code, description, default_days_per_year, max_carry_forward_days, requires_medical_certificate, medical_cert_threshold_days, is_paid, color_code)
    VALUES (v_tenant_id, 'Sick Leave', 'SICK', 'Paid sick leave — 30 days over 3-year cycle (10 per annum equivalent). Medical certificate required for >2 consecutive days', 10, 0, TRUE, 2, TRUE, '#DC2626')
    RETURNING id INTO v_lt_sick;

    INSERT INTO leave_types (tenant_id, name, code, description, default_days_per_year, max_carry_forward_days, requires_medical_certificate, medical_cert_threshold_days, is_paid, color_code)
    VALUES (v_tenant_id, 'Family Responsibility Leave', 'FAMILY', 'Paid family responsibility leave — 3 days per annum for birth, illness, or death of close family member', 3, 0, FALSE, NULL, TRUE, '#F59E0B')
    RETURNING id INTO v_lt_family;

    INSERT INTO leave_types (tenant_id, name, code, description, default_days_per_year, max_carry_forward_days, requires_medical_certificate, medical_cert_threshold_days, is_paid, color_code)
    VALUES (v_tenant_id, 'Maternity Leave', 'MATERNITY', 'Maternity leave — 4 consecutive months as per BCEA. Paid per collective agreement provisions', 120, 0, TRUE, 0, TRUE, '#EC4899')
    RETURNING id INTO v_lt_maternity;

    INSERT INTO leave_types (tenant_id, name, code, description, default_days_per_year, max_carry_forward_days, requires_medical_certificate, medical_cert_threshold_days, is_paid, color_code)
    VALUES (v_tenant_id, 'Study Leave', 'STUDY', 'Paid study leave for approved qualifications — 10 days per annum per municipal HR policy', 10, 0, FALSE, NULL, TRUE, '#8B5CF6')
    RETURNING id INTO v_lt_study;

    INSERT INTO leave_types (tenant_id, name, code, description, default_days_per_year, max_carry_forward_days, requires_medical_certificate, medical_cert_threshold_days, is_paid, color_code)
    VALUES (v_tenant_id, 'Unpaid Leave', 'UNPAID', 'Unpaid leave — by special approval only, after exhaustion of annual leave balance', 0, 0, FALSE, NULL, FALSE, '#6B7280')
    RETURNING id INTO v_lt_unpaid;

    RAISE NOTICE 'Created 6 leave types';

    -- ============================================================
    -- TIER 14: LEAVE POLICIES
    -- ============================================================
    INSERT INTO leave_policies (tenant_id, leave_type_id, name, description, accrual_method, days_per_cycle, cycle_start_month, min_service_months, applicable_employment_types, allow_negative_balance, max_consecutive_days, min_notice_days)
    VALUES (v_tenant_id, v_lt_annual, 'Standard Annual Leave', 'All permanent employees — 15 working days per annum, January cycle', 'ANNUAL', 15, 1, 0, 'PERMANENT', FALSE, 15, 5)
    RETURNING id INTO v_lp_annual;

    INSERT INTO leave_policies (tenant_id, leave_type_id, name, description, accrual_method, days_per_cycle, cycle_start_month, min_service_months, applicable_employment_types, allow_negative_balance, max_consecutive_days, min_notice_days)
    VALUES (v_tenant_id, v_lt_sick, 'Standard Sick Leave', 'All permanent employees — 10 days per annum (30 over 3-year cycle)', 'ANNUAL', 10, 1, 0, 'PERMANENT', TRUE, 10, 0)
    RETURNING id INTO v_lp_sick;

    INSERT INTO leave_policies (tenant_id, leave_type_id, name, description, accrual_method, days_per_cycle, cycle_start_month, min_service_months, applicable_employment_types, allow_negative_balance, max_consecutive_days, min_notice_days)
    VALUES (v_tenant_id, v_lt_family, 'Family Responsibility Leave', 'All permanent employees — 3 days per annum, non-cumulative', 'ANNUAL', 3, 1, 0, 'PERMANENT', FALSE, 3, 0)
    RETURNING id INTO v_lp_family;

    INSERT INTO leave_policies (tenant_id, leave_type_id, name, description, accrual_method, days_per_cycle, cycle_start_month, min_service_months, applicable_employment_types, allow_negative_balance, max_consecutive_days, min_notice_days)
    VALUES (v_tenant_id, v_lt_maternity, 'Maternity Leave Policy', 'Female employees — 4 months consecutive, minimum 6 months service', 'ANNUAL', 120, 1, 6, 'PERMANENT', FALSE, 120, 30)
    RETURNING id INTO v_lp_maternity;

    INSERT INTO leave_policies (tenant_id, leave_type_id, name, description, accrual_method, days_per_cycle, cycle_start_month, min_service_months, applicable_employment_types, allow_negative_balance, max_consecutive_days, min_notice_days)
    VALUES (v_tenant_id, v_lt_study, 'Study Leave Policy', 'Employees enrolled in approved qualifications — 10 days per annum, min 12 months service', 'ANNUAL', 10, 1, 12, 'PERMANENT', FALSE, 5, 10)
    RETURNING id INTO v_lp_study;

    INSERT INTO leave_policies (tenant_id, leave_type_id, name, description, accrual_method, days_per_cycle, cycle_start_month, min_service_months, applicable_employment_types, allow_negative_balance, max_consecutive_days, min_notice_days)
    VALUES (v_tenant_id, v_lt_unpaid, 'Unpaid Leave Policy', 'By special approval after annual leave exhausted — max 20 days per annum', 'ANNUAL', 20, 1, 6, 'PERMANENT', FALSE, 10, 10)
    RETURNING id INTO v_lp_unpaid;

    RAISE NOTICE 'Created 6 leave policies';

    -- ============================================================
    -- TIER 15: LEAVE BALANCES (2025 carry-forward + 2026 current)
    -- Reflects realistic mid-year balances for 10 employees
    -- entitled = policy allocation, taken = approved & consumed,
    -- pending = awaiting approval, carried_forward = from prior year
    -- ============================================================

    -- ---- 2025 CARRY-FORWARD BALANCES (cycle closed) ----

    -- Thandi Moyo (UTW-001) — took 12 of 15 annual, 3 of 10 sick, 0 family
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, 2025, 15, 12, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_sick, 2025, 10, 3, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_family, 2025, 3, 0, 0, 0, 0);

    -- John van Wyk (UTW-002) — took 10 of 15 annual, 2 sick, 1 family, 3 study
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_annual, 2025, 15, 10, 0, 2, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_sick, 2025, 10, 2, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_family, 2025, 3, 1, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_study, 2025, 10, 3, 0, 0, 0);

    -- Nomvula Nzimande (UTW-003) — took 14 of 15 annual, 5 sick, 2 family
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_annual, 2025, 15, 14, 0, 3, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_sick, 2025, 10, 5, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_family, 2025, 3, 2, 0, 0, 0);

    -- Ayesha Pillay (UTW-004) — took 8 of 15 annual, 1 sick (new in 2023, pro-rata 2025 full)
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_pillay, v_lt_annual, 2025, 15, 8, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_pillay, v_lt_sick, 2025, 10, 1, 0, 0, 0);

    -- Pieter Botha (UTW-005) — took 13 of 15 annual, 4 sick, 3 family
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_botha, v_lt_annual, 2025, 15, 13, 0, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_botha, v_lt_sick, 2025, 10, 4, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_botha, v_lt_family, 2025, 3, 3, 0, 0, 0);

    -- Sizwe Mthembu (UTW-006) — took 11 of 15 annual, 0 sick, 1 family
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_annual, 2025, 15, 11, 0, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_sick, 2025, 10, 0, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_family, 2025, 3, 1, 0, 0, 0);

    -- Senzo Dladla (UTW-007) — took 15 of 15 annual (maxed out), 6 sick, 2 family
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, 2025, 15, 15, 0, 3, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_sick, 2025, 10, 6, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_family, 2025, 3, 2, 0, 0, 0);

    -- Prashna Govender (UTW-008) — took 9 of 15 annual, 2 sick
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_govender, v_lt_annual, 2025, 15, 9, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_govender, v_lt_sick, 2025, 10, 2, 0, 0, 0);

    -- Nkosinathi Radebe (UTW-010) — took 13 of 15 annual, 3 sick, 3 family (maxed)
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_annual, 2025, 15, 13, 0, 4, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_sick, 2025, 10, 3, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_family, 2025, 3, 3, 0, 0, 0);

    -- (Mabaso UTW-009 joined Nov 2025 — no 2025 full cycle)

    RAISE NOTICE 'Created 2025 leave balance history';

    -- ---- 2026 CURRENT YEAR BALANCES ----
    -- carried_forward = min(remaining from 2025, max_carry_forward=5 for annual, 0 for others)

    -- Thandi Moyo — cf 3 annual from 2025; taken 3 annual, 1 sick so far; 2 annual pending
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, 2026, 15, 3, 2, 3, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_sick, 2026, 10, 1, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_family, 2026, 3, 0, 0, 0, 0);

    -- John van Wyk — cf 5 annual (capped); taken 5, 0 sick; 3 annual pending
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_annual, 2026, 15, 5, 3, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_sick, 2026, 10, 0, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_family, 2026, 3, 0, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_study, 2026, 10, 2, 0, 0, 0);

    -- Nomvula Nzimande — cf 4 annual (had 18 entitled, took 14 = 4 remain, cap 5 OK); taken 4, pending 5
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_annual, 2026, 15, 4, 5, 4, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_sick, 2026, 10, 2, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_family, 2026, 3, 0, 1, 0, 0);

    -- Ayesha Pillay — cf 5 annual (capped from 7 remaining); taken 2, pending 0
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_pillay, v_lt_annual, 2026, 15, 2, 0, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_pillay, v_lt_sick, 2026, 10, 0, 2, 0, 0);

    -- Pieter Botha — cf 5 annual (capped from 7: 15+5 entitled-taken=7); taken 6, pending 0
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_botha, v_lt_annual, 2026, 15, 6, 0, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_botha, v_lt_sick, 2026, 10, 1, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_botha, v_lt_family, 2026, 3, 0, 0, 0, 0);

    -- Sizwe Mthembu — cf 5 annual (capped from 9: 15+5-11=9); taken 3, pending 5
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_annual, 2026, 15, 3, 5, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_sick, 2026, 10, 0, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_family, 2026, 3, 0, 0, 0, 0);

    -- Senzo Dladla — cf 3 annual (15+3-15=3); taken 4, pending 3, 1 sick pending
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, 2026, 15, 4, 3, 3, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_sick, 2026, 10, 2, 1, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_family, 2026, 3, 1, 0, 0, 0);

    -- Prashna Govender — cf 5 annual (capped from 6); taken 2, pending 0
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_govender, v_lt_annual, 2026, 15, 2, 0, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_govender, v_lt_sick, 2026, 10, 0, 0, 0, 0);

    -- Lungile Mabaso — joined Nov 2025, pro-rata 2026 full year; taken 0, pending 2
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mabaso, v_lt_annual, 2026, 15, 0, 2, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_mabaso, v_lt_sick, 2026, 10, 0, 0, 0, 0);

    -- Nkosinathi Radebe — cf 5 annual (capped from 6: 15+4-13=6); taken 5, pending 0, 1 sick
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_annual, 2026, 15, 5, 0, 5, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_sick, 2026, 10, 1, 0, 0, 0);
    INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, cycle_year, entitled_days, taken_days, pending_days, carried_forward_days, adjustment_days)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_family, 2026, 3, 0, 0, 0, 0);

    RAISE NOTICE 'Created 2025 + 2026 leave balances for all 10 employees';

    -- ============================================================
    -- TIER 16: LEAVE REQUESTS — history (APPROVED) + active (PENDING/REJECTED/CANCELLED)
    -- ============================================================

    -- ---- APPROVED HISTORICAL REQUESTS (2025) ----

    -- Thandi Moyo — 5 days annual Dec 2025 (holiday)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, '2025-12-15', '2025-12-19', 5, 'Year-end family holiday in Durban', 'APPROVED', v_emp_vanwyk, '2025-11-20 09:15:00');

    -- Thandi Moyo — 7 days annual Aug 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, '2025-08-11', '2025-08-19', 7, 'Personal time off — attending family wedding in Johannesburg', 'APPROVED', v_emp_vanwyk, '2025-07-25 14:30:00');

    -- Thandi Moyo — 3 days sick Mar 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, medical_certificate_url)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_sick, '2025-03-10', '2025-03-12', 3, 'Flu — medical certificate attached', 'APPROVED', v_emp_vanwyk, '2025-03-10 08:00:00', 's3://uthukela-docs/leave/moyo_med_mar2025.pdf');

    -- John van Wyk — 5 days annual Jun 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_annual, '2025-06-23', '2025-06-27', 5, 'Mid-year break — Drakensberg family trip', 'APPROVED', v_emp_mthembu, '2025-06-10 10:00:00');

    -- John van Wyk — 5 days annual Dec 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_annual, '2025-12-22', '2025-12-26', 5, 'Christmas shutdown period', 'APPROVED', v_emp_mthembu, '2025-12-01 09:00:00');

    -- John van Wyk — 2 sick Oct 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_sick, '2025-10-06', '2025-10-07', 2, 'Stomach bug', 'APPROVED', v_emp_mthembu, '2025-10-06 07:45:00');

    -- John van Wyk — 1 family Apr 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_family, '2025-04-14', '2025-04-14', 1, 'Child''s hospital appointment', 'APPROVED', v_emp_mthembu, '2025-04-11 11:00:00');

    -- Nomvula Nzimande — 10 days annual Jul 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_annual, '2025-07-07', '2025-07-18', 10, 'Annual holiday — Cape Town visit with family', 'APPROVED', v_emp_mthembu, '2025-06-15 09:00:00');

    -- Nomvula Nzimande — 5 sick Sep 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, medical_certificate_url)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_sick, '2025-09-15', '2025-09-19', 5, 'Bronchitis — doctor ordered bed rest', 'APPROVED', v_emp_mthembu, '2025-09-15 08:30:00', 's3://uthukela-docs/leave/nzimande_med_sep2025.pdf');

    -- Senzo Dladla — 10 days annual Apr 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, '2025-04-14', '2025-04-25', 10, 'Traditional family ceremony in Nongoma', 'APPROVED', v_emp_vanwyk, '2025-03-28 14:00:00');

    -- Senzo Dladla — 5 days annual Dec 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, '2025-12-22', '2025-12-26', 5, 'Year-end break', 'APPROVED', v_emp_vanwyk, '2025-12-05 10:00:00');

    -- Senzo Dladla — 6 sick Jul 2025 (back injury at WTW)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, medical_certificate_url)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_sick, '2025-07-14', '2025-07-21', 6, 'Lower back injury sustained during chemical drum handling — physiotherapy prescribed', 'APPROVED', v_emp_vanwyk, '2025-07-14 09:00:00', 's3://uthukela-docs/leave/dladla_med_jul2025.pdf');

    -- Pieter Botha — 8 days annual Jul 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_botha, v_lt_annual, '2025-07-14', '2025-07-23', 8, 'Camping trip — Kruger National Park', 'APPROVED', v_emp_mthembu, '2025-06-20 13:00:00');

    -- Nkosinathi Radebe — 8 days annual Mar 2025
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_annual, '2025-03-24', '2025-04-02', 8, 'Extended Easter break — travel to Eastern Cape', 'APPROVED', v_emp_vanwyk, '2025-03-10 09:00:00');

    -- ---- APPROVED REQUESTS (2026 — already taken) ----

    -- Thandi Moyo — 3 days annual Feb 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, '2026-02-16', '2026-02-18', 3, 'Personal — moving to new apartment', 'APPROVED', v_emp_vanwyk, '2026-02-03 10:00:00');

    -- Thandi Moyo — 1 day sick Jan 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_sick, '2026-01-20', '2026-01-20', 1, 'Migraine', 'APPROVED', v_emp_vanwyk, '2026-01-20 07:30:00');

    -- John van Wyk — 5 days annual Jan 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_annual, '2026-01-05', '2026-01-09', 5, 'Extended New Year break with family', 'APPROVED', v_emp_mthembu, '2025-12-15 09:00:00');

    -- John van Wyk — 2 days study Feb 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_study, '2026-02-23', '2026-02-24', 2, 'WISA conference attendance — Johannesburg', 'APPROVED', v_emp_mthembu, '2026-02-10 14:00:00');

    -- Nomvula Nzimande — 4 days annual Feb 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_annual, '2026-02-09', '2026-02-12', 4, 'School enrolment week — son starting Grade 1', 'APPROVED', v_emp_mthembu, '2026-01-28 11:00:00');

    -- Nomvula Nzimande — 2 sick Mar 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_sick, '2026-03-09', '2026-03-10', 2, 'Dental procedure', 'APPROVED', v_emp_mthembu, '2026-03-09 08:15:00');

    -- Senzo Dladla — 4 days annual Feb 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, '2026-02-02', '2026-02-05', 4, 'Attending lobola ceremony for brother', 'APPROVED', v_emp_vanwyk, '2026-01-20 09:00:00');

    -- Senzo Dladla — 2 sick Jan 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_sick, '2026-01-13', '2026-01-14', 2, 'Food poisoning', 'APPROVED', v_emp_vanwyk, '2026-01-13 06:45:00');

    -- Senzo Dladla — 1 family Mar 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_family, '2026-03-02', '2026-03-02', 1, 'Death of uncle — funeral attendance', 'APPROVED', v_emp_vanwyk, '2026-03-02 07:00:00');

    -- Pieter Botha — 6 days annual Mar 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_botha, v_lt_annual, '2026-03-09', '2026-03-16', 6, 'Family visit to parents in Bloemfontein', 'APPROVED', v_emp_mthembu, '2026-02-25 10:30:00');

    -- Sizwe Mthembu — 3 days annual Jan 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_annual, '2026-01-05', '2026-01-07', 3, 'New Year extension — family in Empangeni', 'APPROVED', v_emp_mthembu, '2025-12-18 08:00:00');

    -- Nkosinathi Radebe — 5 days annual Jan 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_annual, '2026-01-19', '2026-01-23', 5, 'Home renovation — overseeing building work', 'APPROVED', v_emp_vanwyk, '2026-01-08 14:00:00');

    -- Nkosinathi Radebe — 1 sick Feb 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_sick, '2026-02-17', '2026-02-17', 1, 'Stomach cramps', 'APPROVED', v_emp_vanwyk, '2026-02-17 07:30:00');

    -- Prashna Govender — 2 annual Feb 2026
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at)
    VALUES (v_tenant_id, v_emp_govender, v_lt_annual, '2026-02-26', '2026-02-27', 2, 'Diwali preparations', 'APPROVED', v_emp_nzimande, '2026-02-16 09:00:00');

    RAISE NOTICE 'Created approved leave request history (2025 + 2026)';

    -- ---- ACTIVE LEAVE REQUESTS: PENDING ----

    -- Thandi Moyo — 2 days annual pending (upcoming)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, '2026-04-14', '2026-04-15', 2, 'Personal errands — drivers licence renewal and SARS visit', 'PENDING', v_emp_vanwyk);

    -- John van Wyk — 3 days annual pending (Easter)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_vanwyk, v_lt_annual, '2026-04-06', '2026-04-08', 3, 'Easter holiday — Drakensberg hiking trip with family', 'PENDING', v_emp_mthembu);

    -- Nomvula Nzimande — 5 days annual pending (school holiday)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_annual, '2026-04-13', '2026-04-17', 5, 'School holiday week — taking children to uShaka Marine World', 'PENDING', v_emp_mthembu);

    -- Nomvula Nzimande — 1 day family pending
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_nzimande, v_lt_family, '2026-04-03', '2026-04-03', 1, 'Mother''s hospital follow-up appointment', 'PENDING', v_emp_mthembu);

    -- Sizwe Mthembu — 5 days annual pending (May)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_mthembu, v_lt_annual, '2026-05-04', '2026-05-08', 5, 'Annual executive development programme — Stellenbosch Business School', 'PENDING', v_emp_mthembu);

    -- Senzo Dladla — 3 days annual pending
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, '2026-04-20', '2026-04-22', 3, 'Wife''s graduation ceremony at UKZN — travel to PMB', 'PENDING', v_emp_vanwyk);

    -- Senzo Dladla — 1 day sick pending (recent)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_sick, '2026-03-26', '2026-03-26', 1, 'Severe headache — unable to work', 'PENDING', v_emp_vanwyk);

    -- Ayesha Pillay — 2 days sick pending
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, medical_certificate_url)
    VALUES (v_tenant_id, v_emp_pillay, v_lt_sick, '2026-03-30', '2026-03-31', 2, 'Wisdom tooth extraction — dental procedure', 'PENDING', v_emp_nzimande, 's3://uthukela-docs/leave/pillay_dental_mar2026.pdf');

    -- Lungile Mabaso — 2 days annual pending (first leave request)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id)
    VALUES (v_tenant_id, v_emp_mabaso, v_lt_annual, '2026-04-06', '2026-04-07', 2, 'Personal — PIRB registration renewal in PMB', 'PENDING', v_emp_vanwyk);

    RAISE NOTICE 'Created 9 PENDING leave requests';

    -- ---- REJECTED LEAVE REQUESTS ----

    -- Senzo Dladla — 10 days annual rejected (operational requirements)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, rejection_reason)
    VALUES (v_tenant_id, v_emp_dladla, v_lt_annual, '2026-04-27', '2026-05-08', 10,
            'Extended leave to attend cultural ceremony in Nongoma and visit family',
            'REJECTED', v_emp_vanwyk, '2026-03-20 11:00:00',
            'Cannot approve 10 consecutive days during May — Ladysmith WTW scheduled maintenance requires all process controllers on site. Please resubmit for a shorter period or alternative dates after 15 May.');

    -- Thandi Moyo — 5 days annual rejected (too many staff off)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, rejection_reason)
    VALUES (v_tenant_id, v_emp_moyo, v_lt_annual, '2026-04-13', '2026-04-17', 5,
            'School holiday week — travel to Mpumalanga',
            'REJECTED', v_emp_vanwyk, '2026-03-22 09:30:00',
            'Too many Operations staff already approved for this week. Please select alternative dates — the following week (20-24 April) has availability.');

    -- Nkosinathi Radebe — 3 days study rejected (not enrolled)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, rejection_reason)
    VALUES (v_tenant_id, v_emp_radebe, v_lt_study, '2026-03-16', '2026-03-18', 3,
            'Study leave for UNISA Public Administration exam preparation',
            'REJECTED', v_emp_vanwyk, '2026-03-05 14:00:00',
            'Study leave requires proof of current enrolment. Please submit your 2026 registration confirmation to HR and reapply.');

    RAISE NOTICE 'Created 3 REJECTED leave requests';

    -- ---- CANCELLED LEAVE REQUESTS ----

    -- Pieter Botha — cancelled 3-day annual (plans changed)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, approved_at, cancelled_at, cancellation_reason)
    VALUES (v_tenant_id, v_emp_botha, v_lt_annual, '2026-04-20', '2026-04-22', 3,
            'Long weekend trip to Ballito',
            'CANCELLED', v_emp_mthembu, '2026-03-15 10:00:00', '2026-03-25 08:30:00',
            'Trip cancelled due to family commitment change. Will rebook for later in the year.');

    -- Prashna Govender — cancelled 1-day sick (felt better)
    INSERT INTO leave_requests (tenant_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id, cancelled_at, cancellation_reason)
    VALUES (v_tenant_id, v_emp_govender, v_lt_sick, '2026-03-27', '2026-03-27', 1,
            'Feeling unwell — possible flu',
            'CANCELLED', v_emp_nzimande, '2026-03-27 10:00:00',
            'Felt better after morning rest. Came in after lunch — converting to half day worked.');

    RAISE NOTICE 'Created 2 CANCELLED leave requests';

    -- ============================================================
    -- TIER 17: PUBLIC HOLIDAYS (South Africa 2026)
    -- ============================================================
    INSERT INTO public_holidays (tenant_id, name, holiday_date, is_recurring, country) VALUES
        (v_tenant_id, 'New Year''s Day',                '2026-01-01', TRUE, 'ZA'),
        (v_tenant_id, 'Human Rights Day',               '2026-03-21', TRUE, 'ZA'),
        (v_tenant_id, 'Good Friday',                    '2026-04-03', FALSE, 'ZA'),
        (v_tenant_id, 'Family Day',                     '2026-04-06', FALSE, 'ZA'),
        (v_tenant_id, 'Freedom Day',                    '2026-04-27', TRUE, 'ZA'),
        (v_tenant_id, 'Workers'' Day',                  '2026-05-01', TRUE, 'ZA'),
        (v_tenant_id, 'Youth Day',                      '2026-06-16', TRUE, 'ZA'),
        (v_tenant_id, 'National Women''s Day',          '2026-08-09', TRUE, 'ZA'),
        (v_tenant_id, 'Heritage Day',                   '2026-09-24', TRUE, 'ZA'),
        (v_tenant_id, 'Day of Reconciliation',          '2026-12-16', TRUE, 'ZA'),
        (v_tenant_id, 'Christmas Day',                  '2026-12-25', TRUE, 'ZA'),
        (v_tenant_id, 'Day of Goodwill',                '2026-12-26', TRUE, 'ZA')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created 12 SA public holidays for 2026';

    -- ============================================================
    -- TIER 18: PERFORMANCE REVIEW CYCLE (2025/26 — MID_YEAR in progress)
    -- ============================================================

    -- Performance template
    INSERT INTO performance_templates (tenant_id, name, description, department, job_level, is_active, is_default, created_by)
    VALUES (v_tenant_id, 'uThukela Water Standard Performance Agreement',
            'Standard performance agreement template for all uThukela Water employees. Aligned to Municipal Performance Regulations and SALGA competency framework. Includes KPA, KPI, and core competency assessments.',
            NULL, NULL, TRUE, TRUE, 'System')
    RETURNING id INTO v_perf_tmpl;

    -- Performance cycle: 2025/26 FY — MID_YEAR status (mid-year reviews in progress)
    INSERT INTO performance_cycles (tenant_id, name, description, start_date, end_date, mid_year_deadline, final_review_deadline, status, is_default, created_by)
    VALUES (v_tenant_id, 'FY 2025/26 Performance Cycle',
            'Annual performance review cycle aligned to the municipal financial year (1 July 2025 – 30 June 2026). Mid-year reviews due by 31 March 2026.',
            '2025-07-01', '2026-06-30', '2026-03-31', '2026-06-30', 'MID_YEAR', TRUE, 'System')
    RETURNING id INTO v_perf_cycle;

    RAISE NOTICE 'Created performance cycle FY 2025/26 (MID_YEAR status)';

    -- ============================================================
    -- TIER 19: PERFORMANCE CONTRACTS (10 employees, all ACTIVE)
    -- employee_id and manager_id are VARCHAR referencing user IDs in this schema
    -- ============================================================

    -- 1. Thandi Moyo — reports to John van Wyk
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_moyo::VARCHAR, 'Thandi Moyo', 'UTW-001', v_emp_vanwyk::VARCHAR, 'John van Wyk', 'Operations', 'Water Meter Reader', 'T8', v_perf_tmpl, 'ACTIVE', '2025-07-10 09:00:00', '2025-07-15 14:00:00', v_emp_vanwyk::VARCHAR)
    RETURNING id INTO v_pc_moyo;

    -- 2. John van Wyk — reports to Sizwe Mthembu
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_vanwyk::VARCHAR, 'John van Wyk', 'UTW-002', v_emp_mthembu::VARCHAR, 'Sizwe Mthembu', 'Operations', 'Operations Manager', 'D3', v_perf_tmpl, 'ACTIVE', '2025-07-08 10:00:00', '2025-07-12 11:00:00', v_emp_mthembu::VARCHAR)
    RETURNING id INTO v_pc_vanwyk;

    -- 3. Nomvula Nzimande — reports to Sizwe Mthembu
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_nzimande::VARCHAR, 'Nomvula Nzimande', 'UTW-003', v_emp_mthembu::VARCHAR, 'Sizwe Mthembu', 'Corporate Services', 'HR Manager', 'D2', v_perf_tmpl, 'ACTIVE', '2025-07-09 08:30:00', '2025-07-14 09:00:00', v_emp_mthembu::VARCHAR)
    RETURNING id INTO v_pc_nzimande;

    -- 4. Ayesha Pillay — reports to Nomvula Nzimande
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_pillay::VARCHAR, 'Ayesha Pillay', 'UTW-004', v_emp_nzimande::VARCHAR, 'Nomvula Nzimande', 'Corporate Services', 'Talent Acquisition Specialist', 'T10', v_perf_tmpl, 'ACTIVE', '2025-07-11 11:00:00', '2025-07-16 10:00:00', v_emp_nzimande::VARCHAR)
    RETURNING id INTO v_pc_pillay;

    -- 5. Pieter Botha — reports to Sizwe Mthembu
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_botha::VARCHAR, 'Pieter Botha', 'UTW-005', v_emp_mthembu::VARCHAR, 'Sizwe Mthembu', 'Corporate Services', 'IT Systems Administrator', 'D1', v_perf_tmpl, 'ACTIVE', '2025-07-10 14:00:00', '2025-07-15 16:00:00', v_emp_mthembu::VARCHAR)
    RETURNING id INTO v_pc_botha;

    -- 6. Sizwe Mthembu — self-managed (S57 contract, reports to Council)
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_mthembu::VARCHAR, 'Sizwe Mthembu', 'UTW-006', v_emp_mthembu::VARCHAR, 'Municipal Council', 'Corporate Services', 'Municipal Manager', 'MM', v_perf_tmpl, 'ACTIVE', '2025-07-05 09:00:00', '2025-07-10 09:00:00', v_emp_mthembu::VARCHAR)
    RETURNING id INTO v_pc_mthembu;

    -- 7. Senzo Dladla — reports to John van Wyk
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_dladla::VARCHAR, 'Senzo Dladla', 'UTW-007', v_emp_vanwyk::VARCHAR, 'John van Wyk', 'Water Services', 'Senior Process Controller', 'T10', v_perf_tmpl, 'ACTIVE', '2025-07-12 08:00:00', '2025-07-17 09:00:00', v_emp_vanwyk::VARCHAR)
    RETURNING id INTO v_pc_dladla;

    -- 8. Prashna Govender — reports to Nomvula Nzimande (finance under corp services)
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_govender::VARCHAR, 'Prashna Govender', 'UTW-008', v_emp_nzimande::VARCHAR, 'Nomvula Nzimande', 'Finance', 'Finance Officer', 'T11', v_perf_tmpl, 'ACTIVE', '2025-07-11 09:00:00', '2025-07-16 14:00:00', v_emp_nzimande::VARCHAR)
    RETURNING id INTO v_pc_govender;

    -- 9. Lungile Mabaso — reports to John van Wyk (probation, DRAFT contract)
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_mabaso::VARCHAR, 'Lungile Mabaso', 'UTW-009', v_emp_vanwyk::VARCHAR, 'John van Wyk', 'Technical Services', 'Artisan Plumber', 'T8', v_perf_tmpl, 'DRAFT')
    RETURNING id INTO v_pc_mabaso;

    -- 10. Nkosinathi Radebe — reports to John van Wyk
    INSERT INTO performance_contracts (tenant_id, cycle_id, employee_id, employee_name, employee_number, manager_id, manager_name, department, job_title, job_level, template_id, status, submitted_at, approved_at, approved_by)
    VALUES (v_tenant_id, v_perf_cycle, v_emp_radebe::VARCHAR, 'Nkosinathi Radebe', 'UTW-010', v_emp_vanwyk::VARCHAR, 'John van Wyk', 'Community Services', 'Community Liaison Officer', 'T9', v_perf_tmpl, 'ACTIVE', '2025-07-13 10:00:00', '2025-07-18 11:00:00', v_emp_vanwyk::VARCHAR)
    RETURNING id INTO v_pc_radebe;

    RAISE NOTICE 'Created 10 performance contracts (9 ACTIVE + 1 DRAFT)';

    -- ============================================================
    -- TIER 20: PERFORMANCE GOALS (3-4 per contract, weighted)
    -- Goal types: STRATEGIC, OPERATIONAL, DEVELOPMENT, BEHAVIORAL
    -- ============================================================

    -- Thandi Moyo — Water Meter Reader
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_moyo, 'Meter Reading Accuracy', 'Achieve 98% meter reading accuracy rate across assigned routes', 'OPERATIONAL', 40.00, '98% accuracy rate', 'Monthly accuracy reports from billing system. Variance between readings and consumption patterns.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_moyo, 'Route Completion', 'Complete 100% of assigned meter reading routes within scheduled timeframes', 'OPERATIONAL', 30.00, '100% route completion', 'Monthly route completion reports. Number of missed readings vs. total assigned.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_moyo, 'Professional Development', 'Complete NQF Level 5 Water Reticulation Practice certification', 'DEVELOPMENT', 15.00, 'NQF 5 certificate obtained', 'Enrolment confirmation, progress reports, and certificate of completion.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_moyo, 'Customer Service Excellence', 'Maintain zero valid complaints from ratepayers during meter reading visits', 'BEHAVIORAL', 15.00, 'Zero valid complaints', 'Quarterly complaint register review. Customer feedback from ward councillors.', 4);

    -- John van Wyk — Operations Manager
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_vanwyk, 'Non-Revenue Water Reduction', 'Reduce district non-revenue water from 42% to below 35% by year-end', 'STRATEGIC', 35.00, 'NRW below 35%', 'Monthly water balance calculations. DWS reporting metrics. Infrastructure loss reports.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_vanwyk, 'Operational Uptime', 'Maintain 95% operational uptime across all treatment works and pump stations', 'OPERATIONAL', 30.00, '95% uptime', 'SCADA downtime reports. Monthly infrastructure availability dashboard.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_vanwyk, 'Team Development', 'Ensure 100% of direct reports have active performance contracts and complete mid-year reviews', 'BEHAVIORAL', 20.00, '100% compliance', 'HR performance management system reports. Mid-year review completion tracker.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_vanwyk, 'Blue Drop Compliance', 'Achieve Blue Drop score of 80% or above for Ladysmith WTW', 'STRATEGIC', 15.00, 'Blue Drop >= 80%', 'DWS Blue Drop assessment report. Internal audit scores.', 4);

    -- Nomvula Nzimande — HR Manager
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_nzimande, 'Vacancy Fill Rate', 'Fill 90% of approved vacancies within 60 working days of requisition approval', 'OPERATIONAL', 30.00, '90% within 60 days', 'Recruitment tracker. Time-to-fill reports from ShumelaHire ATS.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_nzimande, 'Performance Management Compliance', 'Ensure 100% of eligible employees have signed performance agreements by 31 July', 'OPERATIONAL', 25.00, '100% signed by deadline', 'Performance management system compliance dashboard.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_nzimande, 'Skills Development Plan', 'Implement approved Workplace Skills Plan and achieve 80% of training targets', 'STRATEGIC', 25.00, '80% WSP implementation', 'EWSETA WSP quarterly progress reports. Training attendance records.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_nzimande, 'Labour Relations Stability', 'Maintain zero days lost to unprotected industrial action', 'BEHAVIORAL', 20.00, 'Zero days lost', 'Labour relations register. SALGBC reports. Grievance resolution timeframes.', 4);

    -- Ayesha Pillay — Talent Acquisition Specialist
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_pillay, 'Recruitment Pipeline Management', 'Maintain a healthy pipeline with minimum 5 qualified candidates per open position', 'OPERATIONAL', 35.00, '5+ candidates per role', 'ATS pipeline reports. Sourcing channel effectiveness metrics.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_pillay, 'Candidate Experience', 'Achieve 85% positive feedback score from candidate experience surveys', 'BEHAVIORAL', 25.00, '85% positive feedback', 'Post-interview candidate surveys. Glassdoor/HelloPeter reviews.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_pillay, 'ATS Implementation', 'Ensure 100% adoption of ShumelaHire ATS across all recruitment processes', 'OPERATIONAL', 25.00, '100% ATS adoption', 'System usage analytics. Percentage of requisitions processed through ATS.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_pillay, 'Professional Certification', 'Obtain SABPP HR Practitioner certification', 'DEVELOPMENT', 15.00, 'SABPP certification', 'Registration confirmation and certificate.', 4);

    -- Pieter Botha — IT Systems Administrator
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_botha, 'System Availability', 'Maintain 99.5% availability for all critical business systems (ERP, email, SCADA network)', 'OPERATIONAL', 35.00, '99.5% uptime', 'Monthly system availability reports. Incident tickets and resolution times.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_botha, 'Cybersecurity Compliance', 'Implement POPIA technical controls and achieve zero data breaches', 'STRATEGIC', 25.00, 'Zero breaches + POPIA controls', 'POPIA compliance audit. Penetration test results. Security incident log.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_botha, 'Disaster Recovery', 'Complete and test IT disaster recovery plan with RTO < 4 hours for critical systems', 'OPERATIONAL', 25.00, 'DR plan tested, RTO < 4hrs', 'DR test report. Recovery time metrics from simulation exercises.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_botha, 'User Support Satisfaction', 'Achieve 90% user satisfaction score on IT helpdesk surveys', 'BEHAVIORAL', 15.00, '90% satisfaction', 'Quarterly helpdesk satisfaction surveys. Average ticket resolution time.', 4);

    -- Sizwe Mthembu — Municipal Manager (S57 strategic KPAs)
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_mthembu, 'Clean Audit Outcome', 'Achieve unqualified audit opinion from Auditor-General for FY 2025/26', 'STRATEGIC', 30.00, 'Unqualified audit', 'AG audit report. Management letter findings reduction.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_mthembu, 'Service Delivery Improvement', 'Achieve 75% satisfaction in annual community satisfaction survey', 'STRATEGIC', 25.00, '75% satisfaction', 'Annual community satisfaction survey results. Service delivery protest incidents.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_mthembu, 'Revenue Enhancement', 'Improve revenue collection rate from 78% to 85%', 'STRATEGIC', 25.00, '85% collection rate', 'Monthly revenue collection reports. Debtor age analysis trends.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_mthembu, 'Institutional Development', 'Fill all critical vacancies and reduce staff turnover to below 10%', 'OPERATIONAL', 20.00, 'Turnover < 10%', 'Quarterly HR dashboard. Vacancy rate and turnover statistics.', 4);

    -- Senzo Dladla — Senior Process Controller
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_dladla, 'Water Quality Compliance', 'Maintain 100% SANS 241 compliance for treated water at Ladysmith WTW', 'OPERATIONAL', 40.00, '100% SANS 241 compliance', 'Monthly water quality results. Non-compliance incident reports.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_dladla, 'Chemical Cost Optimisation', 'Reduce chemical dosing costs by 10% through optimised coagulation and pH control', 'OPERATIONAL', 25.00, '10% cost reduction', 'Monthly chemical consumption and cost reports vs. baseline.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_dladla, 'Process Documentation', 'Update all SOPs for Ladysmith WTW and train process controllers on revised procedures', 'DEVELOPMENT', 20.00, 'All SOPs updated + training done', 'SOP revision register. Training attendance records and competency assessments.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_dladla, 'Safety Compliance', 'Achieve zero lost-time injuries in Water Treatment section', 'BEHAVIORAL', 15.00, 'Zero LTIs', 'Monthly OHS reports. Incident investigation records.', 4);

    -- Prashna Govender — Finance Officer
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_govender, 'Revenue Billing Accuracy', 'Achieve 99% billing accuracy on monthly water consumption invoices', 'OPERATIONAL', 35.00, '99% billing accuracy', 'Monthly billing variance reports. Credit note analysis.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_govender, 'Debt Collection', 'Reduce debtors over 90 days from 35% to 25% of total outstanding', 'OPERATIONAL', 30.00, '90-day debtors < 25%', 'Monthly debtor age analysis. Collection strategy implementation progress.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_govender, 'mSCOA Compliance', 'Maintain 100% compliance with mSCOA chart of accounts for all revenue transactions', 'STRATEGIC', 20.00, '100% mSCOA compliance', 'Quarterly mSCOA compliance reports. National Treasury assessment feedback.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_govender, 'Professional Development', 'Complete CIMA Management Accounting module', 'DEVELOPMENT', 15.00, 'CIMA module passed', 'Enrolment and result confirmation.', 4);

    -- Nkosinathi Radebe — Community Liaison Officer
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_radebe, 'Community Meeting Programme', 'Conduct minimum 4 community meetings per quarter across all Bergville wards', 'OPERATIONAL', 30.00, '16 meetings per annum', 'Meeting attendance registers. Minutes and action item tracker.', 1);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_radebe, 'Complaint Resolution', 'Resolve 90% of water service delivery complaints within 5 working days', 'OPERATIONAL', 30.00, '90% within 5 days', 'Complaint management system reports. Average resolution time metrics.', 2);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_radebe, 'Stakeholder Relationships', 'Establish formal liaison structure with all 12 Bergville ward councillors', 'STRATEGIC', 20.00, '12 ward liaison agreements', 'Signed liaison framework agreements. Quarterly ward feedback reports.', 3);
    INSERT INTO performance_goals (tenant_id, contract_id, title, description, goal_type, weighting, target_value, measurement_criteria, sort_order)
    VALUES (v_tenant_id, v_pc_radebe, 'Report Writing', 'Submit monthly community engagement reports by the 5th of each month', 'BEHAVIORAL', 20.00, '12 reports on time', 'Report submission dates vs. deadline. Quality assessment by manager.', 4);

    RAISE NOTICE 'Created performance goals (3-4 per contract, weighted to 100%%)';

    -- ============================================================
    -- TIER 21: MID-YEAR REVIEWS (partially completed self-assessments)
    -- Statuses: PENDING (not started), EMPLOYEE_SUBMITTED (self-assessment done),
    --           MANAGER_SUBMITTED (manager done too), COMPLETED (finalised)
    -- ============================================================

    -- Thandi Moyo — EMPLOYEE_SUBMITTED (self-assessment completed, awaiting manager)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, self_assessment_notes, self_rating, self_submitted_at, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_moyo, 'MID_YEAR', 'EMPLOYEE_SUBMITTED',
            'I have maintained a 97.5% meter reading accuracy rate for the first half, just below the 98% target. Route completion has been 100%. I have enrolled for the NQF Level 5 Water Reticulation course at Umfolozi TVET starting February 2026. No customer complaints received. I am on track for most of my KPAs and will focus on improving accuracy in Q3.',
            3.50, '2026-03-18 14:30:00', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_moyo;

    -- John van Wyk — EMPLOYEE_SUBMITTED (self-assessment completed, awaiting Mthembu)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, self_assessment_notes, self_rating, self_submitted_at, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_vanwyk, 'MID_YEAR', 'EMPLOYEE_SUBMITTED',
            'NRW has been reduced from 42% to 38% — good progress but still above the 35% target. The Estcourt pressure management project has contributed significantly. Operational uptime at 94.2% due to the pump station failure in October (2 days downtime). All direct reports have active performance contracts. Blue Drop preparations are progressing well with the Ladysmith WTW upgrade on track. I am confident we will meet the year-end target of 35% NRW with the leak detection programme expansion in Q3-Q4.',
            3.75, '2026-03-15 10:00:00', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_vanwyk;

    -- Nomvula Nzimande — MANAGER_SUBMITTED (both self and manager assessment done)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status,
        self_assessment_notes, self_rating, self_submitted_at,
        manager_assessment_notes, manager_rating, manager_submitted_at,
        review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_nzimande, 'MID_YEAR', 'MANAGER_SUBMITTED',
            'Vacancy fill rate at 85% within 60 days — slightly below 90% target due to technical positions requiring niche skills. All employees have signed performance agreements. WSP implementation at 65% — on track for 80% by year-end. Zero days lost to industrial action. The ShumelaHire ATS implementation has significantly improved our recruitment process efficiency.',
            3.75, '2026-03-12 09:00:00',
            'Nomvula has performed well in a demanding period. The ATS rollout was excellently managed. Vacancy fill rate is acceptable given the technical recruitment challenges. WSP implementation needs acceleration in Q3. Labour relations management has been exemplary. Overall a strong mid-year showing.',
            4.00, '2026-03-20 15:00:00',
            '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_nzimande;

    -- Ayesha Pillay — EMPLOYEE_SUBMITTED
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, self_assessment_notes, self_rating, self_submitted_at, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_pillay, 'MID_YEAR', 'EMPLOYEE_SUBMITTED',
            'Pipeline management is strong — averaging 7 qualified candidates per open role, exceeding the 5-candidate target. Candidate experience survey at 82%, just below the 85% target. ATS adoption is at 95% — a few hiring managers still use email for initial screening. I have registered for the SABPP practitioner exam in May 2026. The Water Quality Technician recruitment has been particularly successful with a strong pipeline.',
            3.50, '2026-03-22 11:00:00', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_pillay;

    -- Pieter Botha — PENDING (has not started self-assessment)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_botha, 'MID_YEAR', 'PENDING', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_botha;

    -- Sizwe Mthembu — COMPLETED (S57 contract, reviewed by Council committee)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status,
        self_assessment_notes, self_rating, self_submitted_at,
        manager_assessment_notes, manager_rating, manager_submitted_at,
        final_rating, moderated_at, moderated_by, completed_at,
        review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_mthembu, 'MID_YEAR', 'COMPLETED',
            'AG interim audit findings reduced from 12 to 4 — on track for unqualified opinion. Community satisfaction survey results not yet available (scheduled for Q3). Revenue collection improved from 78% to 82%. All S57 manager positions filled. Staff turnover at 8.5% — below 10% target. Infrastructure investment programme on schedule with MIG expenditure at 48% of annual allocation.',
            4.00, '2026-03-05 08:00:00',
            'The Municipal Manager has shown strong leadership in a challenging fiscal environment. The improvement in AG findings is commendable. Revenue collection improvement is notable but needs continued focus to reach 85% target. The community satisfaction survey will be a key indicator in the final review. Overall performance exceeds expectations at mid-year.',
            4.25, '2026-03-10 14:00:00',
            4.00, '2026-03-15 10:00:00', v_emp_mthembu::VARCHAR, '2026-03-15 10:00:00',
            '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_mthembu;

    -- Senzo Dladla — EMPLOYEE_SUBMITTED
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, self_assessment_notes, self_rating, self_submitted_at, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_dladla, 'MID_YEAR', 'EMPLOYEE_SUBMITTED',
            'SANS 241 compliance maintained at 99.8% — one turbidity exceedance in August during heavy rains (within acceptable limits after corrective action). Chemical costs reduced by 7% through optimised jar testing programme — on track for 10% target. 6 of 12 SOPs updated and training completed on revised procedures. Zero lost-time injuries achieved. The back injury I sustained in July was not a workplace LTI as it was during incorrect manual handling — I have since completed the refresher training.',
            3.75, '2026-03-19 07:30:00', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_dladla;

    -- Prashna Govender — PENDING (has not started)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_govender, 'MID_YEAR', 'PENDING', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_govender;

    -- Lungile Mabaso — no review (DRAFT contract, on probation)
    -- Probation review handled separately, not in performance cycle
    v_rev_mabaso := NULL;

    -- Nkosinathi Radebe — PENDING (has not started)
    INSERT INTO performance_reviews (tenant_id, contract_id, review_type, status, review_period_start, review_period_end, due_date)
    VALUES (v_tenant_id, v_pc_radebe, 'MID_YEAR', 'PENDING', '2025-07-01', '2025-12-31', '2026-03-31')
    RETURNING id INTO v_rev_radebe;

    RAISE NOTICE 'Created mid-year reviews: 1 COMPLETED, 1 MANAGER_SUBMITTED, 4 EMPLOYEE_SUBMITTED, 3 PENDING';

    -- ============================================================
    -- TIER 22: REVIEW GOAL SCORES (for completed/submitted reviews)
    -- Score: 1-5 scale (1=Unacceptable, 2=Below Expectations,
    --        3=Meets Expectations, 4=Exceeds, 5=Outstanding)
    -- Only self-scores for EMPLOYEE_SUBMITTED; self + manager for MANAGER_SUBMITTED/COMPLETED
    -- ============================================================

    -- Helper: get goal IDs for Thandi Moyo's contract to score them
    -- Moyo goal scores (self only — EMPLOYEE_SUBMITTED)
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_moyo AND sort_order = 1;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_moyo, v_goal_id, 3.50, 'Accuracy at 97.5% — just below 98% target. Improving month on month.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_moyo AND sort_order = 2;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_moyo, v_goal_id, 4.00, '100% route completion maintained throughout the period.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_moyo AND sort_order = 3;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_moyo, v_goal_id, 3.00, 'Enrolled for NQF 5 at Umfolozi TVET. Classes started Feb 2026.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_moyo AND sort_order = 4;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_moyo, v_goal_id, 4.00, 'Zero complaints. Positive feedback from Ward 7 councillor.');

    -- Van Wyk goal scores (self only)
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_vanwyk AND sort_order = 1;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_vanwyk, v_goal_id, 3.50, 'NRW reduced from 42% to 38%. Pressure management in Estcourt contributing. Target 35% achievable by year-end.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_vanwyk AND sort_order = 2;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_vanwyk, v_goal_id, 3.50, 'Uptime at 94.2% vs. 95% target. October pump failure brought average down. New standby pump commissioned.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_vanwyk AND sort_order = 3;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_vanwyk, v_goal_id, 4.00, 'All direct reports have active contracts. Mid-year reviews in progress.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_vanwyk AND sort_order = 4;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_vanwyk, v_goal_id, 4.00, 'Ladysmith WTW Blue Drop preparations on track. Internal audit score improved to 78%.');

    -- Nzimande goal scores (self + manager — MANAGER_SUBMITTED)
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_nzimande AND sort_order = 1;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_nzimande, v_goal_id, 3.50, 'Self: 85% fill rate within 60 days. Technical roles taking longer. Manager: Acceptable given market challenges for water engineers.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_nzimande AND sort_order = 2;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_nzimande, v_goal_id, 4.50, 'Self: 100% compliance achieved. Manager: Excellent — all agreements signed within deadline. Well managed process.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_nzimande AND sort_order = 3;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_nzimande, v_goal_id, 3.50, 'Self: WSP at 65%. Manager: On track but needs acceleration. EWSETA reporting on time. Budget utilisation needs attention.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_nzimande AND sort_order = 4;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_nzimande, v_goal_id, 4.50, 'Self: Zero days lost. Manager: Exemplary labour relations. Proactive engagement with SAMWU. Wage negotiations handled skillfully.');

    -- Pillay goal scores (self only)
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_pillay AND sort_order = 1;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_pillay, v_goal_id, 4.00, 'Averaging 7 qualified candidates per role vs. 5 target. WQT recruitment pipeline particularly strong.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_pillay AND sort_order = 2;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_pillay, v_goal_id, 3.00, 'Candidate experience at 82% vs. 85% target. Working on interview scheduling communication improvements.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_pillay AND sort_order = 3;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_pillay, v_goal_id, 3.50, 'ATS at 95%. Two hiring managers still using email for initial screening. Targeted training planned.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_pillay AND sort_order = 4;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_pillay, v_goal_id, 3.00, 'Registered for SABPP exam in May 2026. Studying in progress.');

    -- Dladla goal scores (self only)
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_dladla AND sort_order = 1;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_dladla, v_goal_id, 4.00, 'SANS 241 at 99.8% — one turbidity exceedance during August storm event. Corrective action taken within 2 hours.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_dladla AND sort_order = 2;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_dladla, v_goal_id, 3.50, 'Chemical costs down 7%. Jar testing optimisation programme showing results. 10% target achievable by year-end.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_dladla AND sort_order = 3;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_dladla, v_goal_id, 3.50, '6 of 12 SOPs updated. Training completed for revised procedures. Remaining 6 scheduled for Q3.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_dladla AND sort_order = 4;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_dladla, v_goal_id, 4.00, 'Zero LTIs. Manual handling refresher training completed after July incident.');

    -- Mthembu goal scores (self + manager — COMPLETED)
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_mthembu AND sort_order = 1;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_mthembu, v_goal_id, 4.00, 'AG interim findings reduced from 12 to 4. Strong trajectory toward unqualified opinion. Internal controls strengthened.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_mthembu AND sort_order = 2;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_mthembu, v_goal_id, 3.50, 'Survey not yet conducted (Q3). Service delivery protests reduced by 40% compared to prior year. Positive indicator.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_mthembu AND sort_order = 3;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_mthembu, v_goal_id, 3.75, 'Collection rate at 82% vs. 85% target. Credit control policy revised. Indigent register updated. Continued focus needed.');
    SELECT id INTO v_goal_id FROM performance_goals WHERE contract_id = v_pc_mthembu AND sort_order = 4;
    INSERT INTO review_goal_scores (tenant_id, review_id, goal_id, score, comment) VALUES (v_tenant_id, v_rev_mthembu, v_goal_id, 4.50, 'All critical vacancies filled. Turnover at 8.5%. ShumelaHire ATS successfully deployed. Skills development on track.');

    RAISE NOTICE 'Created review goal scores for 6 submitted/completed reviews';

    -- ============================================================
    -- TIER 23: REVIEW EVIDENCE (supporting documents for submitted reviews)
    -- ============================================================
    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_moyo, 'moyo_meter_accuracy_q1q2.pdf', 's3://uthukela-docs/performance/UTW-001/moyo_meter_accuracy_q1q2.pdf', 234000, 'application/pdf', 'Meter reading accuracy report Jul-Dec 2025', 'REPORT', v_emp_moyo::VARCHAR);
    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_moyo, 'moyo_nqf5_enrolment.pdf', 's3://uthukela-docs/performance/UTW-001/moyo_nqf5_enrolment.pdf', 156000, 'application/pdf', 'NQF Level 5 enrolment confirmation — Umfolozi TVET', 'CERTIFICATE', v_emp_moyo::VARCHAR);

    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_vanwyk, 'vanwyk_nrw_dashboard_h1.pdf', 's3://uthukela-docs/performance/UTW-002/vanwyk_nrw_dashboard_h1.pdf', 456000, 'application/pdf', 'Non-revenue water dashboard H1 2025/26', 'REPORT', v_emp_vanwyk::VARCHAR);
    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_vanwyk, 'vanwyk_blue_drop_internal_audit.pdf', 's3://uthukela-docs/performance/UTW-002/vanwyk_blue_drop_internal_audit.pdf', 389000, 'application/pdf', 'Ladysmith WTW internal Blue Drop audit report', 'REPORT', v_emp_vanwyk::VARCHAR);

    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_nzimande, 'nzimande_recruitment_metrics_h1.pdf', 's3://uthukela-docs/performance/UTW-003/nzimande_recruitment_metrics_h1.pdf', 312000, 'application/pdf', 'Recruitment metrics dashboard H1 — ATS generated', 'REPORT', v_emp_nzimande::VARCHAR);
    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_nzimande, 'nzimande_wsp_progress_q2.pdf', 's3://uthukela-docs/performance/UTW-003/nzimande_wsp_progress_q2.pdf', 278000, 'application/pdf', 'Workplace Skills Plan Q2 progress report', 'REPORT', v_emp_nzimande::VARCHAR);

    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_dladla, 'dladla_sans241_results_h1.pdf', 's3://uthukela-docs/performance/UTW-007/dladla_sans241_results_h1.pdf', 534000, 'application/pdf', 'SANS 241 compliance results Jul-Dec 2025', 'REPORT', v_emp_dladla::VARCHAR);
    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_dladla, 'dladla_chemical_cost_analysis.xlsx', 's3://uthukela-docs/performance/UTW-007/dladla_chemical_cost_analysis.xlsx', 189000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Chemical cost analysis and dosing optimisation report', 'REPORT', v_emp_dladla::VARCHAR);

    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_mthembu, 'mthembu_ag_interim_findings.pdf', 's3://uthukela-docs/performance/UTW-006/mthembu_ag_interim_findings.pdf', 678000, 'application/pdf', 'AG interim audit management letter — findings summary', 'REPORT', v_emp_mthembu::VARCHAR);
    INSERT INTO review_evidence (tenant_id, review_id, file_name, file_path, file_size, content_type, description, evidence_type, uploaded_by)
    VALUES (v_tenant_id, v_rev_mthembu, 'mthembu_revenue_collection_trend.pdf', 's3://uthukela-docs/performance/UTW-006/mthembu_revenue_collection_trend.pdf', 234000, 'application/pdf', 'Revenue collection rate trend analysis', 'REPORT', v_emp_mthembu::VARCHAR);

    RAISE NOTICE 'Created review evidence documents';

    -- ============================================================
    -- TIER 24: TRAINING COURSES (8 courses aligned to WSP)
    -- ============================================================
    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'SANS 241 Drinking Water Quality Compliance', 'SANS241', 'Comprehensive training on SANS 241:2015 drinking water quality standards. Covers monitoring requirements, compliance limits, corrective actions, and Blue Drop assessment preparation.', 'CLASSROOM', 'Technical — Water Quality', 'Water Research Commission (WRC)', 16.00, 20, 4500.00, TRUE)
    RETURNING id INTO v_tc_sans241;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'Occupational Health & Safety Act Compliance', 'OHS-ACT', 'OHS Act training covering workplace hazards in water utilities, chemical handling, confined space entry, working at heights, and incident reporting. EWSETA accredited.', 'CLASSROOM', 'Health & Safety', 'NOSA (National Occupational Safety Association)', 8.00, 30, 2200.00, TRUE)
    RETURNING id INTO v_tc_ohs;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'SCADA Systems for Water Treatment Operations', 'SCADA-OPS', 'Hands-on training on SCADA system operation, alarm management, data trending, and basic troubleshooting for water treatment plant process controllers.', 'BLENDED', 'Technical — SCADA', 'ABB South Africa', 24.00, 12, 8500.00, FALSE)
    RETURNING id INTO v_tc_scada;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'Municipal Finance Management Act (MFMA) Essentials', 'MFMA-101', 'Overview of MFMA requirements for municipal officials. Covers supply chain management, budgeting, financial reporting, and fiduciary responsibilities.', 'ONLINE', 'Finance & Compliance', 'National Treasury — MFMA Learning Programme', 16.00, 25, 0.00, TRUE)
    RETURNING id INTO v_tc_mfma;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'Batho Pele & Public Service Excellence', 'BATHO-PELE', 'Training on the 8 Batho Pele principles, customer service in local government, complaint handling, and community engagement best practices.', 'WORKSHOP', 'Soft Skills — Service Delivery', 'SALGA Academy', 8.00, 30, 1500.00, TRUE)
    RETURNING id INTO v_tc_batho;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'Leak Detection & Non-Revenue Water Management', 'LEAK-NRW', 'Practical training on acoustic leak detection equipment, step testing, pressure management, and NRW reduction strategies for water reticulation networks.', 'ON_THE_JOB', 'Technical — Reticulation', 'WRP Consulting Engineers', 16.00, 10, 6000.00, FALSE)
    RETURNING id INTO v_tc_leak;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'Advanced Excel for Municipal Reporting', 'EXCEL-ADV', 'Advanced Excel skills including pivot tables, VLOOKUP/INDEX-MATCH, dashboards, macros, and data validation for municipal financial and operational reporting.', 'ONLINE', 'IT Skills', 'Skills Academy (online)', 12.00, 20, 1200.00, FALSE)
    RETURNING id INTO v_tc_excel;

    INSERT INTO training_courses (tenant_id, title, code, description, delivery_method, category, provider, duration_hours, max_participants, cost, is_mandatory)
    VALUES (v_tenant_id, 'Supervisory & Leadership Development', 'LEAD-DEV', 'Leadership programme for municipal middle managers. Covers delegation, performance management conversations, conflict resolution, and leading diverse teams.', 'BLENDED', 'Leadership', 'Wits Business School — Short Course', 40.00, 15, 12000.00, FALSE)
    RETURNING id INTO v_tc_leadership;

    RAISE NOTICE 'Created 8 training courses';

    -- ============================================================
    -- TIER 25: TRAINING SESSIONS (completed, in-progress, upcoming)
    -- ============================================================

    -- COMPLETED sessions (past)
    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_sans241, 'Dr. Nonhlanhla Khumalo', 'uThukela Water Head Office, Ladysmith', '2025-09-15 08:00:00', '2025-09-16 17:00:00', 'COMPLETED', 20)
    RETURNING id INTO v_ts_sans241_q3;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_ohs, 'Themba Mkhize (NOSA)', 'Ladysmith Civic Hall', '2025-10-22 08:00:00', '2025-10-22 17:00:00', 'COMPLETED', 30)
    RETURNING id INTO v_ts_ohs_q2;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_scada, 'Peter van Rensburg (ABB)', 'Ladysmith WTW Control Room + Online', '2025-08-18 08:00:00', '2025-08-20 17:00:00', 'COMPLETED', 12)
    RETURNING id INTO v_ts_scada_q3;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_mfma, 'National Treasury e-Learning Platform', 'Online (self-paced)', '2026-01-13 08:00:00', '2026-02-07 17:00:00', 'COMPLETED', 25)
    RETURNING id INTO v_ts_mfma_q1;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_batho, 'Zodwa Mthembu (SALGA)', 'Bergville Community Hall', '2025-11-05 08:00:00', '2025-11-05 17:00:00', 'COMPLETED', 30)
    RETURNING id INTO v_ts_batho_q2;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_leak, 'Jan de Villiers (WRP)', 'Estcourt Depot — Field Training', '2025-12-01 07:00:00', '2025-12-02 16:00:00', 'COMPLETED', 10)
    RETURNING id INTO v_ts_leak_q4;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_excel, 'Skills Academy Online Instructor', 'Online (self-paced)', '2026-01-20 08:00:00', '2026-02-14 17:00:00', 'COMPLETED', 20)
    RETURNING id INTO v_ts_excel_q1;

    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_leadership, 'Prof. Siya Nkabinde (Wits)', 'Wits Business School, Johannesburg + Online', '2025-09-01 08:00:00', '2025-10-31 17:00:00', 'COMPLETED', 15)
    RETURNING id INTO v_ts_leadership_q3;

    -- IN_PROGRESS session (happening now — OHS refresher)
    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_ohs, 'Themba Mkhize (NOSA)', 'uThukela Water Head Office, Ladysmith', '2026-03-25 08:00:00', '2026-03-27 17:00:00', 'IN_PROGRESS', 30)
    RETURNING id INTO v_ts_ohs_upcoming;

    -- PLANNED upcoming session (SANS 241 refresher next quarter)
    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_sans241, 'Dr. Nonhlanhla Khumalo', 'uThukela Water Head Office, Ladysmith', '2026-04-20 08:00:00', '2026-04-21 17:00:00', 'PLANNED', 20)
    RETURNING id INTO v_ts_sans241_q1;

    -- OPEN upcoming session (SCADA advanced — accepting registrations)
    INSERT INTO training_sessions (tenant_id, course_id, trainer_name, location, start_date, end_date, status, available_seats)
    VALUES (v_tenant_id, v_tc_scada, 'Peter van Rensburg (ABB)', 'Ladysmith WTW Control Room + Online', '2026-05-11 08:00:00', '2026-05-13 17:00:00', 'OPEN', 12)
    RETURNING id INTO v_ts_scada_upcoming;

    RAISE NOTICE 'Created 12 training sessions (8 completed, 1 in-progress, 1 planned, 2 open)';

    -- ============================================================
    -- TIER 26: TRAINING ENROLLMENTS
    -- Statuses: REGISTERED, ATTENDED, COMPLETED, NO_SHOW, CANCELLED
    -- ============================================================

    -- SANS 241 (Sep 2025 — completed) — Water Services + Operations staff
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_sans241_q3, v_emp_dladla, 'COMPLETED', 92.00, '2025-09-16 17:00:00', 's3://uthukela-docs/training/certs/dladla_sans241_sep2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_sans241_q3, v_emp_vanwyk, 'COMPLETED', 88.00, '2025-09-16 17:00:00', 's3://uthukela-docs/training/certs/vanwyk_sans241_sep2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_sans241_q3, v_emp_moyo, 'COMPLETED', 85.00, '2025-09-16 17:00:00', 's3://uthukela-docs/training/certs/moyo_sans241_sep2025.pdf');

    -- OHS Act (Oct 2025 — completed) — all staff mandatory
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_moyo, 'COMPLETED', 78.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/moyo_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_vanwyk, 'COMPLETED', 90.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/vanwyk_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_dladla, 'COMPLETED', 82.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/dladla_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_radebe, 'COMPLETED', 75.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/radebe_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_nzimande, 'COMPLETED', 85.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/nzimande_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_govender, 'COMPLETED', 80.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/govender_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_pillay, 'COMPLETED', 88.00, '2025-10-22 17:00:00', 's3://uthukela-docs/training/certs/pillay_ohs_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, completed_at)
    VALUES (v_tenant_id, v_ts_ohs_q2, v_emp_botha, 'NO_SHOW', NULL);

    -- SCADA (Aug 2025 — completed) — Water Services technical staff
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_scada_q3, v_emp_dladla, 'COMPLETED', 95.00, '2025-08-20 17:00:00', 's3://uthukela-docs/training/certs/dladla_scada_aug2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_scada_q3, v_emp_vanwyk, 'COMPLETED', 82.00, '2025-08-20 17:00:00', 's3://uthukela-docs/training/certs/vanwyk_scada_aug2025.pdf');

    -- MFMA (Jan-Feb 2026 — completed) — Finance + management staff
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_mfma_q1, v_emp_govender, 'COMPLETED', 91.00, '2026-02-05 14:00:00', 's3://uthukela-docs/training/certs/govender_mfma_feb2026.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_mfma_q1, v_emp_mthembu, 'COMPLETED', 88.00, '2026-02-07 10:00:00', 's3://uthukela-docs/training/certs/mthembu_mfma_feb2026.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_mfma_q1, v_emp_nzimande, 'COMPLETED', 85.00, '2026-02-06 16:00:00', 's3://uthukela-docs/training/certs/nzimande_mfma_feb2026.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_mfma_q1, v_emp_vanwyk, 'REGISTERED');
    -- van Wyk registered but never completed the online module

    -- Batho Pele (Nov 2025 — completed) — community-facing staff
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_batho_q2, v_emp_radebe, 'COMPLETED', 90.00, '2025-11-05 17:00:00', 's3://uthukela-docs/training/certs/radebe_batho_nov2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_batho_q2, v_emp_moyo, 'COMPLETED', 82.00, '2025-11-05 17:00:00', 's3://uthukela-docs/training/certs/moyo_batho_nov2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_batho_q2, v_emp_pillay, 'COMPLETED', 87.00, '2025-11-05 17:00:00', 's3://uthukela-docs/training/certs/pillay_batho_nov2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_batho_q2, v_emp_govender, 'CANCELLED');

    -- Leak Detection (Dec 2025 — completed) — Technical Services + Operations
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_leak_q4, v_emp_vanwyk, 'COMPLETED', 86.00, '2025-12-02 16:00:00', 's3://uthukela-docs/training/certs/vanwyk_leak_dec2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_leak_q4, v_emp_moyo, 'COMPLETED', 80.00, '2025-12-02 16:00:00', 's3://uthukela-docs/training/certs/moyo_leak_dec2025.pdf');

    -- Advanced Excel (Jan-Feb 2026 — completed) — admin/finance staff
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_excel_q1, v_emp_govender, 'COMPLETED', 94.00, '2026-02-10 11:00:00', 's3://uthukela-docs/training/certs/govender_excel_feb2026.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_excel_q1, v_emp_pillay, 'COMPLETED', 89.00, '2026-02-12 14:00:00', 's3://uthukela-docs/training/certs/pillay_excel_feb2026.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_excel_q1, v_emp_nzimande, 'COMPLETED', 76.00, '2026-02-14 09:00:00', 's3://uthukela-docs/training/certs/nzimande_excel_feb2026.pdf');

    -- Leadership Development (Sep-Oct 2025 — completed) — managers
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_leadership_q3, v_emp_vanwyk, 'COMPLETED', 84.00, '2025-10-31 17:00:00', 's3://uthukela-docs/training/certs/vanwyk_leadership_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_leadership_q3, v_emp_nzimande, 'COMPLETED', 91.00, '2025-10-31 17:00:00', 's3://uthukela-docs/training/certs/nzimande_leadership_oct2025.pdf');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status, score, completed_at, certificate_url)
    VALUES (v_tenant_id, v_ts_leadership_q3, v_emp_mthembu, 'COMPLETED', 88.00, '2025-10-31 17:00:00', 's3://uthukela-docs/training/certs/mthembu_leadership_oct2025.pdf');

    -- OHS Refresher (Mar 2026 — IN_PROGRESS) — current attendees
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_ohs_upcoming, v_emp_botha, 'ATTENDED');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_ohs_upcoming, v_emp_mabaso, 'ATTENDED');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_ohs_upcoming, v_emp_dladla, 'ATTENDED');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_ohs_upcoming, v_emp_radebe, 'REGISTERED');

    -- SANS 241 Refresher (Apr 2026 — PLANNED) — pre-registered
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_sans241_q1, v_emp_dladla, 'REGISTERED');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_sans241_q1, v_emp_moyo, 'REGISTERED');

    -- SCADA Advanced (May 2026 — OPEN) — registered
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_scada_upcoming, v_emp_dladla, 'REGISTERED');
    INSERT INTO training_enrollments (tenant_id, session_id, employee_id, status)
    VALUES (v_tenant_id, v_ts_scada_upcoming, v_emp_vanwyk, 'REGISTERED');

    RAISE NOTICE 'Created training enrollments (35 records across 12 sessions)';

    -- ============================================================
    -- TIER 27: CERTIFICATIONS (professional registrations & course certs)
    -- ============================================================
    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_vanwyk, 'Professional Engineer (Pr.Eng)', 'Engineering Council of South Africa (ECSA)', 'PR-ENG-20050234', '2005-06-15', '2027-03-31', 'ACTIVE', 's3://uthukela-docs/certs/vanwyk_ecsa_preng.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_dladla, 'Water Treatment Process Controller NQF Level 4', 'Energy and Water SETA (EWSETA)', 'EWSETA-WPC4-2022-0891', '2022-07-01', '2027-12-31', 'ACTIVE', 's3://uthukela-docs/certs/dladla_nqf4_ewseta.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_mabaso, 'Registered Plumber', 'Plumbing Industry Registration Board (PIRB)', 'PIRB-2019-45678', '2019-03-01', '2027-06-30', 'ACTIVE', 's3://uthukela-docs/certs/mabaso_pirb.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_botha, 'ITIL 4 Foundation', 'Axelos / PeopleCert', 'GR671234567TB', '2023-06-15', '2028-06-30', 'ACTIVE', 's3://uthukela-docs/certs/botha_itil4.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_govender, 'mSCOA Practitioner', 'National Treasury', 'NT-MSCOA-2021-3456', '2021-09-01', '2026-12-31', 'ACTIVE', 's3://uthukela-docs/certs/govender_mscoa.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_nzimande, 'SABPP HR Professional', 'South African Board for People Practices', 'SABPP-HRP-2020-2345', '2020-04-01', '2026-03-31', 'ACTIVE', 's3://uthukela-docs/certs/nzimande_sabpp.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_moyo, 'First Aid Level 1', 'St John Ambulance South Africa', 'SJFAID-2024-78901', '2024-03-15', '2026-03-14', 'EXPIRED', 's3://uthukela-docs/certs/moyo_firstaid.pdf');

    INSERT INTO certifications (tenant_id, employee_id, name, issuing_body, certification_number, issue_date, expiry_date, status, document_url)
    VALUES (v_tenant_id, v_emp_radebe, 'Certificate in Conflict Resolution & Mediation', 'UNISA', 'UNISA-CRM-2020-6789', '2020-11-15', NULL, 'ACTIVE', 's3://uthukela-docs/certs/radebe_conflict_resolution.pdf');

    RAISE NOTICE 'Created 8 professional certifications';

    -- ============================================================
    -- TIER 28: TRAINING FEEDBACK SURVEYS (using engagement survey tables)
    -- Post-training evaluation for completed sessions
    -- ============================================================

    -- Survey 1: SANS 241 Training Feedback (Sep 2025)
    INSERT INTO surveys (tenant_id, title, description, status, is_anonymous, start_date, end_date, created_by)
    VALUES (v_tenant_id, 'Training Feedback: SANS 241 Drinking Water Quality (Sep 2025)',
            'Post-training evaluation for the SANS 241 compliance course held 15-16 September 2025. Please rate the training on the criteria below.',
            'CLOSED', FALSE, '2025-09-17', '2025-09-24', v_emp_nzimande)
    RETURNING id INTO v_survey_sans241;

    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_sans241, 'Overall, how would you rate this training? (1=Poor, 5=Excellent)', 'RATING', 1, TRUE)
    RETURNING id INTO v_sq_overall;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_sans241, 'How relevant was the content to your daily work?', 'RATING', 2, TRUE)
    RETURNING id INTO v_sq_relevance;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_sans241, 'How would you rate the quality of the training material?', 'RATING', 3, TRUE)
    RETURNING id INTO v_sq_content;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_sans241, 'How effective was the trainer in delivering the content?', 'RATING', 4, TRUE)
    RETURNING id INTO v_sq_trainer;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_sans241, 'Any additional comments or suggestions for improvement?', 'TEXT', 5, FALSE)
    RETURNING id INTO v_sq_comment;

    -- Responses — Senzo Dladla
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_overall, v_emp_dladla, 5);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_relevance, v_emp_dladla, 5);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_content, v_emp_dladla, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_trainer, v_emp_dladla, 5);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_sans241, v_sq_comment, v_emp_dladla, 'Excellent refresher. The case studies on turbidity exceedances were very practical. Would recommend including a section on the new SANS 241 revision process.');

    -- Responses — John van Wyk
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_overall, v_emp_vanwyk, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_relevance, v_emp_vanwyk, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_content, v_emp_vanwyk, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_trainer, v_emp_vanwyk, 5);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_sans241, v_sq_comment, v_emp_vanwyk, 'Good course. As a manager I found the compliance reporting framework section most useful. Perhaps could allocate more time to the risk assessment component.');

    -- Responses — Thandi Moyo
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_overall, v_emp_moyo, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_relevance, v_emp_moyo, 3);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_content, v_emp_moyo, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_sans241, v_sq_trainer, v_emp_moyo, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_sans241, v_sq_comment, v_emp_moyo, 'I learned a lot about the standards but some of the laboratory analysis sections were above my current level. A separate module for field staff would be helpful.');

    -- Survey 2: OHS Training Feedback (Oct 2025)
    INSERT INTO surveys (tenant_id, title, description, status, is_anonymous, start_date, end_date, created_by)
    VALUES (v_tenant_id, 'Training Feedback: OHS Act Compliance (Oct 2025)',
            'Post-training evaluation for the OHS Act compliance course held 22 October 2025.',
            'CLOSED', FALSE, '2025-10-23', '2025-10-30', v_emp_nzimande)
    RETURNING id INTO v_survey_ohs;

    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_ohs, 'Overall, how would you rate this training? (1=Poor, 5=Excellent)', 'RATING', 1, TRUE)
    RETURNING id INTO v_sq2_overall;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_ohs, 'How relevant was the content to your daily work?', 'RATING', 2, TRUE)
    RETURNING id INTO v_sq2_relevance;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_ohs, 'How would you rate the quality of the training material?', 'RATING', 3, TRUE)
    RETURNING id INTO v_sq2_content;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_ohs, 'How effective was the trainer in delivering the content?', 'RATING', 4, TRUE)
    RETURNING id INTO v_sq2_trainer;
    INSERT INTO survey_questions (tenant_id, survey_id, question_text, question_type, display_order, is_required)
    VALUES (v_tenant_id, v_survey_ohs, 'Any additional comments or suggestions for improvement?', 'TEXT', 5, FALSE)
    RETURNING id INTO v_sq2_comment;

    -- OHS Responses — Senzo Dladla
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_overall, v_emp_dladla, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_relevance, v_emp_dladla, 5);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_content, v_emp_dladla, 3);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_trainer, v_emp_dladla, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_ohs, v_sq2_comment, v_emp_dladla, 'The confined space entry section was very relevant for WTW work. Chemical handling module needs updating — we now use different coagulants than what was covered.');

    -- OHS Responses — Nkosinathi Radebe
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_overall, v_emp_radebe, 3);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_relevance, v_emp_radebe, 2);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_content, v_emp_radebe, 3);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_trainer, v_emp_radebe, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_ohs, v_sq2_comment, v_emp_radebe, 'As a community liaison officer most of the technical OHS content was not relevant to my role. Suggest separate sessions for office-based vs. field staff.');

    -- OHS Responses — Nomvula Nzimande
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_overall, v_emp_nzimande, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_relevance, v_emp_nzimande, 3);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_content, v_emp_nzimande, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_trainer, v_emp_nzimande, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_ohs, v_sq2_comment, v_emp_nzimande, 'Good overview of employer responsibilities under the OHS Act. The incident investigation section will help me better support managers with workplace injury reporting.');

    -- OHS Responses — Ayesha Pillay
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_overall, v_emp_pillay, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_relevance, v_emp_pillay, 3);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_content, v_emp_pillay, 4);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, rating) VALUES (v_tenant_id, v_survey_ohs, v_sq2_trainer, v_emp_pillay, 5);
    INSERT INTO survey_responses (tenant_id, survey_id, question_id, employee_id, text_response) VALUES (v_tenant_id, v_survey_ohs, v_sq2_comment, v_emp_pillay, 'Trainer was excellent — very engaging. The practical fire extinguisher demonstration was a highlight.');

    RAISE NOTICE 'Created training feedback surveys with responses';

    RAISE NOTICE 'uThukela Water demo data seeded successfully!';

END $$;
