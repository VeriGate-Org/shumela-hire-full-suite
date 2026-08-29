#!/usr/bin/env python3
"""
Backfill GSI2 on existing tenant rows.

GET /api/platform/tenants listed one partition while claiming to list the platform, because
tenant rows are their own partition and the inherited findAll() queries whichever tenant is in
context. The fix queries a constant GSI2 partition instead — but an index only contains rows
that carry its key, and rows written before the change do not.

So every existing tenant row needs GSI2PK/GSI2SK written once. New and updated tenants get them
from the repository's mapper.

Finding the rows: a Query on GSI1 per known status would miss a tenant whose status is anything
else, which is the whole reason GSI2 exists. This scans instead — correct regardless of status,
and acceptable precisely once, for a table whose tenant rows number in the tens.

  export AWS_PROFILE=alusa-dev
  export AWS_REGION=af-south-1
  export DYNAMODB_TABLE_NAME=shumelahire-data
  python3 scripts/backfill-tenant-index-dynamodb.py           # dry run
  python3 scripts/backfill-tenant-index-dynamodb.py --apply   # writes
"""
import json, os, subprocess, sys

REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'shumelahire-data')
APPLY = '--apply' in sys.argv

ALL_TENANTS = 'TENANT'   # must match DynamoTenantRepository.ALL_TENANTS


def aws(*args):
    result = subprocess.run(['aws', *args, '--region', REGION], capture_output=True, text=True)
    if result.returncode != 0:
        line = result.stderr.strip().splitlines()[-1] if result.stderr else 'unknown error'
        print(f'ERROR: {line}', file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout) if result.stdout.strip() else {}


def tenant_rows():
    """Tenant root rows: PK = SK = TENANT#{id}. Paginated, because a scan is."""
    rows, start_key = [], None
    while True:
        args = ['dynamodb', 'scan', '--table-name', TABLE_NAME,
                '--filter-expression', 'begins_with(PK, :t) AND PK = SK',
                '--expression-attribute-values', json.dumps({':t': {'S': 'TENANT#'}})]
        if start_key:
            args += ['--exclusive-start-key', json.dumps(start_key)]
        page = aws(*args)
        rows.extend(page.get('Items', []))
        start_key = page.get('LastEvaluatedKey')
        if not start_key:
            return rows


def main():
    print('Tenant index backfill (GSI2)')
    print(f'  Table:   {TABLE_NAME} ({REGION})')
    print(f'  Mode:    {"APPLY — will write" if APPLY else "DRY RUN — nothing will be written"}')
    print()

    rows = tenant_rows()
    done = already = 0

    for item in rows:
        tenant_id = item.get('id', {}).get('S') or item['PK']['S'].split('#', 1)[1]
        name = item.get('name', {}).get('S', '(unnamed)')
        status = item.get('status', {}).get('S', '(none)')

        if item.get('GSI2PK', {}).get('S') == ALL_TENANTS:
            print(f'  — {name:<28} {status:<10} already indexed')
            already += 1
            continue

        print(f'  {"✓" if APPLY else "would index"} {name:<28} {status:<10} {tenant_id}')
        if APPLY:
            aws('dynamodb', 'update-item',
                '--table-name', TABLE_NAME,
                '--key', json.dumps({'PK': item['PK'], 'SK': item['SK']}),
                '--update-expression', 'SET GSI2PK = :pk, GSI2SK = :sk',
                '--expression-attribute-values',
                json.dumps({':pk': {'S': ALL_TENANTS}, ':sk': {'S': 'TENANT#' + tenant_id}}))
        done += 1

    print()
    print(f'  {len(rows)} tenant row(s): {done} {"indexed" if APPLY else "would be indexed"}, '
          f'{already} already indexed')
    if not APPLY and done:
        print('  Re-run with --apply to write them.')


if __name__ == '__main__':
    main()
