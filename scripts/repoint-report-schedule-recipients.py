#!/usr/bin/env python3
"""
Repoint seeded report schedules at a mailbox that exists.

The schedules were seeded against addresses at idc.shumelahire.co.za — hr@, exco@,
recruitment@, audit@, ceo@. That subdomain has no MX record. It resolves, because the zone
carries a wildcard A record pointing at CloudFront, but nothing there accepts mail.

While the platform sent nothing this was harmless. It stopped being harmless the moment SES
was switched on: a schedule would either bounce (before the recipient guard) or be refused by
it (after), and in both cases a demo that is meant to show a working report never shows one.

So the demo schedules now go to a real mailbox. Everything else about them — cadence, run
counts, statuses, the deliberate mix of states — is untouched.

  export AWS_PROFILE=alusa-dev
  export AWS_REGION=af-south-1
  export DYNAMODB_TABLE_NAME=shumelahire-data
  export TENANT_ID=idc
  python3 scripts/repoint-report-schedule-recipients.py           # dry run, prints the change
  python3 scripts/repoint-report-schedule-recipients.py --apply   # writes it
"""
import json, os, subprocess, sys

TENANT_ID = os.environ.get('TENANT_ID', 'idc')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'shumelahire-data')
APPLY = '--apply' in sys.argv

# Where a report addressed to a group should now go. Two, because one schedule was seeded with
# two recipients deliberately and losing that would flatten what the distribution strip shows.
#
# Both are addresses this business is documented as using: info@ is the published company address
# and arthur@ is the account its automated alerts are sent from. That test matters. The first
# choice here was support@arthmatic.co.za, picked because an SES identity existed for it — and
# that identity turns out to be UNVERIFIED, created and never confirmed. An identity is not
# evidence of a mailbox, and sending demo reports to an address that may not exist is the same
# bounce risk this whole exercise is about.
PRIMARY = 'info@arthmatic.co.za'
SECOND = 'arthur@arthmatic.co.za'

# Rewritten: the seeded subdomain that cannot receive mail, plus the unverified support@ address
# an earlier run of this script wrote. Anything else is somebody's real choice and is left alone.
DEAD_DOMAIN = 'idc.shumelahire.co.za'
DEAD_ADDRESSES = {'support@arthmatic.co.za'}


def aws(*args):
    result = subprocess.run(['aws', *args, '--region', REGION], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'ERROR: {result.stderr.strip().splitlines()[-1] if result.stderr else "unknown"}',
              file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout) if result.stdout.strip() else {}


def main():
    print('Report schedule recipients')
    print(f'  Table:   {TABLE_NAME} ({REGION})')
    print(f'  Tenant:  TENANT#{TENANT_ID}')
    print(f'  Mode:    {"APPLY — will write" if APPLY else "DRY RUN — nothing will be written"}')
    print()

    items = aws('dynamodb', 'query',
                '--table-name', TABLE_NAME,
                '--key-condition-expression', 'PK = :p AND begins_with(SK, :s)',
                '--expression-attribute-values',
                json.dumps({':p': {'S': f'TENANT#{TENANT_ID}'}, ':s': {'S': 'REPORT_SCHEDULE#'}})
                ).get('Items', [])

    changed = skipped = 0
    for item in items:
        name = item.get('reportName', {}).get('S', '(unnamed)')
        current = [r['S'] for r in item.get('recipients', {}).get('L', [])]
        if not any(addr.endswith('@' + DEAD_DOMAIN) or addr.lower() in DEAD_ADDRESSES
                   for addr in current):
            print(f'  — {name:<34} left alone ({", ".join(current) or "no recipients"})')
            skipped += 1
            continue

        replacement = [PRIMARY] if len(current) < 2 else [PRIMARY, SECOND]
        print(f'  {"✓" if APPLY else "would change"} {name:<34} '
              f'{", ".join(current)}  →  {", ".join(replacement)}')

        if APPLY:
            aws('dynamodb', 'update-item',
                '--table-name', TABLE_NAME,
                '--key', json.dumps({'PK': item['PK'], 'SK': item['SK']}),
                '--update-expression', 'SET recipients = :r',
                '--expression-attribute-values',
                json.dumps({':r': {'L': [{'S': addr} for addr in replacement]}}))
        changed += 1

    print()
    print(f'  {changed} repointed, {skipped} left alone'
          if APPLY else f'  {changed} would be repointed, {skipped} left alone. Re-run with --apply.')


if __name__ == '__main__':
    main()
