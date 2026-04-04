#!/usr/bin/env python3
"""
Direct DynamoDB Sage Evolution ERP integration seeder.

Creates a connected Sage Evolution connector with sync schedules and history.
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
    print("Seeding Sage Evolution connector...")
    conn_id = new_id()
    item = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'SAGE_CONFIG#{conn_id}'},
        'GSI1PK': {'S': f'SAGE_TYPE#{TENANT_ID}#SAGE_EVOLUTION'},
        'GSI1SK': {'S': f'SAGE_CONFIG#{conn_id}'},
        'id':              {'S': conn_id},
        'tenantId':        {'S': TENANT_ID},
        'name':            {'S': 'Sage Evolution — uThukela Water Finance'},
        'connectorType':   {'S': 'SAGE_EVOLUTION'},
        'authMethod':      {'S': 'BASIC_AUTH'},
        'baseUrl':         {'S': 'https://evo.uthukela.gov.za/api/v2'},
        'credentials':     {'S': '{"username":"shumelahire_svc","password":"***DEMO***","database":"UTH_FINANCE","branch":"001"}'},
        'isActive':        {'BOOL': True},
        'lastTestedAt':    {'S': iso(hours_ago(1))},
        'lastTestSuccess': {'BOOL': True},
        'createdAt':       {'S': iso(days_ago(60))},
        'updatedAt':       {'S': iso(hours_ago(1))},
    }
    ok, err = put_item(item)
    print(f"  {'OK' if ok else 'FAIL'}  Sage Evolution (CONNECTED, last tested 1h ago)")
    return conn_id


def seed_schedules(conn_id):
    print("\nSeeding sync schedules...")
    schedules = [
        {"entity": "EMPLOYEE",   "direction": "EXPORT",  "freq": "DAILY",   "cron": "0 4 * * ?",   "lastRun": hours_ago(4),  "nextRun": hours_ago(-20)},
        {"entity": "DEPARTMENT", "direction": "EXPORT",  "freq": "WEEKLY",  "cron": "0 3 ? * MON", "lastRun": days_ago(2),   "nextRun": days_ago(-5)},
        {"entity": "PAYROLL",    "direction": "IMPORT",  "freq": "MONTHLY", "cron": "0 1 26 * ?",  "lastRun": days_ago(10),  "nextRun": days_ago(-20)},
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
            'createdAt':      {'S': iso(days_ago(60))},
            'updatedAt':      {'S': now_iso},
        }
        ok, _ = put_item(item)
        arrow = {'IMPORT': '<-', 'EXPORT': '->', 'BIDIRECTIONAL': '<>'}[s['direction']]
        print(f"  OK  {s['entity']:12s} {arrow} Evo   ({s['freq']}, {s['cron']})")
        sched_ids[s['entity']] = sid
    return sched_ids


def seed_sync_logs(conn_id, sched_ids):
    print("\nSeeding sync history...")
    created = 0

    logs = [
        # Employee daily export — last 3 days
        {"entity": "EMPLOYEE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 4,  "dur_m": 8,  "processed": 247, "succeeded": 247, "failed": 0, "error": None},
        {"entity": "EMPLOYEE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 28, "dur_m": 9,  "processed": 247, "succeeded": 247, "failed": 0, "error": None},
        {"entity": "EMPLOYEE", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 52, "dur_m": 8,  "processed": 245, "succeeded": 245, "failed": 0, "error": None},

        # Department weekly export
        {"entity": "DEPARTMENT", "dir": "EXPORT", "status": "COMPLETED", "ago_h": 48, "dur_m": 1, "processed": 12, "succeeded": 12, "failed": 0, "error": None},

        # Payroll monthly import — last run
        {"entity": "PAYROLL", "dir": "IMPORT", "status": "COMPLETED", "ago_h": 240, "dur_m": 35, "processed": 247, "succeeded": 246, "failed": 1, "error": "1 record skipped: cost centre mismatch for EMP-C019 (mapped to inactive GL account)"},
    ]

    for log in logs:
        lid = new_id()
        sched_id = sched_ids.get(log['entity'], '')
        started = hours_ago(log['ago_h'])
        completed = started + timedelta(minutes=log['dur_m'])

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
            'completedAt':      {'S': iso(completed)},
        }
        if log['error']:
            item['errorMessage'] = {'S': log['error']}

        ok, _ = put_item(item)
        if ok:
            created += 1
        icon = '!' if log['failed'] > 0 else '+'
        print(f"  [{icon}] {log['entity']:12s} {log['status']:10s} {log['processed']:>4d} records  ({log['succeeded']} ok, {log['failed']} failed)")

    return created


def main():
    resolve_table()
    print("=" * 60)
    print(" uThukela Water — Sage Evolution Integration Seeder (DynamoDB)")
    print("=" * 60)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print("=" * 60)
    print()

    conn_id = seed_connector()
    sched_ids = seed_schedules(conn_id)
    log_count = seed_sync_logs(conn_id, sched_ids)

    print()
    print(f"Done: 1 connector (active), 3 schedules, {log_count} sync logs")


if __name__ == '__main__':
    main()
