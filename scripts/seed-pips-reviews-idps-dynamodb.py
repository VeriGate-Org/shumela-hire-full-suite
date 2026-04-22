#!/usr/bin/env python3
"""
Direct DynamoDB seeder — Performance Improvement Plans (PIPs), milestones,
and Individual Development Plans (IDPs) for uThukela Water.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')


def new_id(unique_key):
    seed = f"{TENANT_ID}:PIP_IDP:{unique_key}"
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


def date_ahead(days):
    return (now + timedelta(days=days)).strftime('%Y-%m-%d')


def dt_ago(days):
    return (now - timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S')


# ── PIPs ───────────────────────────────────────────────────────────
PIPS = [
    {"key": "pip-1", "empNum": "UTH-010", "managerNum": "UTH-005",
     "reason": "Consistent late arrivals to morning shifts at Estcourt Treatment Works. Three documented incidents in the past month affecting water quality monitoring schedule.",
     "startDate": date_ago(30), "endDate": date_ahead(60),
     "status": "ACTIVE", "outcome": ""},
    {"key": "pip-2", "empNum": "UTH-009", "managerNum": "UTH-004",
     "reason": "Procurement processing times exceeding SLA targets. Average turnaround of 15 days vs 7-day target for routine requisitions.",
     "startDate": date_ago(120), "endDate": date_ago(30),
     "status": "COMPLETED", "outcome": "SUCCESSFUL"},
]

# Milestones for pip-1 (ACTIVE)
PIP1_MILESTONES = [
    {"key": "mile-1-1", "pip": "pip-1",
     "title": "Identify root causes for late arrivals",
     "description": "Document transport challenges and propose solutions with HR support.",
     "targetDate": date_ago(20), "status": "COMPLETED",
     "evidence": "Transport assessment completed. Public transport schedule incompatible with 06:00 shift start. Proposed carpool arrangement with Newcastle-based colleagues."},
    {"key": "mile-1-2", "pip": "pip-1",
     "title": "Implement revised transport arrangement",
     "description": "Begin using approved carpool arrangement or alternative transport. Zero late arrivals for 2 consecutive weeks.",
     "targetDate": date_ahead(10), "status": "IN_PROGRESS",
     "evidence": "Carpool arrangement started with Johan Pretorius. 1 late arrival in first week due to vehicle breakdown."},
    {"key": "mile-1-3", "pip": "pip-1",
     "title": "Sustained punctuality for 30 days",
     "description": "Demonstrate consistent on-time arrival for 30 consecutive working days. Manager sign-off required.",
     "targetDate": date_ahead(50), "status": "PENDING",
     "evidence": ""},
]

# Milestones for pip-2 (COMPLETED)
PIP2_MILESTONES = [
    {"key": "mile-2-1", "pip": "pip-2",
     "title": "Process backlog clearance",
     "description": "Clear all outstanding requisitions older than 14 days.",
     "targetDate": date_ago(100), "status": "COMPLETED",
     "evidence": "All 23 outstanding requisitions processed. Backlog cleared by target date."},
    {"key": "mile-2-2", "pip": "pip-2",
     "title": "Meet 7-day SLA for 4 consecutive weeks",
     "description": "Process all routine requisitions within 7 working days for a full month.",
     "targetDate": date_ago(60), "status": "COMPLETED",
     "evidence": "Average processing time reduced to 4.5 days. All 31 requisitions completed within SLA."},
]


def seed_pips():
    print("Seeding PIPs...")
    pip_ids = {}
    ok = fail = 0
    for p in PIPS:
        pid = new_id(p['key'])
        pip_ids[p['key']] = pid
        eid = emp_id(p['empNum'])
        mid = emp_id(p['managerNum'])
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'PIP#{pid}'},
            'GSI1PK':    {'S': f'PIP_EMP#{TENANT_ID}#{eid}'},
            'GSI1SK':    {'S': f'PIP#{pid}'},
            'id':        {'S': pid},
            'tenantId':  {'S': TENANT_ID},
            'employeeId': {'S': eid},
            'managerId': {'S': mid},
            'reason':    {'S': p['reason']},
            'startDate': {'S': p['startDate']},
            'endDate':   {'S': p['endDate']},
            'status':    {'S': p['status']},
            'outcome':   {'S': p['outcome']},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  PIP: {p['key']} ({p['status']})")
            ok += 1
        else:
            print(f"  FAIL PIP {p['key']}: {err}", file=sys.stderr)
            fail += 1
    return pip_ids, ok, fail


def seed_milestones(pip_ids):
    print("Seeding PIP milestones...")
    all_milestones = PIP1_MILESTONES + PIP2_MILESTONES
    ok = fail = 0
    for m in all_milestones:
        mid = new_id(m['key'])
        pid = pip_ids.get(m['pip'], '')
        reviewed_at = dt_ago(5) if m['status'] == 'COMPLETED' else ''
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'PIP_MILE#{mid}'},
            'GSI1PK':    {'S': f'PM_PIP#{TENANT_ID}#{pid}'},
            'GSI1SK':    {'S': f'PIP_MILE#{m["targetDate"]}'},
            'id':        {'S': mid},
            'tenantId':  {'S': TENANT_ID},
            'pipId':     {'S': pid},
            'title':     {'S': m['title']},
            'description': {'S': m['description']},
            'targetDate': {'S': m['targetDate']},
            'status':    {'S': m['status']},
            'evidence':  {'S': m['evidence']},
            'reviewedAt': {'S': reviewed_at},
            'createdAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Milestone: {m['title'][:40]}... ({m['status']})")
            ok += 1
        else:
            print(f"  FAIL Milestone {m['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


# ── IDPs ───────────────────────────────────────────────────────────
IDPS = [
    {"key": "idp-1", "empNum": "UTH-005", "managerNum": "UTH-003",
     "title": "Water Treatment Leadership Development",
     "description": "Develop leadership and advanced technical skills to prepare for senior process controller role.",
     "startDate": date_ago(60), "targetDate": date_ahead(300),
     "status": "ACTIVE",
     "goals": [
         {"title": "Complete Water Process Controller Level 5 certification", "status": "IN_PROGRESS", "targetDate": date_ahead(120)},
         {"title": "Lead a cross-functional Blue Drop improvement project", "status": "NOT_STARTED", "targetDate": date_ahead(200)},
         {"title": "Mentor two junior technicians", "status": "IN_PROGRESS", "targetDate": date_ahead(250)},
     ]},
    {"key": "idp-2", "empNum": "UTH-010", "managerNum": "UTH-005",
     "title": "Water Quality Analysis Specialisation",
     "description": "Develop advanced water quality analysis skills and obtain SANAS laboratory accreditation support.",
     "startDate": date_ago(30), "targetDate": date_ahead(335),
     "status": "ACTIVE",
     "goals": [
         {"title": "Complete SANAS 17025 awareness training", "status": "IN_PROGRESS", "targetDate": date_ahead(60)},
         {"title": "Obtain advanced microbiological analysis certification", "status": "NOT_STARTED", "targetDate": date_ahead(180)},
         {"title": "Publish water quality findings in municipal report", "status": "NOT_STARTED", "targetDate": date_ahead(300)},
     ]},
    {"key": "idp-3", "empNum": "UTH-007", "managerNum": "UTH-001",
     "title": "Community Engagement Leadership Programme",
     "description": "Enhanced community liaison and stakeholder management skills development.",
     "startDate": date_ago(365), "targetDate": date_ago(30),
     "status": "COMPLETED",
     "goals": [
         {"title": "Complete Municipal Communication Diploma modules", "status": "COMPLETED", "targetDate": date_ago(180)},
         {"title": "Lead 4 community engagement sessions independently", "status": "COMPLETED", "targetDate": date_ago(90)},
         {"title": "Develop community feedback reporting template", "status": "COMPLETED", "targetDate": date_ago(45)},
     ]},
    {"key": "idp-4", "empNum": "UTH-006", "managerNum": "UTH-001",
     "title": "ICT Infrastructure Modernisation Skills",
     "description": "Upskill in cloud technologies and cybersecurity for municipal IT infrastructure modernisation.",
     "startDate": "", "targetDate": "",
     "status": "DRAFT",
     "goals": [
         {"title": "AWS Solutions Architect Associate certification", "status": "NOT_STARTED", "targetDate": ""},
         {"title": "Complete CISSP preparation course", "status": "NOT_STARTED", "targetDate": ""},
         {"title": "Lead SCADA system migration project", "status": "NOT_STARTED", "targetDate": ""},
     ]},
]


def seed_idps():
    print("Seeding IDPs...")
    ok = fail = 0
    for idp in IDPS:
        iid = new_id(idp['key'])
        eid = emp_id(idp['empNum'])
        mid = emp_id(idp['managerNum'])
        goals_json = json.dumps(idp['goals'])

        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'IDP#{iid}'},
            'GSI1PK':    {'S': f'IDP_EMP#{TENANT_ID}#{eid}'},
            'GSI1SK':    {'S': f'IDP#{iid}'},
            'id':        {'S': iid},
            'tenantId':  {'S': TENANT_ID},
            'employeeId': {'S': eid},
            'title':     {'S': idp['title']},
            'description': {'S': idp['description']},
            'startDate': {'S': idp['startDate']},
            'targetDate': {'S': idp['targetDate']},
            'status':    {'S': idp['status']},
            'managerId': {'S': mid},
            'goalsJson': {'S': goals_json},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  IDP: {idp['title'][:50]}... ({idp['status']})")
            ok += 1
        else:
            print(f"  FAIL IDP {idp['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    total_ok = total_fail = 0

    pip_ids, ok, fail = seed_pips()
    total_ok += ok; total_fail += fail

    ok, fail = seed_milestones(pip_ids)
    total_ok += ok; total_fail += fail

    ok, fail = seed_idps()
    total_ok += ok; total_fail += fail

    print(f"\nDone: {total_ok} created, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
