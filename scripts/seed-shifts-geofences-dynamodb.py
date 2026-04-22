#!/usr/bin/env python3
"""
Direct DynamoDB seeder — shifts, shift schedules, and geofences for uThukela Water.
Uses real uThukela District Municipality GPS coordinates.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')


def new_id(unique_key):
    seed = f"{TENANT_ID}:SHIFTS:{unique_key}"
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


# ── Shifts ─────────────────────────────────────────────────────────
SHIFTS = [
    {"key": "morning", "name": "Morning Shift", "code": "MORN", "startTime": "06:00", "endTime": "14:00", "breakMinutes": 30, "colorCode": "#3B82F6"},
    {"key": "afternoon", "name": "Afternoon Shift", "code": "AFTN", "startTime": "14:00", "endTime": "22:00", "breakMinutes": 30, "colorCode": "#F59E0B"},
    {"key": "night", "name": "Night Shift", "code": "NGHT", "startTime": "22:00", "endTime": "06:00", "breakMinutes": 30, "colorCode": "#6366F1"},
    {"key": "day", "name": "Day Shift", "code": "DAY", "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60, "colorCode": "#10B981"},
]


def seed_shifts():
    print("Seeding shifts...")
    shift_ids = {}
    ok = fail = 0
    for s in SHIFTS:
        sid = new_id(f"shift-{s['key']}")
        shift_ids[s['key']] = sid
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'SHIFT#{sid}'},
            'id':        {'S': sid},
            'tenantId':  {'S': TENANT_ID},
            'name':      {'S': s['name']},
            'code':      {'S': s['code']},
            'startTime': {'S': s['startTime']},
            'endTime':   {'S': s['endTime']},
            'breakMinutes': {'N': str(s['breakMinutes'])},
            'colorCode': {'S': s['colorCode']},
            'isActive':  {'BOOL': True},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Shift: {s['name']}")
            ok += 1
        else:
            print(f"  FAIL Shift {s['name']}: {err}", file=sys.stderr)
            fail += 1
    return shift_ids, ok, fail


# ── Shift Schedules ────────────────────────────────────────────────
def seed_schedules(shift_ids):
    print("Seeding shift schedules (2 weeks)...")
    # Water Services employees rotate morning/afternoon/night
    # Operations employees work day shifts
    schedule_map = [
        # Water Services — rotating shifts
        ("UTH-005", ["morning", "morning", "afternoon", "afternoon", "night", "night", None,
                      "morning", "morning", "afternoon", "afternoon", "night", "night", None]),
        ("UTH-010", ["afternoon", "afternoon", "night", "night", None, "morning", "morning",
                      "afternoon", "afternoon", "night", "night", None, "morning", "morning"]),
        # Operations — day shifts (weekdays only)
        ("UTH-001", ["day", "day", "day", "day", "day", None, None,
                      "day", "day", "day", "day", "day", None, None]),
        ("UTH-008", ["day", "day", "day", "day", "day", None, None,
                      "day", "day", "day", "day", "day", None, None]),
    ]

    # Start from Monday of current week
    today = now.date()
    monday = today - timedelta(days=today.weekday())

    ok = fail = 0
    for emp_num, pattern in schedule_map:
        eid = emp_id(emp_num)
        for day_offset, shift_key in enumerate(pattern):
            if shift_key is None:
                continue
            schedule_date = (monday + timedelta(days=day_offset)).isoformat()
            sched_id = new_id(f"sched-{emp_num}-{day_offset}")
            shift_id = shift_ids[shift_key]

            item = {
                'PK':        {'S': f'TENANT#{TENANT_ID}'},
                'SK':        {'S': f'SHIFT_SCHED#{sched_id}'},
                'GSI1PK':    {'S': f'SS_EMP#{TENANT_ID}#{eid}'},
                'GSI1SK':    {'S': f'{schedule_date}#{sched_id}'},
                'id':        {'S': sched_id},
                'tenantId':  {'S': TENANT_ID},
                'employeeId': {'S': eid},
                'shiftId':   {'S': shift_id},
                'scheduleDate': {'S': schedule_date},
                'status':    {'S': 'SCHEDULED'},
                'notes':     {'S': ''},
                'createdAt': {'S': now_iso},
                'updatedAt': {'S': now_iso},
            }
            success, err = put_item(item)
            if success:
                ok += 1
            else:
                fail += 1
    print(f"  OK  {ok} schedule entries seeded")
    return ok, fail


# ── Geofences — real uThukela District coordinates ────────────────
GEOFENCES = [
    {"key": "newcastle-hq", "name": "Newcastle Head Office",
     "lat": "-27.7575", "lng": "29.9318", "radius": 200,
     "address": "37 Scott Street, Newcastle, 2940, KwaZulu-Natal"},
    {"key": "ladysmith-office", "name": "Ladysmith Office",
     "lat": "-28.5596", "lng": "29.7812", "radius": 150,
     "address": "22 Murchison Street, Ladysmith, 3370, KwaZulu-Natal"},
    {"key": "estcourt-works", "name": "Estcourt Treatment Works",
     "lat": "-29.0044", "lng": "29.8783", "radius": 300,
     "address": "Estcourt Water Treatment Works, Estcourt, 3310, KwaZulu-Natal"},
    {"key": "newcastle-depot", "name": "Newcastle Depot",
     "lat": "-27.7650", "lng": "29.9400", "radius": 250,
     "address": "Industrial Road, Newcastle, 2940, KwaZulu-Natal"},
    {"key": "ladysmith-pump", "name": "Ladysmith Pump Station",
     "lat": "-28.5500", "lng": "29.7700", "radius": 100,
     "address": "Pump Station Road, Ladysmith, 3370, KwaZulu-Natal"},
]


def seed_geofences():
    print("Seeding geofences...")
    ok = fail = 0
    for g in GEOFENCES:
        gid = new_id(f"geo-{g['key']}")
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'GEOFENCE#{gid}'},
            'id':        {'S': gid},
            'tenantId':  {'S': TENANT_ID},
            'name':      {'S': g['name']},
            'latitude':  {'S': g['lat']},
            'longitude': {'S': g['lng']},
            'radiusMeters': {'N': str(g['radius'])},
            'isActive':  {'BOOL': True},
            'address':   {'S': g['address']},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Geofence: {g['name']}")
            ok += 1
        else:
            print(f"  FAIL Geofence {g['name']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    total_ok = total_fail = 0

    shift_ids, ok, fail = seed_shifts()
    total_ok += ok; total_fail += fail

    ok, fail = seed_schedules(shift_ids)
    total_ok += ok; total_fail += fail

    ok, fail = seed_geofences()
    total_ok += ok; total_fail += fail

    print(f"\nDone: {total_ok} created, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
