#!/usr/bin/env python3
"""
Direct DynamoDB performance review seeder.

Creates an active mid-year review cycle with:
- 1 active performance cycle (FY2025/26)
- 10 active performance contracts (one per employee)
- Self-assessment feedback requests — some submitted, some still pending
- Feedback responses for submitted self-assessments
"""
import json, os, sys, uuid, subprocess
from datetime import datetime, timezone

TENANT_ID = os.environ.get('TENANT_ID', 'uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S')


def new_id():
    return str(uuid.uuid4())


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
         '--projection-expression', 'id,firstName,lastName,department,jobTitle,jobGrade,employeeNumber,reportingManagerId',
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
            'jobGrade': item.get('jobGrade', {}).get('S', ''),
            'employeeNumber': item.get('employeeNumber', {}).get('S', ''),
            'managerId': item.get('reportingManagerId', {}).get('S', ''),
        })
    return employees


def seed_cycle():
    print("Seeding performance cycle...")
    cycle_id = new_id()
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'PERF_CYCLE#{cycle_id}'},
        'GSI1PK': {'S': f'PC_STATUS#{TENANT_ID}#MID_YEAR'},
        'GSI1SK': {'S': f'PERF_CYCLE#{cycle_id}'},
        'id':          {'S': cycle_id},
        'tenantId':    {'S': TENANT_ID},
        'name':        {'S': 'FY2025/26 Performance Review'},
        'description': {'S': 'Annual performance review cycle for the 2025/2026 financial year. Mid-year reviews are currently in progress — all employees must complete self-assessments by 30 April 2026.'},
        'startDate':   {'S': '2025-07-01'},
        'endDate':     {'S': '2026-06-30'},
        'midYearDeadline':     {'S': '2026-04-30'},
        'finalReviewDeadline': {'S': '2026-06-15'},
        'status':      {'S': 'MID_YEAR'},
        'isDefault':   {'BOOL': True},
        'createdAt':   {'S': '2025-06-15T09:00:00'},
        'updatedAt':   {'S': now_iso},
        'createdBy':   {'S': 'system'},
    }
    ok, err = put_item(item)
    print(f"  {'OK' if ok else 'FAIL'}  FY2025/26 Performance Review (MID_YEAR)")
    return cycle_id


def seed_contracts(cycle_id, employees):
    print("\nSeeding performance contracts...")
    # Map first names to employee dicts for manager lookups
    by_name = {e['firstName']: e for e in employees}
    sipho = by_name.get('Sipho', {})

    created = 0
    for emp in employees:
        cid = new_id()
        mgr_id = emp.get('managerId', sipho.get('id', ''))
        mgr_name = ''
        # Find manager name
        for e in employees:
            if e['id'] == mgr_id:
                mgr_name = f"{e['firstName']} {e['lastName']}"
                break
        if not mgr_name and sipho:
            mgr_id = sipho['id']
            mgr_name = f"{sipho['firstName']} {sipho['lastName']}"

        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'PERF_CONTRACT#{cid}'},
            'GSI1PK': {'S': f'PCON_EMP#{TENANT_ID}#{emp["id"]}'},
            'GSI1SK': {'S': f'PERF_CONTRACT#{cid}'},
            'id':             {'S': cid},
            'tenantId':       {'S': TENANT_ID},
            'cycleId':        {'S': cycle_id},
            'employeeId':     {'S': emp['id']},
            'employeeName':   {'S': f"{emp['firstName']} {emp['lastName']}"},
            'employeeNumber': {'S': emp.get('employeeNumber', '')},
            'managerId':      {'S': mgr_id},
            'managerName':    {'S': mgr_name},
            'department':     {'S': emp.get('department', '')},
            'jobTitle':       {'S': emp.get('jobTitle', '')},
            'jobLevel':       {'S': emp.get('jobGrade', '')},
            'status':         {'S': 'ACTIVE'},
            'version':        {'N': '1'},
            'approvedBy':     {'S': mgr_id},
            'approvedAt':     {'S': '2025-07-15T10:00:00'},
            'approvalComments': {'S': 'Performance agreement approved for FY2025/26'},
            'createdAt':      {'S': '2025-07-01T09:00:00'},
            'updatedAt':      {'S': now_iso},
        }
        ok, _ = put_item(item)
        if ok:
            created += 1
    print(f"  OK  {created} performance contracts created (ACTIVE)")
    return created


def seed_self_assessments(employees):
    print("\nSeeding self-assessment feedback requests...")

    # Self-assessment profiles:
    # (submitted?, self_rating, self_notes)
    profiles = [
        (True,  "4.2", "I have successfully led the operations team through the infrastructure upgrade programme. Key achievements include the R12M pipeline replacement completed under budget and the implementation of the new SCADA monitoring system. I continue to focus on mentoring junior staff and improving our response time to service disruptions."),
        (True,  "3.8", "I have streamlined the onboarding process and implemented the new performance management framework. The skills audit was completed ahead of schedule. Areas for development include strengthening the wellness programme and improving exit interview participation rates."),
        (True,  "4.5", "Delivered the Estcourt treatment plant upgrade (R18M) on time. Achieved Blue Drop compliance score of 96.2%. Published two technical papers on membrane filtration. I aim to complete my professional registration with ECSA before year-end."),
        (False, None,  None),  # Pieter — not started
        (True,  "3.5", "Maintained SANS 241 compliance across all treatment works. Introduced automated water quality reporting which reduced manual testing time by 30%. I need to improve my project documentation practices."),
        (False, None,  None),  # Bongani — not started
        (True,  "4.0", "Coordinated 15 community engagement events with over 2,000 attendees. Improved public complaint resolution time from 14 to 5 working days. Developed isiZulu communication materials for the water conservation campaign."),
        (True,  "3.9", "Led the preventive maintenance programme — unplanned breakdowns reduced by 40% compared to prior year. Completed the Newcastle pump station refurbishment. Need to focus on upskilling the maintenance team on new telemetry equipment."),
        (False, None,  None),  # Zanele — not started
        (False, None,  None),  # Mandla — not started
    ]

    submitted_count = 0
    pending_count = 0

    for i, emp in enumerate(employees):
        if i >= len(profiles):
            break
        is_submitted, rating, notes = profiles[i]

        req_id = new_id()
        status = 'SUBMITTED' if is_submitted else 'PENDING'

        req_item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'FEEDBACK_REQ#{req_id}'},
            'GSI1PK': {'S': f'FR_EMP#{TENANT_ID}#{emp["id"]}'},
            'GSI1SK': {'S': f'FR#{req_id}'},
            'id':           {'S': req_id},
            'tenantId':     {'S': TENANT_ID},
            'employeeId':   {'S': emp['id']},
            'requesterId':  {'S': emp['id']},
            'feedbackType': {'S': 'SELF'},
            'status':       {'S': status},
            'dueDate':      {'S': '2026-04-30'},
            'createdAt':    {'S': '2026-03-15T09:00:00'},
            'updatedAt':    {'S': now_iso},
        }
        ok, _ = put_item(req_item)

        if is_submitted:
            # Create feedback response
            resp_id = new_id()
            resp_item = {
                'PK':     {'S': f'TENANT#{TENANT_ID}'},
                'SK':     {'S': f'FEEDBACK_RESP#{resp_id}'},
                'GSI1PK': {'S': f'FRESP_REQ#{TENANT_ID}#{req_id}'},
                'GSI1SK': {'S': f'FRESP#{resp_id}'},
                'id':             {'S': resp_id},
                'tenantId':       {'S': TENANT_ID},
                'requestId':      {'S': req_id},
                'respondentId':   {'S': emp['id']},
                'ratings':        {'S': json.dumps({"overall": float(rating), "technical": float(rating) + 0.1, "leadership": float(rating) - 0.2, "teamwork": float(rating) + 0.3})},
                'comments':       {'S': notes},
                'strengths':      {'S': f"Strong technical skills and commitment to service delivery. {emp['firstName']} consistently demonstrates initiative."},
                'improvements':   {'S': "Could improve on documentation and knowledge sharing with the wider team."},
                'submittedAt':    {'S': now_iso},
                'createdAt':      {'S': now_iso},
            }
            put_item(resp_item)
            submitted_count += 1
            icon = "v"
        else:
            pending_count += 1
            icon = " "

        name = f"{emp['firstName']} {emp['lastName']}"
        label = f"SUBMITTED (rated {rating})" if is_submitted else "PENDING"
        print(f"  [{icon}] {name:25s} {label}")

    print(f"\n  Summary: {submitted_count} submitted, {pending_count} pending (due 30 Apr 2026)")
    return submitted_count + pending_count


def main():
    resolve_table()
    print("=" * 58)
    print(" uThukela Water — Performance Review Seeder (DynamoDB)")
    print("=" * 58)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print("=" * 58)
    print()

    employees = resolve_employees()
    if not employees:
        print("ERROR: No employees found", file=sys.stderr)
        sys.exit(1)
    print(f"Found {len(employees)} employees")

    cycle_id = seed_cycle()
    contract_count = seed_contracts(cycle_id, employees)
    assessment_count = seed_self_assessments(employees)

    print()
    print(f"Done: 1 cycle (MID_YEAR), {contract_count} contracts, {assessment_count} self-assessments")


if __name__ == '__main__':
    main()
