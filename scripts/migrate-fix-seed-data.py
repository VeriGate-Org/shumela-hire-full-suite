#!/usr/bin/env python3
"""
One-time migration: fix seed records that were created with wrong date formats,
enum values, or GSI keys so the backend can read them correctly.

Affected records:
  - Onboarding templates/checklists: createdAt/updatedAt used LocalDateTime format
    but Java entity expects Instant (needs Z suffix) — DELETE + re-seed
  - Compliance reminders: used invalid ReminderType enum values — DELETE + re-seed
  - IDPs: createdAt/updatedAt used LocalDateTime but should use Instant — DELETE + re-seed
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

    ok = fail = 0

    # ── Onboarding templates ──
    print("Deleting onboarding templates...")
    for key in ['standard', 'water-tech']:
        tid = deterministic_id('ONBOARDING', f'template-{key}')
        success, err = delete_item(pk, f'ONBOARD_TEMPLATE#{tid}')
        if success:
            print(f"  DEL  Template: {key}")
            ok += 1
        else:
            print(f"  FAIL Template {key}: {err}", file=sys.stderr)
            fail += 1

    # ── Onboarding checklists ──
    print("Deleting onboarding checklists...")
    for key in ['cl-1', 'cl-2', 'cl-3', 'cl-4']:
        cid = deterministic_id('ONBOARDING', key)
        success, err = delete_item(pk, f'ONBOARD_CHECKLIST#{cid}')
        if success:
            print(f"  DEL  Checklist: {key}")
            ok += 1
        else:
            print(f"  FAIL Checklist {key}: {err}", file=sys.stderr)
            fail += 1

    # ── Compliance reminders ──
    print("Deleting compliance reminders...")
    for key in [f'rem-{i}' for i in range(1, 9)]:
        rid = deterministic_id('LABOUR', key)
        success, err = delete_item(pk, f'COMP_REMINDER#{rid}')
        if success:
            print(f"  DEL  Reminder: {key}")
            ok += 1
        else:
            print(f"  FAIL Reminder {key}: {err}", file=sys.stderr)
            fail += 1

    # ── IDPs ──
    print("Deleting IDPs...")
    for key in ['idp-1', 'idp-2', 'idp-3', 'idp-4']:
        iid = deterministic_id('PIP_IDP', key)
        success, err = delete_item(pk, f'IDP#{iid}')
        if success:
            print(f"  DEL  IDP: {key}")
            ok += 1
        else:
            print(f"  FAIL IDP {key}: {err}", file=sys.stderr)
            fail += 1

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
            print(f"  FIX  Job Ad #{counter - 6}: GSI1PK → {correct_gsi1pk}")
            ok += 1
        else:
            print(f"  FAIL Job Ad #{counter - 6}: {err}", file=sys.stderr)
            fail += 1

    print(f"\nDone: {ok} fixed, {fail} failed")
    sys.exit(1 if fail > 0 else 0)


if __name__ == '__main__':
    main()
