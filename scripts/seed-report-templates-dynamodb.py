#!/usr/bin/env python3
"""
Direct DynamoDB report-library seeder.

Seeds saved report templates so the Reports library is not empty on a fresh
tenant. Writes straight to DynamoDB, so it works in any environment.

Idempotent — a condition expression skips items that already exist, so re-running
is safe and will not duplicate or overwrite.

WHAT THIS DOES NOT SEED — schedules.

  Report scheduling is not implemented in the backend. `GET /api/reports/scheduled`
  returns `List.of()` unconditionally, and `POST /api/reports/schedule` returns
  {"scheduled": false, "message": "...will be available in future version"}. The
  frontend's Create Schedule form only updates its own React state and never calls
  either one. There is no table, no entity and no repository behind it.

  So a seeded schedule would be written into a store nothing reads and would never
  appear in the Scheduler tab. Rather than write data that cannot surface, this
  script seeds the library only. See ReportingController.getScheduledReports().

Prerequisites:
  - AWS credentials for the target account
  - The DynamoDB table must exist

Usage:
  export AWS_PROFILE="alusa-dev"
  export AWS_REGION="af-south-1"
  export DYNAMODB_TABLE_NAME="shumelahire-data"
  export TENANT_ID="idc"
  export CREATED_BY="admin@idc.shumelahire.co.za"
  python3 scripts/seed-report-templates-dynamodb.py           # dry run, prints what it would write
  python3 scripts/seed-report-templates-dynamodb.py --apply   # actually writes
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', 'idc')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')
CREATED_BY = os.environ.get('CREATED_BY', 'admin@idc.shumelahire.co.za')
APPLY = '--apply' in sys.argv

now = datetime.now(timezone.utc)


def new_id(unique_key):
    """Deterministic per tenant, so a re-run produces the same IDs and stays idempotent."""
    return str(uuid.UUID(hashlib.sha256(f'{TENANT_ID}:{unique_key}'.encode()).hexdigest()[:32]))


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def s(v):
    return {'S': v}


# The field ids are the ones AVAILABLE_FIELDS offers in the reports page; a report referencing a
# field that does not exist there would open in the builder with columns it cannot show.
REPORTS = [
    {
        'key': 'pipeline-by-department',
        'name': 'Pipeline by department',
        'description': 'Where every live application sits, grouped by the department that raised the vacancy.',
        'fields': ['position_department', 'position_title', 'candidate_name', 'application_date', 'candidate_score'],
        'visualization': {'type': 'table', 'groupBy': 'position_department'},
        'tags': ['recruitment', 'operational'],
        'run_count': 34,
        'last_run_days_ago': 1,
        'range_days': 90,
    },
    {
        'key': 'time-to-hire',
        'name': 'Time to hire',
        'description': 'Days from application to hire, by role. The figure most often asked for at exco.',
        'fields': ['position_title', 'position_department', 'time_to_hire', 'hire_date'],
        'visualization': {'type': 'bar', 'groupBy': 'position_department', 'aggregate': 'avg'},
        'tags': ['recruitment', 'executive'],
        'run_count': 21,
        'last_run_days_ago': 4,
        'range_days': 180,
    },
    {
        'key': 'source-effectiveness',
        'name': 'Where our hires come from',
        'description': 'Applications and successful hires by source, so spend follows what actually works.',
        'fields': ['candidate_source', 'applications_count', 'hires_count', 'conversion_rate'],
        'visualization': {'type': 'bar', 'groupBy': 'candidate_source'},
        'tags': ['recruitment', 'sourcing'],
        'run_count': 12,
        'last_run_days_ago': 9,
        'range_days': 365,
    },
    {
        'key': 'offer-conversion',
        'name': 'Offer conversion',
        'description': 'Offers made against offers accepted. A falling rate is a pay or process problem, not a sourcing one.',
        'fields': ['position_title', 'offers_count', 'hires_count', 'conversion_rate', 'offer_date'],
        'visualization': {'type': 'line', 'groupBy': 'offer_date'},
        'tags': ['recruitment', 'executive'],
        'run_count': 8,
        'last_run_days_ago': 16,
        'range_days': 365,
    },
    {
        'key': 'interview-load',
        'name': 'Interview load by panel',
        'description': 'How many interviews each panel member is carrying, and how many are still unscheduled.',
        'fields': ['position_title', 'interviews_count', 'interview_date', 'candidate_name'],
        'visualization': {'type': 'table', 'groupBy': 'interview_date'},
        'tags': ['operational'],
        'run_count': 5,
        'last_run_days_ago': 27,
        'range_days': 60,
    },
    {
        'key': 'salary-band-audit',
        'name': 'Salary bands against offers',
        'description': 'Offered salary against the advertised band, per role. Written for the annual audit.',
        'fields': ['position_title', 'position_level', 'position_salary_min', 'position_salary_max', 'cost_per_hire'],
        'visualization': {'type': 'table', 'groupBy': 'position_level'},
        'tags': ['compliance', 'executive'],
        'run_count': 0,      # created for the audit and not yet run — a real and useful state
        'last_run_days_ago': None,
        'range_days': 365,
    },
]


def build(report):
    rid = new_id(report['key'])
    created = now - timedelta(days=report['range_days'] // 2)
    last_run = None if report['last_run_days_ago'] is None else now - timedelta(days=report['last_run_days_ago'])
    item = {
        'PK': s(f'TENANT#{TENANT_ID}'),
        'SK': s(f'REPORT_TEMPLATE#{rid}'),
        'id': s(rid),
        'tenantId': s(TENANT_ID),
        'name': s(report['name']),
        'description': s(report['description']),
        'createdBy': s(CREATED_BY),
        # Shared, because getReportsForUser matches on shared==true OR createdBy==email. An
        # unshared report seeded under one address would be invisible to everyone else.
        'shared': {'BOOL': True},
        'system': {'BOOL': False},
        'runCount': {'N': str(report['run_count'])},
        'fieldsJson': s(json.dumps(report['fields'])),
        'filtersJson': s(json.dumps([])),
        'visualizationJson': s(json.dumps(report['visualization'])),
        # No schedule: scheduling is not implemented, and a schedule block here would describe
        # something that cannot run.
        'scheduleJson': s(json.dumps(None)),
        'dateRangeJson': s(json.dumps({
            'start': iso(now - timedelta(days=report['range_days'])),
            'end': iso(now),
        })),
        'tagsJson': s(json.dumps(report['tags'])),
        'createdAt': s(iso(created)),
        'updatedAt': s(iso(last_run or created)),
    }
    if last_run:
        item['lastRun'] = s(iso(last_run))
    return item


def put_item(item):
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--condition-expression', 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
         '--item', json.dumps(item)],
        capture_output=True, text=True)
    if 'ConditionalCheckFailedException' in (result.stderr or ''):
        return True, 'SKIPPED (already present)'
    if result.returncode != 0:
        return False, result.stderr.strip().splitlines()[-1] if result.stderr else 'unknown error'
    return True, 'written'


def check_credentials():
    r = subprocess.run(['aws', 'sts', 'get-caller-identity', '--region', REGION, '--output', 'json'],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print('ERROR: AWS credentials not configured.', file=sys.stderr)
        print(f'       {r.stderr.strip()}', file=sys.stderr)
        sys.exit(1)
    ident = json.loads(r.stdout)
    print(f'  Account: {ident.get("Account")}')
    print(f'  Identity: {ident.get("Arn")}')


def main():
    if not TABLE_NAME:
        print('ERROR: set DYNAMODB_TABLE_NAME (e.g. shumelahire-data).', file=sys.stderr)
        sys.exit(1)

    print('Report library seeder')
    print(f'  Table:   {TABLE_NAME} ({REGION})')
    print(f'  Tenant:  TENANT#{TENANT_ID}')
    print(f'  Owner:   {CREATED_BY}  (shared: visible to all users in the tenant)')
    check_credentials()
    print(f'  Mode:    {"APPLY — will write" if APPLY else "DRY RUN — nothing will be written"}')
    print()

    ok = failed = 0
    for report in REPORTS:
        item = build(report)
        rid = item['id']['S']
        if not APPLY:
            runs = item['runCount']['N']
            print(f'  would write  {report["name"]:<34} runs={runs:<3} id={rid}')
            continue
        good, note = put_item(item)
        print(f'  {"✓" if good else "✗"} {report["name"]:<34} {note}')
        ok += good
        failed += (not good)

    print()
    if APPLY:
        print(f'  {ok} written or already present, {failed} failed')
    else:
        print(f'  {len(REPORTS)} report templates would be written. Re-run with --apply to write them.')
    print()
    print('  Schedules are NOT seeded — the backend has no scheduling implementation.')
    print('  See the note at the top of this file.')


if __name__ == '__main__':
    main()
