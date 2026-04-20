#!/usr/bin/env python3
"""
Direct DynamoDB training data seeder.

Creates training courses, sessions, enrollments (registered/attended/completed/no-show),
and completion records for the uThukela Water demo.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%SZ')

_id_counter = 0

def new_id(unique_key=None):
    """Generate a deterministic UUID so re-runs produce the same IDs."""
    global _id_counter
    if unique_key is None:
        _id_counter += 1
        unique_key = f"train-{_id_counter}"
    seed = f"{TENANT_ID}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))
def iso(dt): return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
def epoch(dt): return str(int(dt.timestamp()))
def days_ago(n): return now - timedelta(days=n)
def days_from_now(n): return now + timedelta(days=n)


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


# ============================================================
# Course definitions
# ============================================================
COURSES = [
    {"title": "SANS 241 Water Quality Compliance", "code": "WQ-101", "category": "Regulatory", "method": "CLASSROOM", "hours": "16", "cost": "4500", "mandatory": True, "provider": "Water Research Commission", "max": 25,
     "description": "Comprehensive training on SANS 241:2015 drinking water quality standards. Covers sampling procedures, testing protocols, compliance reporting, and corrective action frameworks required for Blue Drop certification."},
    {"title": "SCADA Systems Operation & Maintenance", "code": "TECH-201", "category": "Technical", "method": "BLENDED", "hours": "24", "cost": "8500", "mandatory": False, "provider": "Schneider Electric SA", "max": 15,
     "description": "Hands-on training on Supervisory Control and Data Acquisition systems used in water treatment plants. Covers HMI operation, alarm management, data trending, and basic PLC troubleshooting."},
    {"title": "Occupational Health & Safety Act Compliance", "code": "OHS-101", "category": "Regulatory", "method": "CLASSROOM", "hours": "8", "cost": "2200", "mandatory": True, "provider": "NOSA", "max": 30,
     "description": "Mandatory OHS training covering the Occupational Health & Safety Act 85 of 1993, hazard identification, risk assessment, incident reporting, and emergency procedures specific to water treatment facilities."},
    {"title": "Municipal Finance Management (MFMA) Basics", "code": "FIN-101", "category": "Finance", "method": "ONLINE", "hours": "12", "cost": "3500", "mandatory": False, "provider": "National Treasury Academy", "max": 40,
     "description": "Introduction to the MFMA for municipal officials. Covers budget preparation, supply chain management, financial reporting (GRAP), and audit requirements."},
    {"title": "Leadership & People Management", "code": "MGT-301", "category": "Management", "method": "WORKSHOP", "hours": "16", "cost": "6800", "mandatory": False, "provider": "Gordon Institute of Business Science", "max": 20,
     "description": "Leadership development programme for middle and senior managers. Covers situational leadership, performance coaching, conflict resolution, and team dynamics in a municipal environment."},
    {"title": "GIS for Water Infrastructure Planning", "code": "TECH-301", "category": "Technical", "method": "BLENDED", "hours": "20", "cost": "7200", "mandatory": False, "provider": "Esri South Africa", "max": 12,
     "description": "Geographic Information Systems training for infrastructure planning and asset management. Covers ArcGIS Pro, spatial analysis, network tracing, and integration with existing asset registers."},
    {"title": "isiZulu Business Communication", "code": "COMM-101", "category": "Communication", "method": "CLASSROOM", "hours": "10", "cost": "1800", "mandatory": False, "provider": "UKZN Language Services", "max": 20,
     "description": "Professional isiZulu communication skills for community engagement, public meetings, and stakeholder relations. Covers report writing, presentation skills, and customer service in isiZulu."},
]


def seed_courses():
    print("Seeding training courses...")
    course_ids = {}
    for c in COURSES:
        cid = new_id()
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'TRAIN_COURSE#{cid}'},
            'GSI1PK': {'S': f'TC_CAT#{TENANT_ID}#{c["category"]}'},
            'GSI1SK': {'S': f'TRAIN_COURSE#{cid}'},
            'id': {'S': cid},
            'tenantId': {'S': TENANT_ID},
            'title': {'S': c['title']},
            'code': {'S': c['code']},
            'description': {'S': c['description']},
            'deliveryMethod': {'S': c['method']},
            'category': {'S': c['category']},
            'provider': {'S': c['provider']},
            'durationHours': {'S': c['hours']},
            'maxParticipants': {'N': str(c['max'])},
            'cost': {'S': c['cost']},
            'isMandatory': {'BOOL': c['mandatory']},
            'isActive': {'BOOL': True},
            'createdAt': {'N': epoch(days_ago(90))},
            'updatedAt': {'N': epoch(now)},
        }
        ok, err = put_item(item)
        print(f"  {'OK' if ok else 'FAIL'}  {c['code']:10s} {c['title']}")
        course_ids[c['code']] = cid
    return course_ids


def seed_sessions(course_ids):
    print("\nSeeding training sessions...")
    sessions = [
        # Past completed sessions
        {"course": "WQ-101",  "trainer": "Dr. Thandi Gumede",      "location": "Newcastle Head Office, Training Room A", "start": days_ago(60), "end": days_ago(58), "status": "COMPLETED", "seats": 25},
        {"course": "OHS-101", "trainer": "Mandisa Khoza (NOSA)",    "location": "Newcastle Head Office, Boardroom 1",    "start": days_ago(45), "end": days_ago(45), "status": "COMPLETED", "seats": 30},
        {"course": "TECH-201","trainer": "Jean-Pierre du Plessis",  "location": "Estcourt Treatment Works + Online",     "start": days_ago(30), "end": days_ago(27), "status": "COMPLETED", "seats": 15},
        {"course": "MGT-301", "trainer": "Prof. Nhlanhla Mkhwanazi","location": "Ladysmith Conference Centre",           "start": days_ago(21), "end": days_ago(19), "status": "COMPLETED", "seats": 20},
        # Current/upcoming sessions
        {"course": "FIN-101", "trainer": "Online (Self-paced)",     "location": "Online — National Treasury LMS",        "start": days_ago(14), "end": days_from_now(14), "status": "IN_PROGRESS", "seats": 40},
        {"course": "TECH-301","trainer": "Kagiso Molefe (Esri)",    "location": "Newcastle Head Office + Online",        "start": days_from_now(10), "end": days_from_now(14), "status": "OPEN", "seats": 12},
        {"course": "COMM-101","trainer": "Nokuthula Buthelezi",     "location": "Ladysmith Office, Training Room",       "start": days_from_now(21), "end": days_from_now(23), "status": "PLANNED", "seats": 20},
    ]

    session_ids = {}
    for s in sessions:
        sid = new_id()
        cid = course_ids.get(s['course'], '')
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'TRAIN_SESSION#{sid}'},
            'GSI1PK': {'S': f'TS_COURSE#{TENANT_ID}#{cid}'},
            'GSI1SK': {'S': f'TRAIN_SESSION#{sid}'},
            'id': {'S': sid},
            'tenantId': {'S': TENANT_ID},
            'courseId': {'S': cid},
            'trainerName': {'S': s['trainer']},
            'location': {'S': s['location']},
            'startDate': {'N': epoch(s['start'])},
            'endDate': {'N': epoch(s['end'])},
            'status': {'S': s['status']},
            'availableSeats': {'N': str(s['seats'])},
            'createdAt': {'N': epoch(days_ago(90))},
            'updatedAt': {'N': epoch(now)},
        }
        ok, err = put_item(item)
        icon = {'COMPLETED': '+', 'IN_PROGRESS': '~', 'OPEN': 'o', 'PLANNED': ' '}[s['status']]
        print(f"  [{icon}] {s['course']:10s} {s['status']:12s} {s['trainer'][:30]}")
        session_ids[s['course']] = sid
    return session_ids


def seed_enrollments(session_ids, course_ids, employees):
    print("\nSeeding enrollments & completion records...")

    by_name = {e['firstName']: e for e in employees}

    # Enrollment matrix: (employee_first_name, course_code, status, score_or_none)
    enrollments = [
        # SANS 241 — completed session, mandatory for water staff
        ("Sipho",   "WQ-101", "COMPLETED", "92"),
        ("Thabo",   "WQ-101", "COMPLETED", "88"),
        ("Lindiwe", "WQ-101", "COMPLETED", "95"),
        ("Mandla",  "WQ-101", "COMPLETED", "78"),
        ("Johan",   "WQ-101", "COMPLETED", "84"),
        ("Bongani", "WQ-101", "NO_SHOW",   None),

        # OHS — completed, mandatory for all
        ("Sipho",   "OHS-101", "COMPLETED", "90"),
        ("Nomvula", "OHS-101", "COMPLETED", "86"),
        ("Thabo",   "OHS-101", "COMPLETED", "91"),
        ("Pieter",  "OHS-101", "COMPLETED", "88"),
        ("Lindiwe", "OHS-101", "COMPLETED", "82"),
        ("Ayanda",  "OHS-101", "COMPLETED", "87"),
        ("Johan",   "OHS-101", "COMPLETED", "93"),
        ("Zanele",  "OHS-101", "COMPLETED", "85"),

        # SCADA — completed for technical staff
        ("Sipho",   "TECH-201", "COMPLETED", "89"),
        ("Thabo",   "TECH-201", "COMPLETED", "94"),
        ("Lindiwe", "TECH-201", "COMPLETED", "91"),
        ("Johan",   "TECH-201", "ATTENDED",  None),

        # Leadership — completed for managers
        ("Sipho",   "MGT-301", "COMPLETED", "88"),
        ("Nomvula", "MGT-301", "COMPLETED", "92"),
        ("Pieter",  "MGT-301", "COMPLETED", "85"),

        # MFMA — in progress (online, self-paced)
        ("Pieter",  "FIN-101", "ATTENDED",   None),
        ("Zanele",  "FIN-101", "ATTENDED",   None),
        ("Nomvula", "FIN-101", "REGISTERED", None),

        # GIS — upcoming, open for registration
        ("Thabo",   "TECH-301", "REGISTERED", None),
        ("Mandla",  "TECH-301", "REGISTERED", None),
        ("Lindiwe", "TECH-301", "REGISTERED", None),

        # isiZulu Communication — planned, early registrations
        ("Ayanda",  "COMM-101", "REGISTERED", None),
        ("Pieter",  "COMM-101", "REGISTERED", None),
        ("Bongani", "COMM-101", "REGISTERED", None),
    ]

    completed = 0
    in_progress = 0
    registered = 0
    other = 0

    for emp_name, course_code, status, score in enrollments:
        emp = by_name.get(emp_name)
        if not emp:
            continue
        eid = new_id()
        sid = session_ids.get(course_code, '')
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'TRAIN_ENROLL#{eid}'},
            'GSI1PK': {'S': f'TE_EMP#{TENANT_ID}#{emp["id"]}'},
            'GSI1SK': {'S': f'TRAIN_ENROLL#{eid}'},
            'id': {'S': eid},
            'tenantId': {'S': TENANT_ID},
            'sessionId': {'S': sid},
            'employeeId': {'S': emp['id']},
            'status': {'S': status},
            'enrolledAt': {'N': epoch(days_ago(70))},
            'createdAt': {'N': epoch(days_ago(70))},
            'updatedAt': {'N': epoch(now)},
        }
        if score:
            item['score'] = {'S': score}
        if status == 'COMPLETED':
            item['completedAt'] = {'N': epoch(days_ago(15))}
            item['certificateUrl'] = {'S': f's3://shumelahire-dev-documents/training/cert-{eid[:8]}.pdf'}
            completed += 1
        elif status in ('ATTENDED',):
            in_progress += 1
        elif status == 'REGISTERED':
            registered += 1
        else:
            other += 1

        ok, _ = put_item(item)

    print(f"  OK  {completed} completed, {in_progress} in progress, {registered} registered, {other} no-show/cancelled")
    return completed + in_progress + registered + other


def main():
    resolve_table()
    print("=" * 55)
    print(" uThukela Water — Training Data Seeder (DynamoDB)")
    print("=" * 55)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print("=" * 55)
    print()

    employees = resolve_employees()
    if not employees:
        print("ERROR: No employees found", file=sys.stderr)
        sys.exit(1)
    print(f"Found {len(employees)} employees")

    course_ids = seed_courses()
    session_ids = seed_sessions(course_ids)
    enrollment_count = seed_enrollments(session_ids, course_ids, employees)

    print()
    print(f"Done: {len(COURSES)} courses, 7 sessions, {enrollment_count} enrollments")


if __name__ == '__main__':
    main()
