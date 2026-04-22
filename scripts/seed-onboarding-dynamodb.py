#!/usr/bin/env python3
"""
Direct DynamoDB onboarding seeder — templates and checklists for uThukela Water.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%SZ')


def new_id(unique_key):
    seed = f"{TENANT_ID}:ONBOARDING:{unique_key}"
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


# ── Templates ──────────────────────────────────────────────────────
STANDARD_ITEMS = json.dumps([
    {"title": "Complete personal information form", "description": "Fill in all personal details in the HR system", "category": "HR", "order": 1},
    {"title": "Submit certified ID copy", "description": "Provide certified copy of South African ID", "category": "HR", "order": 2},
    {"title": "Set up IT accounts", "description": "Email, VPN access, and system credentials", "category": "IT", "order": 3},
    {"title": "Attend health and safety induction", "description": "Mandatory OHS Act compliance training", "category": "SAFETY", "order": 4},
    {"title": "Review employee handbook", "description": "Read and acknowledge company policies", "category": "POLICY", "order": 5},
    {"title": "Meet with line manager", "description": "Initial 1-on-1 to discuss role expectations", "category": "MANAGER", "order": 6},
    {"title": "Complete POPIA consent forms", "description": "Sign data processing consent as per POPIA", "category": "COMPLIANCE", "order": 7},
    {"title": "Enrol for benefits", "description": "Medical aid, provident fund, group life cover", "category": "BENEFITS", "order": 8},
])

WATER_TECH_ITEMS = json.dumps([
    {"title": "Complete personal information form", "description": "Fill in all personal details in the HR system", "category": "HR", "order": 1},
    {"title": "Submit certified ID copy", "description": "Provide certified copy of South African ID", "category": "HR", "order": 2},
    {"title": "Set up IT accounts", "description": "Email, VPN access, and system credentials", "category": "IT", "order": 3},
    {"title": "Attend health and safety induction", "description": "Mandatory OHS Act compliance training", "category": "SAFETY", "order": 4},
    {"title": "Review employee handbook", "description": "Read and acknowledge company policies", "category": "POLICY", "order": 5},
    {"title": "Water treatment safety orientation", "description": "Site-specific safety procedures for treatment works", "category": "SAFETY", "order": 6},
    {"title": "Blue Drop certification briefing", "description": "Overview of Blue Drop water quality requirements", "category": "TECHNICAL", "order": 7},
    {"title": "SCADA system training", "description": "Training on supervisory control and data acquisition systems", "category": "TECHNICAL", "order": 8},
    {"title": "Chemical handling certification", "description": "Chlorine and coagulant handling procedures", "category": "TECHNICAL", "order": 9},
    {"title": "Emergency response drill", "description": "Participate in water contamination emergency drill", "category": "SAFETY", "order": 10},
])

TEMPLATES = [
    {"key": "standard", "name": "New Employee Standard Onboarding", "description": "Standard onboarding checklist for all new uThukela Water employees", "department": "", "items": STANDARD_ITEMS},
    {"key": "water-tech", "name": "Water Services Technician Onboarding", "description": "Extended onboarding for Water Services division technical staff", "department": "Water Services", "items": WATER_TECH_ITEMS},
]


def seed_templates():
    print("Seeding onboarding templates...")
    template_ids = {}
    ok = fail = 0
    for t in TEMPLATES:
        tid = new_id(f"template-{t['key']}")
        template_ids[t['key']] = tid
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'ONBOARD_TEMPLATE#{tid}'},
            'id':        {'S': tid},
            'tenantId':  {'S': TENANT_ID},
            'name':      {'S': t['name']},
            'description': {'S': t['description']},
            'department': {'S': t['department']},
            'isActive':  {'BOOL': True},
            'itemsJson': {'S': t['items']},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Template: {t['name']}")
            ok += 1
        else:
            print(f"  FAIL Template {t['name']}: {err}", file=sys.stderr)
            fail += 1
    return template_ids, ok, fail


# ── Checklists ─────────────────────────────────────────────────────
def make_checklist_items(template_items_json, completed_count):
    """Mark first N items as completed, rest as pending."""
    items = json.loads(template_items_json)
    result = []
    for i, item in enumerate(items):
        status = "COMPLETED" if i < completed_count else "PENDING"
        completed_at = (now - timedelta(days=len(items) - i)).strftime('%Y-%m-%dT%H:%M:%SZ') if status == "COMPLETED" else None
        entry = {"title": item["title"], "description": item["description"], "category": item.get("category", ""), "order": item.get("order", i + 1), "status": status}
        if completed_at:
            entry["completedAt"] = completed_at
        result.append(entry)
    return json.dumps(result)


def seed_checklists(template_ids):
    print("Seeding onboarding checklists...")
    hr_manager_id = emp_id('UTH-002')

    checklists = [
        # Mandla Shabalala (UTH-010) — recent hire, COMPLETED standard onboarding
        {"key": "cl-1", "empNum": "UTH-010", "template": "standard", "status": "COMPLETED",
         "startDate": "2022-01-10", "dueDate": "2022-02-10", "completedItems": 8},
        # Zanele Mthembu (UTH-009) — COMPLETED standard onboarding
        {"key": "cl-2", "empNum": "UTH-009", "template": "standard", "status": "COMPLETED",
         "startDate": "2021-08-01", "dueDate": "2021-09-01", "completedItems": 8},
        # Simulated new hire — IN_PROGRESS water tech onboarding (6 of 10 done)
        {"key": "cl-3", "empNum": "UTH-005", "template": "water-tech", "status": "IN_PROGRESS",
         "startDate": (now - timedelta(days=14)).strftime('%Y-%m-%d'),
         "dueDate": (now + timedelta(days=16)).strftime('%Y-%m-%d'), "completedItems": 6},
        # Simulated OVERDUE onboarding (only 3 of 8 done, past due date)
        {"key": "cl-4", "empNum": "UTH-006", "template": "standard", "status": "OVERDUE",
         "startDate": (now - timedelta(days=45)).strftime('%Y-%m-%d'),
         "dueDate": (now - timedelta(days=15)).strftime('%Y-%m-%d'), "completedItems": 3},
    ]

    ok = fail = 0
    for cl in checklists:
        cid = new_id(cl['key'])
        eid = emp_id(cl['empNum'])
        tmpl_key = cl['template']
        tmpl_id = template_ids[tmpl_key]
        tmpl_items = STANDARD_ITEMS if tmpl_key == 'standard' else WATER_TECH_ITEMS
        items_json = make_checklist_items(tmpl_items, cl['completedItems'])

        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'ONBOARD_CHECKLIST#{cid}'},
            'GSI1PK':    {'S': f'OB_CL_EMP#{TENANT_ID}#{eid}'},
            'GSI1SK':    {'S': f'ONBOARD_CHECKLIST#{cid}'},
            'id':        {'S': cid},
            'tenantId':  {'S': TENANT_ID},
            'employeeId': {'S': eid},
            'templateId': {'S': tmpl_id},
            'startDate': {'S': cl['startDate']},
            'dueDate':   {'S': cl['dueDate']},
            'status':    {'S': cl['status']},
            'assignedHrId': {'S': hr_manager_id},
            'itemsJson': {'S': items_json},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Checklist {cl['key']}: {cl['empNum']} ({cl['status']})")
            ok += 1
        else:
            print(f"  FAIL Checklist {cl['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    total_ok = total_fail = 0

    template_ids, ok, fail = seed_templates()
    total_ok += ok; total_fail += fail

    ok, fail = seed_checklists(template_ids)
    total_ok += ok; total_fail += fail

    print(f"\nDone: {total_ok} created, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
