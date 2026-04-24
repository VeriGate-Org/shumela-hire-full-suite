#!/usr/bin/env python3
"""
Direct DynamoDB seeder — grievances, disciplinary cases, DSAR requests,
consent records, and compliance reminders for uThukela Water.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')


def new_id(unique_key):
    seed = f"{TENANT_ID}:LABOUR:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def emp_id(emp_number):
    seed = f"{TENANT_ID}:EMPLOYEE:{emp_number}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def put_item(item):
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME,
         '--region', REGION,
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


def date_ago(days):
    return (now - timedelta(days=days)).strftime('%Y-%m-%d')


def dt_ago(days):
    return (now - timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S')


def date_ahead(days):
    return (now + timedelta(days=days)).strftime('%Y-%m-%d')


# ── Grievances ─────────────────────────────────────────────────────
GRIEVANCES = [
    {"key": "griev-1", "empNum": "UTH-005", "type": "WORKPLACE_CONDITIONS",
     "description": "Inadequate ventilation at Estcourt Treatment Works chemical storage area. Staff report headaches during summer months when chlorine levels are higher.",
     "status": "RESOLVED", "resolution": "Industrial fans installed and ventilation ducts upgraded. Air quality monitoring system deployed.",
     "filedDate": date_ago(90), "resolvedDate": date_ago(45), "assignedTo": "UTH-001"},
    {"key": "griev-2", "empNum": "UTH-009", "type": "UNFAIR_TREATMENT",
     "description": "Unequal distribution of overtime opportunities in the Supply Chain division. Some team members consistently receive more overtime than others.",
     "status": "UNDER_REVIEW", "resolution": "",
     "filedDate": date_ago(14), "resolvedDate": "", "assignedTo": "UTH-002"},
    {"key": "griev-3", "empNum": "UTH-007", "type": "HARASSMENT",
     "description": "Inappropriate comments made by a community member during a public participation event. Employee feels unsafe conducting future community visits alone.",
     "status": "FILED", "resolution": "",
     "filedDate": date_ago(5), "resolvedDate": "", "assignedTo": "UTH-002"},
    {"key": "griev-4", "empNum": "UTH-006", "type": "POLICY_DISPUTE",
     "description": "Disagreement over IT equipment replacement policy. Request for upgraded workstation was denied despite documented performance impact.",
     "status": "WITHDRAWN", "resolution": "Employee withdrew grievance after receiving interim laptop upgrade.",
     "filedDate": date_ago(60), "resolvedDate": date_ago(50), "assignedTo": "UTH-001"},
]


def seed_grievances():
    print("Seeding grievances...")
    ok = fail = 0
    for g in GRIEVANCES:
        gid = new_id(g['key'])
        eid = emp_id(g['empNum'])
        assigned_id = emp_id(g['assignedTo'])
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'GRIEVANCE#{gid}'},
            'GSI1PK':    {'S': f'GRIEV_EMP#{TENANT_ID}#{eid}'},
            'GSI1SK':    {'S': f'GRIEVANCE#{gid}'},
            'id':        {'S': gid},
            'tenantId':  {'S': TENANT_ID},
            'employeeId': {'S': eid},
            'grievanceType': {'S': g['type']},
            'description': {'S': g['description']},
            'status':    {'S': g['status']},
            'resolution': {'S': g['resolution']},
            'filedDate': {'S': g['filedDate']},
            'resolvedDate': {'S': g['resolvedDate']},
            'assignedToId': {'S': assigned_id},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Grievance: {g['key']} ({g['status']})")
            ok += 1
        else:
            print(f"  FAIL Grievance {g['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


# ── Disciplinary Cases ─────────────────────────────────────────────
DISCIPLINARY = [
    {"key": "disc-1", "empNum": "UTH-008", "category": "MISCONDUCT",
     "description": "Failed to follow lockout/tagout procedures during pump maintenance. Potential safety hazard identified during routine OHS inspection.",
     "incidentDate": date_ago(120), "hearingDate": date_ago(100),
     "status": "CLOSED", "outcome": "WRITTEN_WARNING", "outcomeDate": date_ago(95),
     "notes": "Employee completed remedial safety training. No further incidents reported.",
     "createdBy": "UTH-001"},
    {"key": "disc-2", "empNum": "UTH-010", "category": "ATTENDANCE",
     "description": "Pattern of late arrivals to morning shift at Estcourt Treatment Works. Three documented instances in two weeks without prior notification.",
     "incidentDate": date_ago(21), "hearingDate": date_ahead(7),
     "status": "HEARING_SCHEDULED", "outcome": "", "outcomeDate": "",
     "notes": "Employee cited transport difficulties. HR investigating options.",
     "createdBy": "UTH-002"},
    {"key": "disc-3", "empNum": "UTH-009", "category": "INSUBORDINATION",
     "description": "Refused to process an urgent procurement requisition, citing workload. Matter escalated by Finance Manager.",
     "incidentDate": date_ago(180), "hearingDate": date_ago(170),
     "status": "CLOSED", "outcome": "VERBAL_WARNING", "outcomeDate": date_ago(168),
     "notes": "Workload review conducted. Additional SCM officer position approved.",
     "createdBy": "UTH-004"},
]


def seed_disciplinary():
    print("Seeding disciplinary cases...")
    ok = fail = 0
    for d in DISCIPLINARY:
        did = new_id(d['key'])
        eid = emp_id(d['empNum'])
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'DISCIPLINARY#{did}'},
            'GSI1PK':    {'S': f'DISC_EMP#{TENANT_ID}#{eid}'},
            'GSI1SK':    {'S': f'DISCIPLINARY#{did}'},
            'id':        {'S': did},
            'tenantId':  {'S': TENANT_ID},
            'employeeId': {'S': eid},
            'offenceCategory': {'S': d['category']},
            'offenceDescription': {'S': d['description']},
            'incidentDate': {'S': d['incidentDate']},
            'hearingDate': {'S': d['hearingDate']},
            'status':    {'S': d['status']},
            'outcome':   {'S': d['outcome']},
            'outcomeDate': {'S': d['outcomeDate']},
            'notes':     {'S': d['notes']},
            'createdBy': {'S': emp_id(d['createdBy'])},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Disciplinary: {d['key']} ({d['status']})")
            ok += 1
        else:
            print(f"  FAIL Disciplinary {d['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


# ── DSAR Requests ──────────────────────────────────────────────────
DSARS = [
    {"key": "dsar-1", "name": "Lindiwe Ngcobo", "email": "employee@uthukela.shumelahire.co.za",
     "type": "ACCESS", "description": "Request for access to all personal data held on file as per POPIA Section 23.",
     "status": "COMPLETED", "response": "Full data export provided including employment records, leave history, and performance reviews.",
     "dueDate": date_ago(10), "completedAt": dt_ago(15), "days_ago": 30},
    {"key": "dsar-2", "name": "Johan Pretorius", "email": "johan.pretorius@uthukela.shumelahire.co.za",
     "type": "RECTIFICATION", "description": "Request to correct incorrect banking details on payroll record.",
     "status": "UNDER_PROCESSING", "response": "",
     "dueDate": date_ahead(10), "completedAt": "", "days_ago": 5},
    {"key": "dsar-3", "name": "Former Employee", "email": "former.employee@example.com",
     "type": "ERASURE", "description": "Former employee requests erasure of personal data as per POPIA Section 24. Employment ended 2 years ago.",
     "status": "RECEIVED", "response": "",
     "dueDate": date_ahead(25), "completedAt": "", "days_ago": 2},
]


def seed_dsars():
    print("Seeding DSAR requests...")
    ok = fail = 0
    for d in DSARS:
        did = new_id(d['key'])
        created_at = dt_ago(d['days_ago'])
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'DSAR#{did}'},
            'GSI1PK':    {'S': f'DSAR_STATUS#{TENANT_ID}#{d["status"]}'},
            'GSI1SK':    {'S': f'{created_at}#{did}'},
            'id':        {'S': did},
            'tenantId':  {'S': TENANT_ID},
            'requesterName': {'S': d['name']},
            'requesterEmail': {'S': d['email']},
            'requestType': {'S': d['type']},
            'description': {'S': d['description']},
            'status':    {'S': d['status']},
            'response':  {'S': d['response']},
            'dueDate':   {'S': d['dueDate']},
            'completedAt': {'S': d['completedAt']},
            'createdAt': {'S': created_at},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  DSAR: {d['key']} ({d['type']}, {d['status']})")
            ok += 1
        else:
            print(f"  FAIL DSAR {d['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


# ── Consent Records ───────────────────────────────────────────────
CONSENT_TYPES = [
    ("BIOMETRIC", "Collection and processing of biometric data for access control"),
    ("BACKGROUND_CHECK", "Consent to conduct pre-employment and periodic background checks"),
    ("ANALYTICS", "Use of personal data for workforce analytics and planning"),
    ("MARKETING", "Receipt of internal communications and wellness programme updates"),
    ("DATA_SHARING", "Sharing of personal data with third-party benefit providers"),
    ("PROFILING", "Automated profiling for performance and development recommendations"),
]

EMPLOYEE_NUMS = [f"UTH-{i:03d}" for i in range(1, 11)]


def seed_consents():
    print("Seeding consent records...")
    ok = fail = 0
    for emp_num in EMPLOYEE_NUMS:
        eid = emp_id(emp_num)
        for ct, purpose in CONSENT_TYPES:
            cid = new_id(f"consent-{emp_num}-{ct}")
            # Vary consent status — most granted, some not, a couple withdrawn
            emp_idx = int(emp_num.split('-')[1])
            ct_idx = CONSENT_TYPES.index((ct, purpose))
            is_granted = True
            withdrawn_at = ''
            granted_at = dt_ago(180 + emp_idx * 5)

            # UTH-007 and UTH-008 decline PROFILING
            if ct == 'PROFILING' and emp_num in ('UTH-007', 'UTH-008'):
                is_granted = False
                granted_at = ''
            # UTH-004 withdrew MARKETING consent
            elif ct == 'MARKETING' and emp_num == 'UTH-004':
                is_granted = False
                withdrawn_at = dt_ago(30)
            # UTH-006 withdrew DATA_SHARING consent
            elif ct == 'DATA_SHARING' and emp_num == 'UTH-006':
                is_granted = False
                withdrawn_at = dt_ago(45)

            created_at = dt_ago(180 + emp_idx * 5)
            item = {
                'PK':        {'S': f'TENANT#{TENANT_ID}'},
                'SK':        {'S': f'CONSENT#{cid}'},
                'GSI1PK':    {'S': f'CONSENT_EMP#{TENANT_ID}#{eid}'},
                'GSI1SK':    {'S': f'{ct}#{cid}'},
                'id':        {'S': cid},
                'tenantId':  {'S': TENANT_ID},
                'employeeId': {'S': eid},
                'consentType': {'S': ct},
                'purpose':   {'S': purpose},
                'isGranted': {'BOOL': is_granted},
                'grantedAt': {'S': granted_at},
                'withdrawnAt': {'S': withdrawn_at},
                'ipAddress': {'S': '10.0.1.100'},
                'createdAt': {'S': created_at},
            }
            success, err = put_item(item)
            if success:
                ok += 1
            else:
                fail += 1
    print(f"  OK  {ok} consent records seeded")
    return ok, fail


# ── Compliance Reminders ──────────────────────────────────────────
REMINDERS = [
    {"key": "rem-1", "type": "DOCUMENT_EXPIRY", "entity": "POLICY", "empNum": "UTH-002",
     "title": "Annual POPIA Policy Review", "description": "Review and update the company POPIA compliance policy for 2026/27 financial year.",
     "dueDate": date_ahead(30), "status": "PENDING"},
    {"key": "rem-2", "type": "DOCUMENT_EXPIRY", "entity": "POLICY", "empNum": "UTH-001",
     "title": "OHS Policy Annual Review", "description": "Annual review of Occupational Health and Safety policy as per OHS Act requirements.",
     "dueDate": date_ahead(45), "status": "PENDING"},
    {"key": "rem-3", "type": "CERTIFICATION_EXPIRY", "entity": "EMPLOYEE", "empNum": "UTH-005",
     "title": "Water Process Controller Certificate Renewal", "description": "Lindiwe Ngcobo's Water Process Controller Level 4 certification expires soon. Renewal application required.",
     "dueDate": date_ahead(60), "status": "PENDING"},
    {"key": "rem-4", "type": "CERTIFICATION_EXPIRY", "entity": "EMPLOYEE", "empNum": "UTH-010",
     "title": "Water Quality Analyst Certification", "description": "Mandla Shabalala must complete SANAS-accredited water quality analysis certification.",
     "dueDate": date_ahead(90), "status": "PENDING"},
    {"key": "rem-5", "type": "CONTRACT_EXPIRY", "entity": "DSAR", "empNum": "UTH-002",
     "title": "DSAR Response Deadline", "description": "POPIA requires response to data subject access requests within 30 days. Pending request requires attention.",
     "dueDate": date_ahead(10), "status": "PENDING"},
    {"key": "rem-6", "type": "MEDICAL_CHECKUP", "entity": "TRAINING", "empNum": "UTH-008",
     "title": "Lockout/Tagout Refresher Training", "description": "Johan Pretorius due for mandatory LOTO refresher training following disciplinary outcome.",
     "dueDate": date_ahead(14), "status": "PENDING"},
    {"key": "rem-7", "type": "PROBATION_END", "entity": "AUDIT", "empNum": "UTH-004",
     "title": "Internal Payroll Audit", "description": "Quarterly internal audit of payroll processes and data integrity checks.",
     "dueDate": date_ahead(20), "status": "PENDING"},
    {"key": "rem-8", "type": "CERTIFICATION_EXPIRY", "entity": "TRAINING", "empNum": "UTH-005",
     "title": "Chemical Handling Certification Completed", "description": "Lindiwe completed chemical handling re-certification ahead of schedule.",
     "dueDate": date_ago(15), "status": "COMPLETED"},
]


def seed_reminders():
    print("Seeding compliance reminders...")
    ok = fail = 0
    for r in REMINDERS:
        rid = new_id(r['key'])
        eid = emp_id(r['empNum'])
        entity_id = new_id(f"entity-{r['key']}")
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'COMP_REMINDER#{rid}'},
            'GSI1PK':    {'S': f'COMP_REM_EMP#{TENANT_ID}#{eid}'},
            'GSI1SK':    {'S': f'{r["dueDate"]}#{rid}'},
            'id':        {'S': rid},
            'tenantId':  {'S': TENANT_ID},
            'reminderType': {'S': r['type']},
            'entityType': {'S': r['entity']},
            'entityId':  {'S': entity_id},
            'employeeId': {'S': eid},
            'title':     {'S': r['title']},
            'description': {'S': r['description']},
            'dueDate':   {'S': r['dueDate']},
            'status':    {'S': r['status']},
            'sentAt':    {'S': ''},
            'acknowledgedAt': {'S': ''},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Reminder: {r['title'][:50]}...")
            ok += 1
        else:
            print(f"  FAIL Reminder {r['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    total_ok = total_fail = 0

    ok, fail = seed_grievances()
    total_ok += ok; total_fail += fail

    ok, fail = seed_disciplinary()
    total_ok += ok; total_fail += fail

    ok, fail = seed_dsars()
    total_ok += ok; total_fail += fail

    ok, fail = seed_consents()
    total_ok += ok; total_fail += fail

    ok, fail = seed_reminders()
    total_ok += ok; total_fail += fail

    print(f"\nDone: {total_ok} created, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
