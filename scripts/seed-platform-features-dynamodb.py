#!/usr/bin/env python3
"""
Direct DynamoDB platform features seeder.

Seeds the feature registry into DynamoDB so that FeatureGateService
can resolve tenant entitlements. Mirrors V019__seed_hrms_module_features.sql.

Features are global (PK=PLATFORM), not tenant-scoped.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone

REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S')


def deterministic_id(code):
    """Generate a deterministic UUID from the feature code so re-runs are idempotent."""
    seed = f"PLATFORM:FEATURE:{code}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def put_item(item):
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--condition-expression', 'attribute_not_exists(PK)',
         '--item', json.dumps(item)],
        capture_output=True, text=True)
    if result.returncode != 0 and 'ConditionalCheckFailedException' not in result.stderr:
        return False, result.stderr.strip()
    return True, ''


def resolve_table():
    global TABLE_NAME
    if TABLE_NAME:
        return
    prefix = os.environ.get('STACK_PREFIX', 'shumelahire-dev')
    result = subprocess.run(
        ['aws', 'cloudformation', 'describe-stacks',
         '--stack-name', f'{prefix}-serverless', '--region', REGION,
         '--query', 'Stacks[0].Outputs[?OutputKey==`DynamoDbTableName`].OutputValue',
         '--output', 'text'], capture_output=True, text=True)
    TABLE_NAME = result.stdout.strip()
    if not TABLE_NAME or TABLE_NAME == 'None':
        TABLE_NAME = f'{prefix}-data'


def build_feature_item(code, name, description, category, included_plans):
    fid = deterministic_id(code)
    is_active = True
    return {
        'PK':     {'S': 'PLATFORM'},
        'SK':     {'S': f'FEATURE#{fid}'},
        # GSI1: active status index
        'GSI1PK': {'S': f'FEATURE_ACTIVE#{str(is_active).lower()}'},
        'GSI1SK': {'S': f'FEATURE#{code}'},
        # GSI3: category index
        'GSI3PK': {'S': f'FEATURE_CATEGORY#{category}'},
        'GSI3SK': {'S': f'FEATURE#{code}'},
        # GSI4: unique constraint on code
        'GSI4PK': {'S': f'FEATURE_CODE#{code}'},
        'GSI4SK': {'S': f'FEATURE#{fid}'},
        # Entity fields
        'id':            {'S': fid},
        'code':          {'S': code},
        'name':          {'S': name},
        'description':   {'S': description},
        'category':      {'S': category},
        'includedPlans': {'S': included_plans},
        'isActive':      {'BOOL': is_active},
        'createdAt':     {'S': now_iso},
        'updatedAt':     {'S': now_iso},
    }


# ── Feature definitions (mirrors V019 + 3 frontend-only features) ──────────

FEATURES = [
    # HR Core
    ('LEAVE_MANAGEMENT', 'Leave Administration',
     'Online leave requests, real-time balance tracking, automated approval workflows, configurable leave policies, leave encashment and carry-forward, and leave analytics.',
     'hr_core', 'STARTER,STANDARD,ENTERPRISE'),

    ('TIME_ATTENDANCE', 'Time & Attendance',
     'Clock-in/clock-out via web and mobile, overtime management, integration with payroll for accurate time tracking.',
     'hr_core', 'STANDARD,ENTERPRISE'),

    ('GEOFENCING', 'GPS Geofencing Attendance',
     'GPS-based attendance verification with configurable geofence zones around work sites. Ensures employees clock in from authorised locations.',
     'hr_core', 'ENTERPRISE'),

    ('SHIFT_SCHEDULING', 'Shift Scheduling',
     'Shift pattern management, roster creation, shift swaps, and schedule conflict detection for multi-site operations.',
     'hr_core', 'STANDARD,ENTERPRISE'),

    ('EMPLOYEE_SELF_SERVICE', 'Employee Self-Service Portal',
     'Employee-facing portal for updating personal information, uploading documents, viewing payslips, and managing leave balances.',
     'hr_core', 'STARTER,STANDARD,ENTERPRISE'),

    ('EMPLOYEE_DOCUMENTS', 'Employee Document Management',
     'Structured document storage for IDs, certifications, and contracts with expiry tracking and automated renewal reminders.',
     'hr_core', 'STARTER,STANDARD,ENTERPRISE'),

    # Talent Development & Performance
    ('TRAINING_MANAGEMENT', 'Training & Development',
     'Track certifications, courses, and development plans. Training attendance tracking, feedback collection, and training effectiveness reporting.',
     'talent_development', 'STANDARD,ENTERPRISE'),

    ('LMS_INTEGRATION', 'LMS Integration',
     'Integration with external Learning Management Systems for online training delivery, progress tracking, and completion certificates.',
     'talent_development', 'ENTERPRISE'),

    ('SKILL_GAP_ANALYSIS', 'Skill Gap Analysis',
     'Automated analysis of employee skills against role requirements and organisational competency frameworks. Generates personalised training recommendations.',
     'talent_development', 'ENTERPRISE'),

    ('PERFORMANCE_360_FEEDBACK', '360-Degree Feedback',
     'Multi-source performance feedback from peers, subordinates, and managers. Anonymous feedback collection with aggregated reporting.',
     'talent_development', 'ENTERPRISE'),

    ('PERFORMANCE_PIP', 'Performance Improvement Plans',
     'Structured PIP workflows with goal-setting, milestone tracking, review schedules, and outcome recording for underperforming employees.',
     'talent_development', 'STANDARD,ENTERPRISE'),

    ('COMPETENCY_MAPPING', 'Competency Framework Mapping',
     'Define organisational competency frameworks and map employees against required competencies. Links to training recommendations and career pathing.',
     'talent_development', 'ENTERPRISE'),

    # Employee Engagement
    ('EMPLOYEE_ENGAGEMENT', 'Employee Engagement',
     'Core engagement module enabling pulse surveys, recognition, and wellness program management.',
     'engagement', 'STANDARD,ENTERPRISE'),

    ('PULSE_SURVEYS', 'Pulse Surveys & Feedback',
     'Create and distribute pulse surveys with anonymous response collection. Real-time sentiment analysis and trend reporting.',
     'engagement', 'STANDARD,ENTERPRISE'),

    ('RECOGNITION_REWARDS', 'Recognition & Rewards',
     'Peer-to-peer and manager recognition system with configurable reward categories, points, and achievement badges.',
     'engagement', 'ENTERPRISE'),

    ('WELLNESS_PROGRAMS', 'Wellness Programs',
     'Employee wellness program management including health tracking, wellness challenges, and EAP (Employee Assistance Programme) referrals.',
     'engagement', 'ENTERPRISE'),

    # Compliance
    ('POPIA_COMPLIANCE', 'POPIA Compliance Management',
     'Consent management, Data Subject Access Request (DSAR) workflows, data retention policies, and privacy impact assessments compliant with POPIA.',
     'compliance', 'STARTER,STANDARD,ENTERPRISE'),

    ('LABOUR_RELATIONS', 'Labour Relations Management',
     'Disciplinary process management, grievance handling, union interaction tracking, and CCMA case management aligned with the Labour Relations Act.',
     'compliance', 'STANDARD,ENTERPRISE'),

    ('COMPLIANCE_REMINDERS', 'Automated Compliance Reminders',
     'Automated notifications for certification renewals, licence expirations, mandatory training deadlines, and regulatory compliance due dates.',
     'compliance', 'STANDARD,ENTERPRISE'),

    # Integrations
    ('SAGE_300_PEOPLE', 'Sage 300 People Integration',
     'Bi-directional real-time sync with Sage 300 People for employee master data, leave balances, and HR transactions.',
     'integrations', 'STANDARD,ENTERPRISE'),

    ('SAGE_EVOLUTION', 'Sage Evolution ERP Integration',
     'Bi-directional real-time sync with Sage Evolution ERP for payroll processing, financial data exchange, and statutory reporting.',
     'integrations', 'STANDARD,ENTERPRISE'),

    ('AD_SSO', 'Active Directory SSO',
     'Full Active Directory integration for single sign-on, group-based role mapping, and centralised user lifecycle management.',
     'integrations', 'STANDARD,ENTERPRISE'),

    ('SAP_PAYROLL', 'SAP Payroll Integration',
     'Integration with SAP SuccessFactors for payroll data transmission, salary processing, and statutory deduction management.',
     'integrations', 'ENTERPRISE'),

    # Automation
    ('WORKFLOW_MANAGEMENT', 'Workflow Management',
     'Visual workflow builder for approval chains, automated task routing, and configurable business process automation.',
     'automation', 'STANDARD,ENTERPRISE'),

    # Analytics & Reporting
    ('ADVANCED_ANALYTICS', 'Advanced HR Analytics',
     'Comprehensive dashboards for leave trends, turnover rates, absenteeism patterns, training effectiveness, and workforce composition across all HR modules.',
     'analytics', 'STANDARD,ENTERPRISE'),

    ('PREDICTIVE_ANALYTICS', 'Predictive Workforce Analytics',
     'AI-powered predictive models for workforce planning, attrition risk scoring, succession planning, and talent demand forecasting.',
     'analytics', 'ENTERPRISE'),

    ('REPORT_EXPORT', 'Report Export (PDF/Excel)',
     'Export any report or dashboard to PDF, Excel, or CSV formats. Supports scheduled automated report generation and email distribution.',
     'analytics', 'STARTER,STANDARD,ENTERPRISE'),

    # Frontend-referenced features not in V019 SQL migration
    ('AI_ENABLED', 'AI Tools',
     'AI-powered tools for job description generation, CV screening, interview question suggestions, and HR analytics insights.',
     'automation', 'STANDARD,ENTERPRISE'),

    ('CUSTOM_BRANDING', 'Custom Branding',
     'Customisable logos, colour themes, and email templates to match your organisation\'s brand identity.',
     'administration', 'ENTERPRISE'),

    ('DOCUMENT_TEMPLATES', 'Document Templates',
     'Pre-built and customisable templates for offer letters, contracts, policies, and other HR documents with merge field support.',
     'administration', 'STANDARD,ENTERPRISE'),

    # Recruitment features (from V016, used by @FeatureGate in controllers)
    ('AI_JOB_DESCRIPTION', 'AI Job Description Generator',
     'AI-powered job description generation with role-specific templates, skills extraction, and inclusive language analysis.',
     'automation', 'STANDARD,ENTERPRISE'),

    ('AI_SCREENING', 'AI Candidate Screening',
     'Automated CV screening and candidate scoring using AI models. Matches candidate profiles against job requirements.',
     'automation', 'STANDARD,ENTERPRISE'),

    ('BACKGROUND_CHECKS', 'Background Checks',
     'Integrated background verification including criminal checks, qualification verification, and reference checks via third-party providers.',
     'compliance', 'STANDARD,ENTERPRISE'),

    # Social & Collaboration
    ('SOCIAL_FEED', 'Social Feed & Collaboration',
     'Employee social feed for announcements, discussions, kudos, and team collaboration. Supports comments, reactions, and content moderation.',
     'engagement', 'STARTER,STANDARD,ENTERPRISE'),
]


def main():
    resolve_table()
    print(f"Seeding {len(FEATURES)} platform features into {TABLE_NAME} ({REGION})")

    ok_count = 0
    skip_count = 0
    fail_count = 0

    for code, name, description, category, included_plans in FEATURES:
        item = build_feature_item(code, name, description, category, included_plans)
        success, err = put_item(item)
        if success:
            if err == '':
                ok_count += 1
                print(f"  + {code}")
            else:
                skip_count += 1
                print(f"  = {code} (already exists)")
        else:
            fail_count += 1
            print(f"  ! {code} FAILED: {err}", file=sys.stderr)

    print(f"\nDone: {ok_count} created, {skip_count} skipped, {fail_count} failed")
    sys.exit(1 if fail_count > 0 else 0)


if __name__ == '__main__':
    main()
