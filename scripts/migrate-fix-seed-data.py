#!/usr/bin/env python3
"""
One-time migration: fix seed records that were created with wrong date formats,
enum values, DynamoDB attribute types, or GSI keys.

Affected records:
  - Leave types/balances/requests: createdAt/updatedAt stored as N (epoch) but
    Java Instant expects S (ISO-8601Z) — DELETE all + re-seed
  - Training courses/sessions/enrollments: same N vs S type mismatch — DELETE + re-seed
  - Onboarding templates/checklists: timestamps lacked Z suffix for Instant — DELETE + re-seed
  - Compliance reminders: invalid ReminderType enum values — DELETE + re-seed
  - IDPs: timestamps lacked Z suffix for Instant — DELETE + re-seed
  - PIP milestones: reviewedAt had Z suffix but LocalDateTime rejects Z — DELETE + re-seed
  - Job ads: GSI1PK missing tenant ID scope — UPDATE in-place
"""
import json, os, sys, uuid, subprocess, hashlib

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')


def deterministic_id(namespace, unique_key):
    seed = f"{TENANT_ID}:{namespace}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def delete_item(pk, sk):
    result = subprocess.run(
        ['aws', 'dynamodb', 'delete-item',
         '--table-name', TABLE_NAME,
         '--region', REGION,
         '--key', json.dumps({'PK': {'S': pk}, 'SK': {'S': sk}})],
        capture_output=True, text=True)
    if result.returncode != 0:
        return False, result.stderr.strip()
    return True, ''


def update_item(pk, sk, update_expr, expr_values):
    result = subprocess.run(
        ['aws', 'dynamodb', 'update-item',
         '--table-name', TABLE_NAME,
         '--region', REGION,
         '--key', json.dumps({'PK': {'S': pk}, 'SK': {'S': sk}}),
         '--update-expression', update_expr,
         '--expression-attribute-values', json.dumps(expr_values)],
        capture_output=True, text=True)
    if result.returncode != 0:
        return False, result.stderr.strip()
    return True, ''


def query_sk_prefix(pk, sk_prefix):
    """Query all items matching PK + SK begins_with prefix. Returns list of SK values."""
    sks = []
    last_key = None
    while True:
        cmd = ['aws', 'dynamodb', 'query',
               '--table-name', TABLE_NAME,
               '--region', REGION,
               '--key-condition-expression', 'PK = :pk AND begins_with(SK, :prefix)',
               '--expression-attribute-values', json.dumps({
                   ':pk': {'S': pk},
                   ':prefix': {'S': sk_prefix},
               }),
               '--projection-expression', 'SK',
               '--output', 'json']
        if last_key:
            cmd += ['--exclusive-start-key', json.dumps(last_key)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            break
        data = json.loads(result.stdout)
        for item in data.get('Items', []):
            sks.append(item['SK']['S'])
        last_key = data.get('LastEvaluatedKey')
        if not last_key:
            break
    return sks


def delete_by_prefix(pk, sk_prefix, label):
    """Delete all items matching PK + SK prefix."""
    sks = query_sk_prefix(pk, sk_prefix)
    if not sks:
        print(f"  (no {label} records found)")
        return 0, 0
    ok = fail = 0
    for sk in sks:
        success, err = delete_item(pk, sk)
        if success:
            ok += 1
        else:
            print(f"  FAIL {sk}: {err}", file=sys.stderr)
            fail += 1
    print(f"  DEL  {ok} {label} records")
    return ok, fail


def job_ad_id(counter):
    """Reproduce the deterministic ID from seed-jobs-dynamodb.py."""
    seed = f"{TENANT_ID}:jobs-{counter}"
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


def main():
    resolve_table()
    pk = f'TENANT#{TENANT_ID}'
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print()

    total_ok = total_fail = 0

    # ── Leave data: N-type epoch → S-type ISO (Instant) ──
    print("Deleting leave records (wrong attribute type)...")
    for prefix, label in [
        ('LEAVE_TYPE#', 'leave type'),
        ('LEAVE_BAL#', 'leave balance'),
        ('LEAVE_REQ#', 'leave request'),
    ]:
        ok, fail = delete_by_prefix(pk, prefix, label)
        total_ok += ok; total_fail += fail

    # ── Training data: N-type epoch → S-type ISO (Instant) ──
    print("Deleting training records (wrong attribute type)...")
    for prefix, label in [
        ('TRAIN_COURSE#', 'training course'),
        ('TRAIN_SESSION#', 'training session'),
        ('TRAIN_ENROLL#', 'training enrollment'),
    ]:
        ok, fail = delete_by_prefix(pk, prefix, label)
        total_ok += ok; total_fail += fail

    # ── Onboarding: timestamps lacked Z suffix ──
    print("Deleting onboarding records (wrong timestamp format)...")
    for prefix, label in [
        ('ONBOARD_TEMPLATE#', 'onboarding template'),
        ('ONBOARD_CHECKLIST#', 'onboarding checklist'),
    ]:
        ok, fail = delete_by_prefix(pk, prefix, label)
        total_ok += ok; total_fail += fail

    # ── Compliance reminders: wrong enum values ──
    print("Deleting compliance reminders (wrong enum values)...")
    ok, fail = delete_by_prefix(pk, 'COMP_REMINDER#', 'compliance reminder')
    total_ok += ok; total_fail += fail

    # ── IDPs: timestamps lacked Z suffix ──
    print("Deleting IDPs (wrong timestamp format)...")
    ok, fail = delete_by_prefix(pk, 'IDP#', 'IDP')
    total_ok += ok; total_fail += fail

    # ── PIP milestones: reviewedAt had Z suffix but LocalDateTime rejects Z ──
    print("Deleting PIP milestones (reviewedAt Z suffix issue)...")
    ok, fail = delete_by_prefix(pk, 'PIP_MILE#', 'PIP milestone')
    total_ok += ok; total_fail += fail

    # ── Old-PK employees: initial seeding used TENANT_ID='uthukela' ──
    # Records were created with PK=TENANT#uthukela but the correct tenant ID
    # is 97282820-uthukela. Delete orphans so only the correct records remain.
    old_pk = 'TENANT#uthukela'
    if old_pk != pk:
        print("Cleaning up old-PK employee records (TENANT#uthukela)...")
        for prefix, label in [
            ('EMPLOYEE#', 'employee'),
            ('USER#', 'user'),
        ]:
            ok, fail = delete_by_prefix(old_pk, prefix, label)
            total_ok += ok; total_fail += fail

    # ── User records: delete so seed script re-creates with correct fields ──
    # CognitoUserProvisioningFilter may have auto-created users with incomplete data.
    # The seed script creates proper records with all GSI keys.
    print("Deleting user records (will be re-seeded)...")
    ok, fail = delete_by_prefix(pk, 'USER#', 'user')
    total_ok += ok; total_fail += fail

    # ── Job Ads: fix GSI1PK (was missing tenant ID) ──
    # seed-jobs-dynamodb.py calls new_id() for 6 postings (counters 1-6),
    # then 6 ads (counters 7-12)
    print("Fixing job ad GSI1PK (adding tenant scope)...")
    correct_gsi1pk = f'JOBAD_STATUS#{TENANT_ID}#PUBLISHED'
    for counter in range(7, 13):
        ad_id = job_ad_id(counter)
        success, err = update_item(
            pk, f'JOB_AD#{ad_id}',
            'SET GSI1PK = :gsi1pk',
            {':gsi1pk': {'S': correct_gsi1pk}})
        if success:
            print(f"  FIX  Job Ad #{counter - 6}: GSI1PK → ...#{TENANT_ID}#PUBLISHED")
            total_ok += 1
        else:
            print(f"  FAIL Job Ad #{counter - 6}: {err}", file=sys.stderr)
            total_fail += 1

    print(f"\nDone: {total_ok} fixed, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
