#!/usr/bin/env python3
"""
Direct DynamoDB seeder — seeds portal demo data for the employee user
(Lindiwe Ngcobo, UTH-005, employee@uthukela.shumelahire.co.za).

Creates:
  - Peer recognitions (received by Lindiwe)
  - Leave requests (approved + pending, for Upcoming & Recent)
  - Training enrollments (registered for upcoming sessions)
  - Onboarding checklist (in-progress with items)

Requires: leave types and training courses/sessions already seeded.
Run seed-leave-dynamodb.py and seed-training-dynamodb.py first.
"""
import json, os, sys, uuid, subprocess, hashlib, random
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')
random.seed(99)

_id_counter = 0


def new_id(unique_key=None):
    global _id_counter
    if unique_key is None:
        _id_counter += 1
        unique_key = f"emp-portal-{_id_counter}"
    seed = f"{TENANT_ID}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def emp_id(emp_number):
    seed = f"{TENANT_ID}:EMPLOYEE:{emp_number}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def days_ago(n):
    return now - timedelta(days=n)


def days_from_now(n):
    return now + timedelta(days=n)


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


def resolve_employees():
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'}, ':sk': {'S': 'EMPLOYEE#'}
         }),
         '--projection-expression', 'id,firstName,lastName,department,jobTitle',
         '--output', 'json'], capture_output=True, text=True)
    items = json.loads(result.stdout).get('Items', [])
    return [{
        'id': i['id']['S'],
        'firstName': i.get('firstName', {}).get('S', ''),
        'lastName': i.get('lastName', {}).get('S', ''),
        'department': i.get('department', {}).get('S', ''),
        'jobTitle': i.get('jobTitle', {}).get('S', ''),
    } for i in items]


def resolve_leave_type_ids():
    """Find seeded leave type IDs by querying the GSI."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'}, ':sk': {'S': 'LEAVE_TYPE#'}
         }),
         '--projection-expression', 'id,code',
         '--output', 'json'], capture_output=True, text=True)
    items = json.loads(result.stdout).get('Items', [])
    return {i.get('code', {}).get('S', ''): i['id']['S'] for i in items}


def resolve_training_sessions():
    """Find seeded training session IDs and course info."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'}, ':sk': {'S': 'TRAIN_SESSION#'}
         }),
         '--projection-expression', 'id,courseId,startDate,endDate,#s',
         '--expression-attribute-names', json.dumps({'#s': 'status'}),
         '--output', 'json'], capture_output=True, text=True)
    items = json.loads(result.stdout).get('Items', [])
    return [{
        'id': i['id']['S'],
        'courseId': i.get('courseId', {}).get('S', ''),
        'startDate': i.get('startDate', {}).get('S', ''),
        'endDate': i.get('endDate', {}).get('S', ''),
        'status': i.get('status', {}).get('S', ''),
    } for i in items]


def resolve_training_courses():
    """Find seeded training course IDs."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'}, ':sk': {'S': 'TRAIN_COURSE#'}
         }),
         '--projection-expression', 'id,code,title',
         '--output', 'json'], capture_output=True, text=True)
    items = json.loads(result.stdout).get('Items', [])
    return {i.get('code', {}).get('S', ''): {
        'id': i['id']['S'],
        'title': i.get('title', {}).get('S', ''),
    } for i in items}


# ============================================================
# 1. Recognitions — peers recognising Lindiwe
# ============================================================
def seed_recognitions(employees, lindiwe):
    print("\nSeeding recognitions for Lindiwe...")
    by_name = {e['firstName']: e for e in employees}

    recognitions = [
        ("Thabo",   "GOING_ABOVE",      35, "Lindiwe worked through the weekend to ensure water quality compliance during the Estcourt plant maintenance shutdown."),
        ("Sipho",   "INNOVATION",        30, "Excellent work developing the new chlorine dosing protocol — it reduced chemical waste by 15% while maintaining SANS 241 compliance."),
        ("Nomvula", "CUSTOMER_SERVICE",  25, "Great job handling the Bergville community water quality concerns with patience and professionalism."),
    ]

    created = 0
    for from_name, category, points, message in recognitions:
        from_emp = by_name.get(from_name)
        if not from_emp:
            print(f"  SKIP {from_name} — not found")
            continue
        rid = new_id(f"recog-lindiwe-{from_name}")
        days_offset = random.randint(3, 25)
        created_at = iso(days_ago(days_offset))
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'RECOGNITION#{rid}'},
            'GSI1PK': {'S': f'RECOG_TO#{TENANT_ID}#{lindiwe["id"]}'},
            'GSI1SK': {'S': f'RECOGNITION#{created_at}'},
            'id':              {'S': rid},
            'tenantId':        {'S': TENANT_ID},
            'fromEmployeeId':  {'S': from_emp['id']},
            'toEmployeeId':    {'S': lindiwe['id']},
            'category':        {'S': category},
            'message':         {'S': message},
            'points':          {'N': str(points)},
            'isPublic':        {'BOOL': True},
            'createdAt':       {'S': created_at},
        }
        ok, err = put_item(item)
        if ok:
            created += 1
            print(f"  OK  From {from_name}: {category} ({points} pts)")
        else:
            print(f"  SKIP {from_name} (already exists or error: {err[:60]})")
    return created


# ============================================================
# 2. Leave requests — approved past + pending future
# ============================================================
def seed_leave_requests(lindiwe, type_ids, approver_id):
    print("\nSeeding leave requests for Lindiwe...")

    requests = [
        # APPROVED — past leave (shows in Upcoming & Recent)
        {"type": "SL",  "start": "2026-03-10", "end": "2026-03-12", "days": "3", "status": "APPROVED",
         "reason": "Follow-up treatment for back injury", "medCert": True},
        {"type": "AL",  "start": "2026-04-07", "end": "2026-04-11", "days": "5", "status": "APPROVED",
         "reason": "Family visit to Eastern Cape"},
        # PENDING — upcoming (shows in Upcoming & Recent)
        {"type": "AL",  "start": "2026-05-05", "end": "2026-05-09", "days": "5", "status": "PENDING",
         "reason": "Annual leave — mid-year break"},
        {"type": "SL",  "start": "2026-04-28", "end": "2026-04-28", "days": "1", "status": "PENDING",
         "reason": "Medical appointment", "halfDay": True, "halfDayPeriod": "MORNING"},
    ]

    created = 0
    for req in requests:
        rid = new_id(f"leave-lindiwe-{req['start']}-{req['type']}")
        lt_id = type_ids.get(req['type'], '')
        if not lt_id:
            print(f"  SKIP {req['type']} — leave type not found (run seed-leave-dynamodb.py first)")
            continue

        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'LEAVE_REQ#{rid}'},
            'GSI1PK': {'S': f'LR_EMP#{TENANT_ID}#{lindiwe["id"]}'},
            'GSI1SK': {'S': f'LEAVE_REQ#{rid}'},
            'id':          {'S': rid},
            'tenantId':    {'S': TENANT_ID},
            'employeeId':  {'S': lindiwe['id']},
            'leaveTypeId': {'S': lt_id},
            'startDate':   {'S': req['start']},
            'endDate':     {'S': req['end']},
            'totalDays':   {'S': req['days']},
            'status':      {'S': req['status']},
            'reason':      {'S': req['reason']},
            'createdAt':   {'S': now_iso},
            'updatedAt':   {'S': now_iso},
        }
        if req.get('halfDay'):
            item['isHalfDay'] = {'BOOL': True}
            item['halfDayPeriod'] = {'S': req.get('halfDayPeriod', 'MORNING')}
        if req['status'] == 'APPROVED' and approver_id:
            item['approverId'] = {'S': approver_id}
            item['approvedAt'] = {'S': now_iso}
        if req.get('medCert'):
            item['medicalCertificateUrl'] = {'S': f's3://shumelahire-dev-documents/leave/medical-cert-{rid[:8]}.pdf'}

        ok, err = put_item(item)
        if ok:
            icon = {'APPROVED': '+', 'PENDING': '?'}[req['status']]
            print(f"  [{icon}] {req['type']:4s} {req['start']} -> {req['end']}  {req['status']}")
            created += 1
        else:
            print(f"  SKIP {req['type']} {req['start']} (already exists)")
    return created


# ============================================================
# 3. Training enrollments — registered for upcoming sessions
# ============================================================
def seed_training_enrollments(lindiwe, sessions, courses):
    print("\nSeeding training enrollments for Lindiwe...")

    # Find upcoming/open sessions
    upcoming = [s for s in sessions if s['status'] in ('OPEN', 'PLANNED', 'IN_PROGRESS')]
    if not upcoming:
        print("  WARN No upcoming training sessions found (run seed-training-dynamodb.py first)")
        return 0

    created = 0
    for session in upcoming:
        # Find course info
        course_info = None
        for code, info in courses.items():
            if info['id'] == session['courseId']:
                course_info = (code, info)
                break
        code_label = course_info[0] if course_info else session['courseId'][:8]
        title = course_info[1]['title'] if course_info else 'Unknown Course'

        eid = new_id(f"enroll-lindiwe-{session['id']}")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'TRAIN_ENROLL#{eid}'},
            'GSI1PK': {'S': f'TE_EMP#{TENANT_ID}#{lindiwe["id"]}'},
            'GSI1SK': {'S': f'TRAIN_ENROLL#{eid}'},
            'id':          {'S': eid},
            'tenantId':    {'S': TENANT_ID},
            'sessionId':   {'S': session['id']},
            'courseId':     {'S': session['courseId']},
            'employeeId':  {'S': lindiwe['id']},
            'status':      {'S': 'REGISTERED'},
            'enrolledAt':  {'S': iso(days_ago(5))},
            'createdAt':   {'S': iso(days_ago(5))},
            'updatedAt':   {'S': now_iso},
        }
        ok, err = put_item(item)
        if ok:
            created += 1
            print(f"  OK  {code_label:10s} {title}")
        else:
            print(f"  SKIP {code_label} (already exists)")
    return created


# ============================================================
# 4. Onboarding checklist — in progress with items
# ============================================================
def seed_onboarding(lindiwe, hr_manager_id):
    print("\nSeeding onboarding checklist for Lindiwe...")

    # First seed a template if it doesn't exist
    template_id = new_id("portal-template-water-tech")
    template_items = [
        {"title": "Complete personal information form", "description": "Fill in all personal details in the HR system", "category": "HR", "sortOrder": 1},
        {"title": "Submit certified ID copy", "description": "Provide certified copy of South African ID", "category": "HR", "sortOrder": 2},
        {"title": "Set up IT accounts", "description": "Email, VPN access, and system credentials", "category": "IT", "sortOrder": 3},
        {"title": "Attend health and safety induction", "description": "Mandatory OHS Act compliance training", "category": "SAFETY", "sortOrder": 4},
        {"title": "Review employee handbook", "description": "Read and acknowledge company policies", "category": "POLICY", "sortOrder": 5},
        {"title": "Water treatment safety orientation", "description": "Site-specific safety procedures for treatment works", "category": "SAFETY", "sortOrder": 6},
        {"title": "Blue Drop certification briefing", "description": "Overview of Blue Drop water quality requirements", "category": "TECHNICAL", "sortOrder": 7},
        {"title": "SCADA system training", "description": "Training on supervisory control and data acquisition systems", "category": "TECHNICAL", "sortOrder": 8},
    ]

    template_item = {
        'PK':        {'S': f'TENANT#{TENANT_ID}'},
        'SK':        {'S': f'ONBOARD_TEMPLATE#{template_id}'},
        'id':        {'S': template_id},
        'tenantId':  {'S': TENANT_ID},
        'name':      {'S': 'Water Services Technician Onboarding'},
        'description': {'S': 'Extended onboarding for Water Services division technical staff'},
        'department': {'S': 'Water Services'},
        'isActive':  {'BOOL': True},
        'itemsJson': {'S': json.dumps(template_items)},
        'createdAt': {'S': now_iso},
        'updatedAt': {'S': now_iso},
    }
    put_item(template_item)

    # Create checklist with 5 of 8 items completed
    checklist_id = new_id("portal-checklist-lindiwe")
    completed_count = 5
    checklist_items = []
    for i, item in enumerate(template_items):
        status = "COMPLETED" if i < completed_count else "PENDING"
        entry = {
            "title": item["title"],
            "description": item["description"],
            "category": item.get("category", ""),
            "sortOrder": item.get("sortOrder", i + 1),
            "status": status,
        }
        if status == "COMPLETED":
            entry["completedAt"] = iso(days_ago(len(template_items) - i))
        checklist_items.append(entry)

    item = {
        'PK':        {'S': f'TENANT#{TENANT_ID}'},
        'SK':        {'S': f'ONBOARD_CHECKLIST#{checklist_id}'},
        'GSI1PK':    {'S': f'OB_CL_EMP#{TENANT_ID}#{lindiwe["id"]}'},
        'GSI1SK':    {'S': f'ONBOARD_CHECKLIST#{checklist_id}'},
        'id':        {'S': checklist_id},
        'tenantId':  {'S': TENANT_ID},
        'employeeId': {'S': lindiwe['id']},
        'templateId': {'S': template_id},
        'startDate': {'S': days_ago(14).strftime('%Y-%m-%d')},
        'dueDate':   {'S': days_from_now(16).strftime('%Y-%m-%d')},
        'status':    {'S': 'IN_PROGRESS'},
        'assignedHrId': {'S': hr_manager_id},
        'itemsJson': {'S': json.dumps(checklist_items)},
        'createdAt': {'S': now_iso},
        'updatedAt': {'S': now_iso},
    }
    ok, err = put_item(item)
    if ok:
        print(f"  OK  Checklist: {completed_count}/{len(template_items)} items completed (IN_PROGRESS)")
    else:
        print(f"  SKIP Checklist (already exists)")
    return 1 if ok else 0


# ============================================================
# Main
# ============================================================
def main():
    resolve_table()
    print("=" * 62)
    print(" uThukela Water — Employee Portal Seeder (Lindiwe, UTH-005)")
    print("=" * 62)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print(f" Region: {REGION}")
    print("=" * 62)

    employees = resolve_employees()
    if not employees:
        print("\nERROR: No employees found — run seed-employees-dynamodb.py first", file=sys.stderr)
        sys.exit(1)
    print(f"\nFound {len(employees)} employees")

    by_name = {e['firstName']: e for e in employees}
    lindiwe = by_name.get('Lindiwe')
    if not lindiwe:
        print("\nERROR: Lindiwe Ngcobo (UTH-005) not found in employee records", file=sys.stderr)
        sys.exit(1)
    print(f"Target: {lindiwe['firstName']} {lindiwe['lastName']} ({lindiwe['id'][:8]}...)")

    sipho = by_name.get('Sipho', {})
    nomvula = by_name.get('Nomvula', {})
    approver_id = sipho.get('id', '')
    hr_manager_id = nomvula.get('id', '')

    # 1. Recognitions
    recog_count = seed_recognitions(employees, lindiwe)

    # 2. Leave requests (needs leave types seeded first)
    type_ids = resolve_leave_type_ids()
    if not type_ids:
        print("\n  WARN No leave types found — skipping leave requests (run seed-leave-dynamodb.py first)")
        leave_count = 0
    else:
        print(f"  Found leave types: {', '.join(type_ids.keys())}")
        leave_count = seed_leave_requests(lindiwe, type_ids, approver_id)

    # 3. Training enrollments (needs sessions seeded first)
    sessions = resolve_training_sessions()
    courses = resolve_training_courses()
    if not sessions:
        print("\n  WARN No training sessions found — skipping enrollments (run seed-training-dynamodb.py first)")
        enroll_count = 0
    else:
        enroll_count = seed_training_enrollments(lindiwe, sessions, courses)

    # 4. Onboarding checklist
    onboard_count = seed_onboarding(lindiwe, hr_manager_id)

    print()
    print(f"Done: {recog_count} recognitions, {leave_count} leave requests, "
          f"{enroll_count} enrollments, {onboard_count} onboarding checklist")


if __name__ == '__main__':
    main()
