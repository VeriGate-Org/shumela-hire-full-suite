#!/usr/bin/env python3
"""
Cleanup script: delete all DynamoDB items under the wrong tenant PK.

The seed scripts originally wrote data under TENANT#uthukela instead of
TENANT#97282820-uthukela. This script removes those orphaned records.

Usage:
  export AWS_REGION="af-south-1"
  export DYNAMODB_TABLE_NAME="shumelahire-dev-data"
  python3 scripts/cleanup-orphaned-tenant-data.py
"""
import json, os, sys, subprocess

ORPHANED_TENANT_ID = os.environ.get('ORPHANED_TENANT_ID', 'uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'shumelahire-dev-data')

DRY_RUN = os.environ.get('DRY_RUN', 'false').lower() == 'true'


def query_page(exclusive_start_key=None):
    """Query all items with PK = TENANT#{ORPHANED_TENANT_ID}."""
    cmd = [
        'aws', 'dynamodb', 'query',
        '--table-name', TABLE_NAME, '--region', REGION,
        '--key-condition-expression', 'PK = :pk',
        '--expression-attribute-values', json.dumps({
            ':pk': {'S': f'TENANT#{ORPHANED_TENANT_ID}'}
        }),
        '--projection-expression', 'PK,SK',
        '--limit', '500',
        '--output', 'json'
    ]
    if exclusive_start_key:
        cmd.extend(['--exclusive-start-key', json.dumps(exclusive_start_key)])

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'ERROR: Query failed: {result.stderr.strip()}', file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)


def batch_delete(items):
    """Delete items in batches of 25."""
    batch_size = 25
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        delete_requests = [
            {'DeleteRequest': {'Key': {'PK': item['PK'], 'SK': item['SK']}}}
            for item in batch
        ]
        request_items = {TABLE_NAME: delete_requests}

        if DRY_RUN:
            print(f'  [DRY RUN] Would delete {len(batch)} items')
            continue

        result = subprocess.run(
            ['aws', 'dynamodb', 'batch-write-item',
             '--region', REGION,
             '--request-items', json.dumps(request_items)],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f'  ERROR: Batch delete failed: {result.stderr.strip()}', file=sys.stderr)
        else:
            print(f'  Deleted {len(batch)} items')


def main():
    print(f'Cleanup orphaned data under TENANT#{ORPHANED_TENANT_ID}')
    print(f'  Table: {TABLE_NAME}')
    print(f'  Region: {REGION}')
    print(f'  Dry run: {DRY_RUN}')
    print()

    total = 0
    last_key = None

    while True:
        response = query_page(last_key)
        items = response.get('Items', [])
        total += len(items)

        if items:
            print(f'Found {len(items)} items (total: {total})...')
            batch_delete(items)

        last_key = response.get('LastEvaluatedKey')
        if not last_key:
            break

    print(f'\nDone. {"Would delete" if DRY_RUN else "Deleted"} {total} orphaned items.')


if __name__ == '__main__':
    main()
