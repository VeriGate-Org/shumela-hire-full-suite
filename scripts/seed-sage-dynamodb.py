#!/usr/bin/env python3
"""
Direct DynamoDB Sage 300 People integration seeder.

Creates a connected Sage 300 People integration with:
- Connector config (active, tested successfully)
- 5 sync schedules (employee, department, leave, payroll, attendance)
- Recent sync history showing healthy sync status
"""
import json, os, sys, uuid, subprocess
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', 'uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')


def new_id(): return str(uuid.uuid4())
def iso(dt): return dt.strftime('%Y-%m-%dT%H:%M:%S')
def hours_ago(n): return now - timedelta(hours=n)
def days_ago(n): return now - timedelta(days=n)


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


def seed_connector():
    print("Seeding Sage 300 People connector...")
    conn_id = new_id()
    item = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'SAGE_CONFIG#{conn_id}'},
        'GSI1PK': {'S': f'SAGE_TYPE#{TENANT_ID}#SAGE_300_PEOPLE'},
        'GSI1SK': {'S': f'SAGE_CONFIG#{conn_id}'},
        'id':              {'S': conn_id},
        'tenantId':        {'S': TENANT_ID},
        'name':            {'S': 'Sage 300 People — uThukela Water Production'},
        'connectorType':   {'S': 'SAGE_300_PEOPLE'},
        'authMethod':      {'S': 'API_KEY'},
        'baseUrl':         {'S': 'https://sage300.uthukela.gov.za/api/people/v1'},
        'credentials':     {'S': '{"apiKey":"***DEMO***","companyId":"UTH001","siteId":"NEWCASTLE"}'},
        'isActive':        {'BOOL': True},
        'lastTestedAt':    {'S': iso(hours_ago(2))},
        'lastTestSuccess': {'BOOL': True},
        'createdAt':       {'S': iso(days_ago(90))},
        'updatedAt':       {'S': iso(hours_ago(2))},
    }
    ok, err = put_item(item)
    print(f"  {'OK' if ok else 'FAIL'}  Sage 300 People (CONNECTED, last tested {2}h ago)")
    return conn_id


def seed_schedules(conn_id):
    print("\nSeeding sync schedules...")
    schedules = [
        {"entity": "EMPLOYEE",   "direction": "BIDIRECTIONAL", "freq": "DAILY",   "cron": "0 2 * * ?",   "lastRun": hours_ago(6),  "nextRun": hours_ago(-18)},
        {"entity": "DEPARTMENT", "direction": "IMPORT",        "freq": "WEEKLY",  "cron": "0 1 ? * MON", "lastRun": days_ago(3),   "nextRun": days_ago(-4)},
        {"entity": "LEAVE",      "direction": "EXPORT",        "freq": "DAILY",   "cron": "0 3 * * ?",   "lastRun": hours_ago(5),  "nextRun": hours_ago(-19)},
        {"entity": "PAYROLL",    "direction": "IMPORT",        "freq": "MONTHLY", "cron": "0 0 25 * ?",  "lastRun": days_ago(9),   "nextRun": days_ago(-21)},
        {"entity": "ATTENDANCE", "direction": "EXPORT",        "freq": "HOURLY",  "cron": "0 * * * ?",   "lastRun": hours_ago(1),  "nextRun": hours_ago(0)},
    ]

    sched_ids = {}
    for s in schedules:
        sid = new_id()
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'SAGE_SCHEDULE#{sid}'},
            'GSI1PK': {'S': f'SAGE_SCHED_CONN#{TENANT_ID}#{conn_id}'},
            'GSI1SK': {'S': f'SAGE_SCHEDULE#{sid}'},
            'id':             {'S': sid},
            'tenantId':       {'S': TENANT_ID},
            'connectorId':    {'S': conn_id},
            'entityType':     {'S': s['entity']},
            'direction':      {'S': s['direction']},
            'frequency':      {'S': s['freq']},
            'cronExpression': {'S': s['cron']},
            'isActive':       {'BOOL': True},
            'lastRunAt':      {'S': iso(s['lastRun'])},
            'nextRunAt':      {'S': iso(s['nextRun'])},
            'createdAt':      {'S': iso(days_ago(90))},
            'updatedAt':      {'S': now_iso},
        }
        ok, _ = put_item(item)
        arrow = {'IMPORT': '<-', 'EXPORT': '->', 'BIDIRECTIONAL': '<>'}[s['direction']]
        print(f"  OK  {s['entity']:12s} {arrow} Sage  ({s['freq']}, {s['cron']})")
        sched_ids[s['entity']] = sid
    return sched_ids


def seed_sync_logs(conn_id, sched_ids):
    print("\nSeeding sync history...")
    created = 0

    # Recent sync logs — mix of successful and one partial failure
    logs = [
        # Employee daily sync — last 5 days
        {"entity": "EMPLOYEE", "dir": "BIDIRECTIONAL", "status": "COMPLETED", "ago_h": 6,  "dur_m": 12, "processed": 247, "succeeded": 247, "failed": 0, "error": None},
        {"entity": "EMPLOYEE", "dir": "BIDIRECTIONAL", "status": "COMPLETED", "ago_h": 30, "dur_m": 11, "processed": 247, "succeeded": 247, "failed": 0, "error": None},
        {"entity": "EMPLOYEE", "dir": "BIDIRECTIONAL", "status": "COMPLETED", "ago_h": 54, "dur_m": 14, "processed": 245, "succeeded": 243, "failed": 2, "error": "2 records skipped: invalid ID numbers for temp contractors (EMP-T042, EMP-T051)"},
        {"entity": "EMPLOYEE", "dir": "BIDIRECTIONAL", "status": "COMPLETED", "ago_h": 78, "dur_m": 11, "processed": 245, "succeeded": 245, "failed": 0, "error": None},
        {"entity": "EMPLOYEE", "dir": "BIDIRECTIONAL", "status": "COMPLETED", "ago_h": 102, "dur_m": 13, "processed": 244, "succeeded": 244, "failed": 0, "error": None},

        # Department weekly sync
        {"entity": "DEPARTMENT", "dir": "IMPORT", "status": "COMPLETED", "ago_h": 72, "dur_m": 2, "processed": 12, "succeeded": 12, "failed": 0, "error": None},
        {"entity": "DEPARTMENT", "dir": "IMPORT", "status": "COMPLETED", "ago_h": 240, "dur_m": 2, "processed": 11, "succeeded": 11, "failed": 0, "error": None},

        # Leave daily export
        {"entity": "LEAVE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 5,  "dur_m": 8, "processed": 34, "succeeded": 34, "failed": 0, "error": None},
        {"entity": "LEAVE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 29, "dur_m": 7, "processed": 31, "succeeded": 31, "failed": 0, "error": None},
        {"entity": "LEAVE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 53, "dur_m": 9, "processed": 28, "succeeded": 28, "failed": 0, "error": None},

        # Payroll monthly import — last run
        {"entity": "PAYROLL", "dir": "IMPORT", "status": "COMPLETED", "ago_h": 216, "dur_m": 45, "processed": 247, "succeeded": 247, "failed": 0, "error": None},

        # Attendance hourly export — recent
        {"entity": "ATTENDANCE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 1, "dur_m": 3, "processed": 186, "succeeded": 186, "failed": 0, "error": None},
        {"entity": "ATTENDANCE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 2, "dur_m": 3, "processed": 192, "succeeded": 192, "failed": 0, "error": None},
        {"entity": "ATTENDANCE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 3, "dur_m": 4, "processed": 188, "succeeded": 188, "failed": 0, "error": None},

        # One currently running sync
        {"entity": "ATTENDANCE", "dir": "EXPORT", "status": "RUNNING", "ago_h": 0, "dur_m": 0, "processed": 95, "succeeded": 95, "failed": 0, "error": None},
    ]

    for log in logs:
        lid = new_id()
        sched_id = sched_ids.get(log['entity'], '')
        started = hours_ago(log['ago_h'])
        completed = started + timedelta(minutes=log['dur_m']) if log['status'] != 'RUNNING' else None

        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'SAGE_LOG#{lid}'},
            'GSI1PK': {'S': f'SAGE_LOG_CONN#{TENANT_ID}#{conn_id}'},
            'GSI1SK': {'S': f'SAGE_LOG#{lid}'},
            'id':               {'S': lid},
            'tenantId':         {'S': TENANT_ID},
            'scheduleId':       {'S': sched_id},
            'connectorId':      {'S': conn_id},
            'entityType':       {'S': log['entity']},
            'direction':        {'S': log['dir']},
            'status':           {'S': log['status']},
            'recordsProcessed': {'N': str(log['processed'])},
            'recordsSucceeded': {'N': str(log['succeeded'])},
            'recordsFailed':    {'N': str(log['failed'])},
            'startedAt':        {'S': iso(started)},
        }
        if completed:
            item['completedAt'] = {'S': iso(completed)}
        if log['error']:
            item['errorMessage'] = {'S': log['error']}

        ok, _ = put_item(item)
        if ok:
            created += 1

        if log['status'] == 'RUNNING':
            icon = '~'
        elif log['failed'] > 0:
            icon = '!'
        else:
            icon = '+'
        print(f"  [{icon}] {log['entity']:12s} {log['status']:10s} {log['processed']:>4d} records  ({log['succeeded']} ok, {log['failed']} failed)")

    return created


def main():
    resolve_table()
    print("=" * 58)
    print(" uThukela Water — Sage 300 Integration Seeder (DynamoDB)")
    print("=" * 58)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print("=" * 58)
    print()

    conn_id = seed_connector()
    sched_ids = seed_schedules(conn_id)
    log_count = seed_sync_logs(conn_id, sched_ids)

    print()
    print(f"Done: 1 connector (active), 5 schedules, {log_count} sync logs")


if __name__ == '__main__':
    main()
