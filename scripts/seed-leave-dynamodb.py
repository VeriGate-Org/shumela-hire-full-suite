#!/usr/bin/env python3
"""
Direct DynamoDB leave data seeder — bypasses Lambda/API Gateway entirely.

Seeds leave types, leave balances (2026 cycle), and leave requests at
various stages (pending, approved, rejected, cancelled) for 10 uThukela
Water demo employees.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now_epoch = int(datetime.now(timezone.utc).timestamp())
now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

_id_counter = 0

def new_id(unique_key=None):
    """Generate a deterministic UUID so re-runs produce the same IDs."""
    global _id_counter
    if unique_key is None:
        _id_counter += 1
        unique_key = f"leave-{_id_counter}"
    seed = f"{TENANT_ID}:{unique_key}"
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


def resolve_employee_ids():
    """Query DynamoDB for employee IDs in the uthukela tenant."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'},
             ':sk': {'S': 'EMPLOYEE#'}
         }),
         '--projection-expression', 'id,firstName,lastName,department,jobTitle',
         '--output', 'json'], capture_output=True, text=True)
    items = json.loads(result.stdout).get('Items', [])
    employees = []
    for item in items:
        employees.append({
            'id': item['id']['S'],
            'firstName': item.get('firstName', {}).get('S', ''),
            'lastName': item.get('lastName', {}).get('S', ''),
            'department': item.get('department', {}).get('S', ''),
            'jobTitle': item.get('jobTitle', {}).get('S', ''),
        })
    return employees


# ============================================================
# Leave Types — SA standard + municipality-specific
# ============================================================
LEAVE_TYPES = [
    {"name": "Annual Leave",    "code": "AL",  "defaultDays": "21", "maxCarry": "10", "color": "#3B82F6", "paid": True,  "medCert": False, "medThreshold": 0},
    {"name": "Sick Leave",      "code": "SL",  "defaultDays": "30", "maxCarry": "0",  "color": "#EF4444", "paid": True,  "medCert": True,  "medThreshold": 2},
    {"name": "Family Responsibility Leave", "code": "FRL", "defaultDays": "3", "maxCarry": "0", "color": "#8B5CF6", "paid": True, "medCert": False, "medThreshold": 0},
    {"name": "Maternity Leave", "code": "ML",  "defaultDays": "120","maxCarry": "0",  "color": "#EC4899", "paid": True,  "medCert": True,  "medThreshold": 0},
    {"name": "Study Leave",     "code": "STL", "defaultDays": "10", "maxCarry": "0",  "color": "#F59E0B", "paid": True,  "medCert": False, "medThreshold": 0},
    {"name": "Paternity Leave", "code": "PL",  "defaultDays": "10", "maxCarry": "0",  "color": "#0EA5E9", "paid": True,  "medCert": False, "medThreshold": 0},
    {"name": "Unpaid Leave",    "code": "UL",  "defaultDays": "0",  "maxCarry": "0",  "color": "#6B7280", "paid": False, "medCert": False, "medThreshold": 0},
]


def seed_leave_types():
    print("Seeding leave types...")
    type_ids = {}
    for lt in LEAVE_TYPES:
        lid = new_id()
        item = {
            'PK':    {'S': f'TENANT#{TENANT_ID}'},
            'SK':    {'S': f'LEAVE_TYPE#{lid}'},
            'GSI1PK': {'S': f'LT_CODE#{TENANT_ID}'},
            'GSI1SK': {'S': lt['code']},
            'id':    {'S': lid},
            'tenantId': {'S': TENANT_ID},
            'name':  {'S': lt['name']},
            'code':  {'S': lt['code']},
            'description': {'S': f"{lt['name']} as per BCEA"},
            'defaultDaysPerYear': {'S': lt['defaultDays']},
            'maxCarryForwardDays': {'S': lt['maxCarry']},
            'requiresMedicalCertificate': {'BOOL': lt['medCert']},
            'medicalCertThresholdDays': {'N': str(lt['medThreshold'])},
            'isPaid': {'BOOL': lt['paid']},
            'allowEncashment': {'BOOL': lt['code'] == 'AL'},
            'isActive': {'BOOL': True},
            'colorCode': {'S': lt['color']},
            'createdAt': {'N': str(now_epoch)},
            'updatedAt': {'N': str(now_epoch)},
        }
        if lt['code'] == 'AL':
            item['encashmentRate'] = {'S': '850.00'}
        ok, err = put_item(item)
        if ok:
            print(f"  OK  {lt['name']} ({lt['code']})")
        else:
            print(f"  FAIL {lt['name']}: {err}", file=sys.stderr)
        type_ids[lt['code']] = lid
    return type_ids


def seed_leave_balances(employees, type_ids):
    print("\nSeeding leave balances (2026 cycle)...")
    created = 0
    # Balance profiles: (annual_taken, annual_pending, sick_taken, frl_taken)
    balance_profiles = [
        (8,  3,  2, 1),   # Sipho — moderate usage
        (5,  0,  4, 0),   # Nomvula — some sick leave
        (12, 2,  1, 2),   # Thabo — used a lot of annual
        (3,  5,  0, 0),   # Pieter — pending annual leave
        (6,  0,  8, 1),   # Lindiwe — significant sick leave
        (2,  0,  1, 0),   # Bongani — new, minimal usage
        (10, 0,  3, 3),   # Ayanda — family + sick
        (15, 0,  5, 1),   # Johan — senior, lots taken
        (4,  2,  0, 0),   # Zanele — new, some pending
        (1,  0,  2, 0),   # Mandla — newest, barely started
    ]

    for i, emp in enumerate(employees):
        profile = balance_profiles[i] if i < len(balance_profiles) else (0, 0, 0, 0)
        al_taken, al_pending, sl_taken, frl_taken = profile

        balances = [
            ('AL', '21', str(al_taken), str(al_pending), '5'),
            ('SL', '30', str(sl_taken), '0', '0'),
            ('FRL', '3', str(frl_taken), '0', '0'),
            ('STL', '10', '0', '0', '0'),
        ]
        for code, entitled, taken, pending, carry in balances:
            bid = new_id()
            lt_id = type_ids.get(code, '')
            item = {
                'PK':     {'S': f'TENANT#{TENANT_ID}'},
                'SK':     {'S': f'LEAVE_BAL#{bid}'},
                'GSI1PK': {'S': f'LB_EMP#{TENANT_ID}#{emp["id"]}'},
                'GSI1SK': {'S': f'LEAVE_BAL#2026#{lt_id}'},
                'id':        {'S': bid},
                'tenantId':  {'S': TENANT_ID},
                'employeeId':{'S': emp['id']},
                'leaveTypeId':{'S': lt_id},
                'cycleYear': {'N': '2026'},
                'entitledDays':      {'S': entitled},
                'takenDays':         {'S': taken},
                'pendingDays':       {'S': pending},
                'carriedForwardDays':{'S': carry},
                'adjustmentDays':    {'S': '0'},
                'encashedDays':      {'S': '0'},
                'createdAt': {'N': str(now_epoch)},
                'updatedAt': {'N': str(now_epoch)},
            }
            ok, err = put_item(item)
            if ok:
                created += 1
            else:
                print(f"  FAIL balance {emp['firstName']} {code}: {err}", file=sys.stderr)
    print(f"  OK  {created} leave balances created for {len(employees)} employees")
    return created


def seed_leave_requests(employees, type_ids):
    print("\nSeeding leave requests...")
    created = 0

    # Build employee lookup by first name for approver references
    by_name = {e['firstName']: e for e in employees}
    sipho = by_name.get('Sipho', {}).get('id', '')
    nomvula = by_name.get('Nomvula', {}).get('id', '')
    pieter = by_name.get('Pieter', {}).get('id', '')

    requests = [
        # APPROVED — past leave (already taken)
        {"emp": "Sipho",   "type": "AL",  "start": "2026-01-13", "end": "2026-01-17", "days": "5",   "status": "APPROVED", "approver": sipho,   "reason": "Family holiday to Durban"},
        {"emp": "Sipho",   "type": "AL",  "start": "2026-03-02", "end": "2026-03-04", "days": "3",   "status": "APPROVED", "approver": sipho,   "reason": "Personal matters"},
        {"emp": "Nomvula", "type": "SL",  "start": "2026-02-10", "end": "2026-02-13", "days": "4",   "status": "APPROVED", "approver": sipho,   "reason": "Flu", "medCert": True},
        {"emp": "Nomvula", "type": "AL",  "start": "2026-03-17", "end": "2026-03-21", "days": "5",   "status": "APPROVED", "approver": sipho,   "reason": "Annual family visit"},
        {"emp": "Thabo",   "type": "AL",  "start": "2026-01-06", "end": "2026-01-17", "days": "10",  "status": "APPROVED", "approver": sipho,   "reason": "Extended year-end break"},
        {"emp": "Thabo",   "type": "AL",  "start": "2026-03-24", "end": "2026-03-25", "days": "2",   "status": "APPROVED", "approver": sipho,   "reason": "Personal day"},
        {"emp": "Thabo",   "type": "FRL", "start": "2026-02-28", "end": "2026-03-03", "days": "2",   "status": "APPROVED", "approver": sipho,   "reason": "Child's school enrollment"},
        {"emp": "Lindiwe", "type": "SL",  "start": "2026-01-20", "end": "2026-01-24", "days": "5",   "status": "APPROVED", "approver": sipho,   "reason": "Back injury", "medCert": True},
        {"emp": "Lindiwe", "type": "SL",  "start": "2026-03-10", "end": "2026-03-12", "days": "3",   "status": "APPROVED", "approver": sipho,   "reason": "Follow-up treatment", "medCert": True},
        {"emp": "Lindiwe", "type": "AL",  "start": "2026-02-14", "end": "2026-02-21", "days": "6",   "status": "APPROVED", "approver": sipho,   "reason": "Recovery period"},
        {"emp": "Johan",   "type": "AL",  "start": "2026-01-06", "end": "2026-01-24", "days": "15",  "status": "APPROVED", "approver": sipho,   "reason": "Extended leave — family farm in Free State"},
        {"emp": "Johan",   "type": "SL",  "start": "2026-03-03", "end": "2026-03-07", "days": "5",   "status": "APPROVED", "approver": sipho,   "reason": "Knee surgery recovery", "medCert": True},
        {"emp": "Ayanda",  "type": "AL",  "start": "2026-02-03", "end": "2026-02-14", "days": "10",  "status": "APPROVED", "approver": nomvula, "reason": "Wedding and honeymoon"},
        {"emp": "Ayanda",  "type": "FRL", "start": "2026-03-17", "end": "2026-03-19", "days": "3",   "status": "APPROVED", "approver": nomvula, "reason": "Family bereavement"},

        # PENDING — awaiting approval
        {"emp": "Sipho",   "type": "AL",  "start": "2026-04-21", "end": "2026-04-23", "days": "3",   "status": "PENDING",  "reason": "Long weekend trip"},
        {"emp": "Thabo",   "type": "AL",  "start": "2026-04-14", "end": "2026-04-15", "days": "2",   "status": "PENDING",  "reason": "Home maintenance"},
        {"emp": "Pieter",  "type": "AL",  "start": "2026-04-28", "end": "2026-05-02", "days": "5",   "status": "PENDING",  "reason": "Family holiday — Kruger Park"},
        {"emp": "Zanele",  "type": "AL",  "start": "2026-04-22", "end": "2026-04-23", "days": "2",   "status": "PENDING",  "reason": "Personal appointment"},
        {"emp": "Bongani", "type": "SL",  "start": "2026-04-03", "end": "2026-04-03", "days": "1",   "status": "PENDING",  "reason": "Dental appointment", "halfDay": True, "halfDayPeriod": "MORNING"},

        # REJECTED
        {"emp": "Mandla",  "type": "AL",  "start": "2026-03-31", "end": "2026-04-04", "days": "5",   "status": "REJECTED", "approver": sipho, "reason": "Easter break", "rejectionReason": "Critical water quality testing scheduled that week — please reschedule"},
        {"emp": "Ayanda",  "type": "AL",  "start": "2026-04-07", "end": "2026-04-11", "days": "5",   "status": "REJECTED", "approver": nomvula, "reason": "Additional rest", "rejectionReason": "Team already short-staffed due to other leave"},

        # CANCELLED
        {"emp": "Pieter",  "type": "AL",  "start": "2026-03-10", "end": "2026-03-14", "days": "5",   "status": "CANCELLED", "reason": "Quarter-end audit prep", "cancelReason": "Cancelled due to urgent audit preparation"},
    ]

    for req in requests:
        emp = by_name.get(req['emp'])
        if not emp:
            print(f"  SKIP {req['emp']} — not found")
            continue
        rid = new_id()
        lt_id = type_ids.get(req['type'], '')
        approver_id = req.get('approver', '')

        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'LEAVE_REQ#{rid}'},
            'GSI1PK': {'S': f'LR_EMP#{TENANT_ID}#{emp["id"]}'},
            'GSI1SK': {'S': f'LEAVE_REQ#{rid}'},
            'id':         {'S': rid},
            'tenantId':   {'S': TENANT_ID},
            'employeeId': {'S': emp['id']},
            'leaveTypeId':{'S': lt_id},
            'startDate':  {'S': req['start']},
            'endDate':    {'S': req['end']},
            'totalDays':  {'S': req['days']},
            'status':     {'S': req['status']},
            'reason':     {'S': req['reason']},
            'createdAt':  {'N': str(now_epoch - 86400 * 7)},
            'updatedAt':  {'N': str(now_epoch)},
        }
        if req.get('halfDay'):
            item['isHalfDay'] = {'BOOL': True}
            item['halfDayPeriod'] = {'S': req.get('halfDayPeriod', 'MORNING')}
        if approver_id:
            item['approverId'] = {'S': approver_id}
        if req['status'] == 'APPROVED' and approver_id:
            item['approvedAt'] = {'N': str(now_epoch - 86400 * 5)}
        if req.get('rejectionReason'):
            item['rejectionReason'] = {'S': req['rejectionReason']}
        if req.get('cancelReason'):
            item['cancellationReason'] = {'S': req['cancelReason']}
            item['cancelledAt'] = {'N': str(now_epoch - 86400 * 3)}
        if req.get('medCert'):
            item['medicalCertificateUrl'] = {'S': f's3://shumelahire-dev-documents/leave/medical-cert-{rid[:8]}.pdf'}

        ok, err = put_item(item)
        if ok:
            status_icon = {'APPROVED': '+', 'PENDING': '?', 'REJECTED': 'x', 'CANCELLED': '-'}.get(req['status'], ' ')
            print(f"  [{status_icon}] {req['emp']:12s} {req['type']:4s} {req['start']} → {req['end']}  {req['status']}")
            created += 1
        else:
            print(f"  FAIL {req['emp']} {req['type']}: {err}", file=sys.stderr)

    return created


def main():
    resolve_table()
    print("=" * 55)
    print(" uThukela Water — Leave Data Seeder (Direct DynamoDB)")
    print("=" * 55)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print(f" Region: {REGION}")
    print("=" * 55)
    print()

    employees = resolve_employee_ids()
    if not employees:
        print("ERROR: No employees found — run employee seeder first", file=sys.stderr)
        sys.exit(1)
    print(f"Found {len(employees)} employees")

    type_ids = seed_leave_types()
    bal_count = seed_leave_balances(employees, type_ids)
    req_count = seed_leave_requests(employees, type_ids)

    print()
    print(f"Done: {len(LEAVE_TYPES)} leave types, {bal_count} balances, {req_count} requests")


if __name__ == '__main__':
    main()
