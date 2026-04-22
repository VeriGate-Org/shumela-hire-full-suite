#!/usr/bin/env python3
"""
One-time migration: update existing employee emails + GSI2PK to match Cognito
role-based emails. This fixes the auth chain for employees already in DynamoDB.

Run once, then delete this script.
"""
import json, os, sys, uuid, subprocess, hashlib

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')


def deterministic_id(tenant_id, entity_type, unique_key):
    seed = f"{tenant_id}:{entity_type}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


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


# Mapping: employee number → new Cognito email
EMAIL_UPDATES = {
    'UTH-001': 'admin@uthukela.shumelahire.co.za',
    'UTH-002': 'hr.manager@uthukela.shumelahire.co.za',
    'UTH-003': 'hiring.manager@uthukela.shumelahire.co.za',
    'UTH-005': 'employee@uthukela.shumelahire.co.za',
    'UTH-006': 'interviewer@uthukela.shumelahire.co.za',
    'UTH-007': 'applicant@uthukela.shumelahire.co.za',
    'UTH-009': 'recruiter@uthukela.shumelahire.co.za',
    'UTH-010': 'executive@uthukela.shumelahire.co.za',
}


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    ok = 0
    fail = 0
    for emp_num, new_email in EMAIL_UPDATES.items():
        eid = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        pk = f'TENANT#{TENANT_ID}'
        sk = f'EMPLOYEE#{eid}'
        new_gsi2pk = f'EMP_EMAIL#{TENANT_ID}#{new_email}'

        result = subprocess.run(
            ['aws', 'dynamodb', 'update-item',
             '--table-name', TABLE_NAME,
             '--region', REGION,
             '--key', json.dumps({
                 'PK': {'S': pk},
                 'SK': {'S': sk},
             }),
             '--update-expression', 'SET email = :email, GSI2PK = :gsi2pk',
             '--expression-attribute-values', json.dumps({
                 ':email': {'S': new_email},
                 ':gsi2pk': {'S': new_gsi2pk},
             }),
             '--condition-expression', 'attribute_exists(PK)'],
            capture_output=True, text=True)

        if result.returncode == 0:
            print(f"  OK  {emp_num} → {new_email}")
            ok += 1
        else:
            print(f"  FAIL {emp_num}: {result.stderr.strip()}", file=sys.stderr)
            fail += 1

    print(f"\nDone: {ok} updated, {fail} failed")
    sys.exit(1 if fail > 0 else 0)


if __name__ == '__main__':
    main()
