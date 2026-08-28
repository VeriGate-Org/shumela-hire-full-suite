#!/usr/bin/env python3
"""
Direct DynamoDB report-schedule seeder.

Seeds schedules against the report templates that seed-report-templates-dynamodb.py
creates, so the Scheduler tab and the Reports decision bar have something real to show.

Requires the scheduling backend (PR #351). Before that, GET /api/reports/scheduled
returned an empty list unconditionally and a seeded schedule would never have appeared.

Idempotent — a condition expression skips items that already exist.

Usage:
  export AWS_PROFILE="alusa-dev"
  export AWS_REGION="af-south-1"
  export DYNAMODB_TABLE_NAME="shumelahire-data"
  export TENANT_ID="idc"
  python3 scripts/seed-report-schedules-dynamodb.py           # dry run
  python3 scripts/seed-report-schedules-dynamodb.py --apply
"""
import json, os, sys, uuid, hashlib, subprocess
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', 'idc')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')
CREATED_BY = os.environ.get('CREATED_BY', 'admin@idc.shumelahire.co.za')
APPLY = '--apply' in sys.argv

now = datetime.now(timezone.utc)


def rid(key):
    return str(uuid.UUID(hashlib.sha256(f'{TENANT_ID}:{key}'.encode()).hexdigest()[:32]))


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def s(v):
    return {'S': v}


def at_six(dt):
    return dt.replace(hour=6, minute=0, second=0, microsecond=0)


# Keyed to the report templates seeded by the sibling script, so reportId resolves.
SCHEDULES = [
    {
        'key': 'sched-pipeline-daily',
        'report_key': 'pipeline-by-department',
        'report_name': 'Pipeline by department',
        'frequency': 'DAILY',
        'recipients': ['hr@idc.shumelahire.co.za', 'recruitment@idc.shumelahire.co.za'],
        'enabled': True,
        'run_count': 41,
        'last_run_days': 1,
        'status': 'SUCCESS',
        'error': None,
    },
    {
        'key': 'sched-time-to-hire-weekly',
        'report_key': 'time-to-hire',
        'report_name': 'Time to hire',
        'frequency': 'WEEKLY',
        'recipients': ['exco@idc.shumelahire.co.za'],
        'enabled': True,
        'run_count': 18,
        'last_run_days': 3,
        'status': 'SUCCESS',
        'error': None,
    },
    {
        # The state the Reports decision bar exists for: people are expecting this and did not
        # get it. A seed where everything succeeds would never exercise that path.
        'key': 'sched-offer-conversion-weekly',
        'report_key': 'offer-conversion',
        'report_name': 'Offer conversion',
        'frequency': 'WEEKLY',
        'recipients': ['exco@idc.shumelahire.co.za', 'ceo@idc.shumelahire.co.za'],
        'enabled': True,
        'run_count': 6,
        'last_run_days': 2,
        'status': 'FAILED',
        'error': 'Delivery failed: mailbox exco@idc.shumelahire.co.za rejected the attachment (size limit)',
    },
    {
        'key': 'sched-source-monthly',
        'report_key': 'source-effectiveness',
        'report_name': 'Where our hires come from',
        'frequency': 'MONTHLY',
        'recipients': ['recruitment@idc.shumelahire.co.za'],
        'enabled': True,
        'run_count': 4,
        'last_run_days': 12,
        'status': 'SUCCESS',
        'error': None,
    },
    {
        # Paused deliberately — a decision, not a fault. The distribution strip separates the two.
        'key': 'sched-interview-load-weekly',
        'report_key': 'interview-load',
        'report_name': 'Interview load by panel',
        'frequency': 'WEEKLY',
        'recipients': ['hr@idc.shumelahire.co.za'],
        'enabled': False,
        'run_count': 9,
        'last_run_days': 34,
        'status': 'SUCCESS',
        'error': None,
    },
    {
        # Created and never run: a real state that a uniform seed would hide.
        'key': 'sched-salary-audit-monthly',
        'report_key': 'salary-band-audit',
        'report_name': 'Salary bands against offers',
        'frequency': 'MONTHLY',
        'recipients': ['audit@idc.shumelahire.co.za'],
        'enabled': True,
        'run_count': 0,
        'last_run_days': None,
        'status': 'PENDING',
        'error': None,
    },
]


def next_run(sched):
    if not sched['enabled']:
        # Paused schedules keep the run they would have had; resuming re-bases it server-side.
        return at_six(now + timedelta(days=1))
    if sched['frequency'] == 'DAILY':
        return at_six(now + timedelta(days=1))
    if sched['frequency'] == 'WEEKLY':
        return at_six(now + timedelta(days=7))
    return at_six((now.replace(day=1) + timedelta(days=32)).replace(day=1))


def build(sched):
    sid = rid(sched['key'])
    created = now - timedelta(days=90)
    item = {
        'PK': s(f'TENANT#{TENANT_ID}'),
        'SK': s(f'REPORT_SCHEDULE#{sid}'),
        'id': s(sid),
        'tenantId': s(TENANT_ID),
        'reportId': s(rid(sched['report_key'])),
        'reportName': s(sched['report_name']),
        'frequency': s(sched['frequency']),
        'recipients': {'L': [s(r) for r in sched['recipients']]},
        'enabled': {'BOOL': sched['enabled']},
        'nextRun': s(iso(next_run(sched))),
        'runCount': {'N': str(sched['run_count'])},
        'lastStatus': s(sched['status']),
        'createdBy': s(CREATED_BY),
        'createdAt': s(iso(created)),
        'updatedAt': s(iso(now)),
    }
    if sched['last_run_days'] is not None:
        item['lastRun'] = s(iso(at_six(now - timedelta(days=sched['last_run_days']))))
    if sched['error']:
        item['errorMessage'] = s(sched['error'])
    return item


def put_item(item):
    r = subprocess.run(
        ['aws', 'dynamodb', 'put-item', '--table-name', TABLE_NAME, '--region', REGION,
         '--condition-expression', 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
         '--item', json.dumps(item)],
        capture_output=True, text=True)
    if 'ConditionalCheckFailedException' in (r.stderr or ''):
        return True, 'SKIPPED (already present)'
    if r.returncode != 0:
        return False, (r.stderr or 'unknown error').strip().splitlines()[-1]
    return True, 'written'


def main():
    if not TABLE_NAME:
        print('ERROR: set DYNAMODB_TABLE_NAME (e.g. shumelahire-data).', file=sys.stderr)
        sys.exit(1)

    r = subprocess.run(['aws', 'sts', 'get-caller-identity', '--region', REGION, '--output', 'json'],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print('ERROR: AWS credentials not configured.', file=sys.stderr)
        sys.exit(1)

    print('Report schedule seeder')
    print(f'  Table:  {TABLE_NAME} ({REGION})')
    print(f'  Tenant: TENANT#{TENANT_ID}')
    print(f'  Identity: {json.loads(r.stdout).get("Arn")}')
    print(f'  Mode:   {"APPLY — will write" if APPLY else "DRY RUN — nothing will be written"}')
    print()

    ok = failed = 0
    for sched in SCHEDULES:
        item = build(sched)
        label = f"{sched['report_name']} ({sched['frequency'].lower()})"
        state = sched['status'].lower() + ('' if sched['enabled'] else ', paused')
        if not APPLY:
            print(f'  would write  {label:<44} {state}')
            continue
        good, note = put_item(item)
        print(f'  {"✓" if good else "✗"} {label:<44} {state:<18} {note}')
        ok += good
        failed += (not good)

    print()
    if APPLY:
        print(f'  {ok} written or already present, {failed} failed')
    else:
        print(f'  {len(SCHEDULES)} schedules would be written. Re-run with --apply.')
    print()
    print('  One is FAILED on purpose — that is the state the Reports decision bar exists for,')
    print('  and a seed where everything succeeds never exercises it.')


if __name__ == '__main__':
    main()
