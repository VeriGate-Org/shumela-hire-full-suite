#!/usr/bin/env python3
"""
One-shot patch: wire 5 existing uThukela employees to report to John van Wyk
(UTH-011, line.manager@uthukela.shumelahire.co.za).

Updates `reportingManagerId` (entity attribute) and `GSI5PK` (manager lookup
index) on the 5 existing employee records, leaving every other field intact.

Run AFTER seed-employees-dynamodb.py / seed-users-dynamodb.py /
seed-uthukela-water-cognito-users.sh have been re-run to add UTH-011.

Idempotent: re-runs are no-ops because the values match.
"""
import hashlib
import json
import os
import subprocess
import sys
import uuid

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

MANAGER_NUMBER = 'UTH-011'
REPORT_NUMBERS = ['UTH-005', 'UTH-006', 'UTH-007', 'UTH-009', 'UTH-010']


def deterministic_id(entity_type, unique_key):
    seed = f"{TENANT_ID}:{entity_type}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def resolve_table():
    global TABLE_NAME
    if TABLE_NAME:
        return
    prefix = os.environ.get('STACK_PREFIX', 'shumelahire-dev')
    result = subprocess.run(
        ['aws', 'cloudformation', 'describe-stacks',
         '--stack-name', f'{prefix}-serverless', '--region', REGION,
         '--query', 'Stacks[0].Outputs[?OutputKey==`DataTableName`].OutputValue',
         '--output', 'text'], capture_output=True, text=True)
    TABLE_NAME = result.stdout.strip()
    if not TABLE_NAME or TABLE_NAME == 'None':
        TABLE_NAME = f'{prefix}-data'


def patch_employee(emp_number, manager_id):
    eid = deterministic_id('EMPLOYEE', emp_number)
    gsi5pk = f'EMP_MGR#{TENANT_ID}#{manager_id}'

    result = subprocess.run(
        ['aws', 'dynamodb', 'update-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key', json.dumps({
             'PK': {'S': f'TENANT#{TENANT_ID}'},
             'SK': {'S': f'EMPLOYEE#{eid}'},
         }),
         '--condition-expression', 'attribute_exists(PK)',
         '--update-expression', 'SET reportingManagerId = :mid, GSI5PK = :gpk',
         '--expression-attribute-values', json.dumps({
             ':mid': {'S': manager_id},
             ':gpk': {'S': gsi5pk},
         })],
        capture_output=True, text=True)

    if result.returncode == 0:
        return True, ''
    return False, result.stderr.strip()


def main():
    resolve_table()
    manager_id = deterministic_id('EMPLOYEE', MANAGER_NUMBER)

    print('=' * 62)
    print(' uThukela Water — Patch line-manager reports')
    print('=' * 62)
    print(f' Table:        {TABLE_NAME}')
    print(f' Tenant:       {TENANT_ID}')
    print(f' Region:       {REGION}')
    print(f' Manager:      {MANAGER_NUMBER} (id={manager_id})')
    print(f' Reports:      {", ".join(REPORT_NUMBERS)}')
    print('=' * 62)

    ok = 0
    fail = 0
    for emp_number in REPORT_NUMBERS:
        success, err = patch_employee(emp_number, manager_id)
        if success:
            print(f'  OK   {emp_number} -> manager {MANAGER_NUMBER}')
            ok += 1
        else:
            print(f'  FAIL {emp_number}: {err}', file=sys.stderr)
            fail += 1

    print()
    print(f'Done: {ok} updated, {fail} failed')
    sys.exit(1 if fail > 0 else 0)


if __name__ == '__main__':
    main()
