#!/usr/bin/env python3
"""
Direct DynamoDB job postings seeder for the uThukela Water tenant.

Creates 6 realistic job postings (PUBLISHED) with corresponding job ads,
bypassing the API layer entirely. Each job gets a JOB_POSTING item and a
JOB_AD item with all required GSI keys so they appear in the UI immediately.

Prerequisites:
  - AWS CLI configured with credentials
  - Employees already seeded (run seed-employees-dynamodb.py first)

Usage:
  export AWS_REGION="af-south-1"           # optional, default af-south-1
  export TENANT_ID="97282820-uthukela"     # optional, default 97282820-uthukela
  export STACK_PREFIX="shumelahire-dev"    # optional, for table name resolution
  python3 scripts/seed-jobs-dynamodb.py
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')

_id_counter = 0

def new_id(unique_key=None):
    """Generate a deterministic UUID so re-runs produce the same IDs."""
    global _id_counter
    if unique_key is None:
        _id_counter += 1
        unique_key = f"jobs-{_id_counter}"
    seed = f"{TENANT_ID}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def date_str(dt):
    return dt.strftime('%Y-%m-%d')


def days_ago(n):
    return now - timedelta(days=n)


def slugify(title):
    return title.lower().replace(' - ', '-').replace(' ', '-').replace('&', 'and')


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


def check_aws_credentials():
    result = subprocess.run(
        ['aws', 'sts', 'get-caller-identity', '--region', REGION, '--output', 'json'],
        capture_output=True, text=True)
    if result.returncode != 0:
        print('ERROR: AWS credentials not configured.', file=sys.stderr)
        print('       Run "aws configure" or export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.', file=sys.stderr)
        print(f'       Detail: {result.stderr.strip()}', file=sys.stderr)
        sys.exit(1)
    try:
        identity = json.loads(result.stdout)
        print(f' AWS Account: {identity.get("Account", "unknown")}')
        print(f' IAM ARN:     {identity.get("Arn", "unknown")}')
    except json.JSONDecodeError:
        pass


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


def resolve_employees():
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'}, ':sk': {'S': 'EMPLOYEE#'}
         }),
         '--projection-expression', 'id,firstName,lastName',
         '--output', 'json'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'WARN: Employee query failed: {result.stderr.strip()}', file=sys.stderr)
        return {}
    try:
        items = json.loads(result.stdout).get('Items', [])
    except json.JSONDecodeError:
        return {}
    return {i.get('firstName', {}).get('S', ''): i['id']['S'] for i in items}


# ============================================================
# Job data — mirrors the 6 jobs from seed-uthukela-demo.sh
# ============================================================
JOBS = [
    {
        "title": "Water Process Controller",
        "department": "Water Services",
        "location": "Newcastle, KZN",
        "employmentType": "FULL_TIME",
        "experienceLevel": "MID",
        "description": (
            "uThukela Water seeks a qualified Water Process Controller to manage "
            "daily operations at our water treatment facilities, ensuring compliance "
            "with SANS 241 drinking water standards."
        ),
        "requirements": (
            "National Diploma in Water & Wastewater Treatment or equivalent; "
            "Valid Process Controller certificate (Class III minimum); "
            "3+ years experience in water treatment operations; "
            "Knowledge of SANS 241 standards; "
            "Experience with SCADA systems"
        ),
        "responsibilities": (
            "Monitor and control water treatment processes; "
            "Conduct routine water quality testing and sampling; "
            "Operate and maintain treatment plant equipment; "
            "Ensure compliance with Blue Drop and Green Drop standards; "
            "Maintain accurate operational records and reports"
        ),
        "qualifications": (
            "National Diploma in Water Care/Water & Wastewater Treatment; "
            "Process Controller Certificate Class III or higher; "
            "Valid driver's licence"
        ),
        "benefits": "Medical aid contribution; Pension fund; Housing allowance; 13th cheque",
        "salaryMin": "380000",
        "salaryMax": "520000",
        "daysAgo": 14,
        "featured": False,
        "urgent": False,
    },
    {
        "title": "Civil Engineer - Infrastructure",
        "department": "Technical Services",
        "location": "Newcastle, KZN",
        "employmentType": "FULL_TIME",
        "experienceLevel": "SENIOR",
        "description": (
            "Lead the design, planning, and project management of water and "
            "sanitation infrastructure projects across the uThukela District. "
            "This role involves overseeing bulk water supply schemes, pipeline "
            "construction, and reservoir upgrades."
        ),
        "requirements": (
            "BSc/BEng Civil Engineering; "
            "Professional registration with ECSA (Pr Eng); "
            "5+ years experience in water infrastructure; "
            "Experience with municipal capital projects and MIG funding; "
            "Proficiency in AutoCAD and project management tools"
        ),
        "responsibilities": (
            "Design and oversee water reticulation and bulk supply projects; "
            "Manage capital project budgets and contractor performance; "
            "Prepare technical reports for council and regulatory bodies; "
            "Ensure compliance with engineering standards and municipal bylaws; "
            "Coordinate with DWS on water use licences and dam safety"
        ),
        "qualifications": (
            "BSc or BEng in Civil Engineering; "
            "Professional registration with ECSA; "
            "Valid driver's licence"
        ),
        "benefits": "Medical aid; Pension fund; Cell phone allowance; Vehicle allowance; Performance bonus",
        "salaryMin": "750000",
        "salaryMax": "1050000",
        "daysAgo": 12,
        "featured": True,
        "urgent": False,
    },
    {
        "title": "Finance Manager",
        "department": "Finance",
        "location": "Newcastle, KZN",
        "employmentType": "FULL_TIME",
        "experienceLevel": "SENIOR",
        "description": (
            "Oversee the financial operations of uThukela Water including "
            "budgeting, financial reporting, revenue management, and audit "
            "compliance in accordance with MFMA requirements."
        ),
        "requirements": (
            "CA(SA) or CIMA qualification; "
            "5+ years in public sector finance; "
            "Knowledge of MFMA, GRAP, and municipal financial regulations; "
            "Experience with supply chain management processes; "
            "Advanced Excel and financial systems experience"
        ),
        "responsibilities": (
            "Prepare annual financial statements in accordance with GRAP; "
            "Manage budget preparation and monitoring processes; "
            "Oversee revenue collection and debt management; "
            "Coordinate internal and external audit processes; "
            "Ensure compliance with MFMA and National Treasury regulations"
        ),
        "qualifications": (
            "CA(SA), CIMA, or equivalent professional qualification; "
            "Understanding of MFMA and municipal finance"
        ),
        "benefits": "Medical aid; Pension fund; 13th cheque; Performance bonus; Cell phone allowance",
        "salaryMin": "850000",
        "salaryMax": "1200000",
        "daysAgo": 10,
        "featured": True,
        "urgent": False,
    },
    {
        "title": "Community Liaison Officer",
        "department": "Community Services",
        "location": "Ladysmith, KZN",
        "employmentType": "FULL_TIME",
        "experienceLevel": "ENTRY_LEVEL",
        "description": (
            "Engage with communities across the uThukela District to promote "
            "water conservation, manage service delivery queries, and facilitate "
            "public participation in water services planning."
        ),
        "requirements": (
            "Diploma in Public Administration, Communication, or Social Sciences; "
            "1-2 years community engagement experience; "
            "Fluency in isiZulu and English; "
            "Valid driver's licence; "
            "Knowledge of Batho Pele principles"
        ),
        "responsibilities": (
            "Conduct community meetings and awareness campaigns; "
            "Handle service delivery complaints and queries; "
            "Coordinate with ward councillors on water service issues; "
            "Promote water conservation and responsible usage; "
            "Compile community feedback reports for management"
        ),
        "qualifications": (
            "Diploma in relevant field; "
            "Fluency in isiZulu and English; "
            "Valid Code B driver's licence"
        ),
        "benefits": "Medical aid; Pension fund; Travel allowance",
        "salaryMin": "280000",
        "salaryMax": "380000",
        "daysAgo": 8,
        "featured": False,
        "urgent": False,
    },
    {
        "title": "ICT Systems Administrator",
        "department": "Corporate Services",
        "location": "Newcastle, KZN",
        "employmentType": "FULL_TIME",
        "experienceLevel": "MID",
        "description": (
            "Maintain and support uThukela Water's ICT infrastructure including "
            "network management, server administration, and end-user support "
            "across all offices and treatment facilities."
        ),
        "requirements": (
            "National Diploma in IT or Computer Science; "
            "3+ years systems administration experience; "
            "Microsoft/Linux server administration; "
            "Network infrastructure management (Cisco/Fortinet); "
            "ITIL Foundation certification preferred"
        ),
        "responsibilities": (
            "Manage and maintain server infrastructure and network systems; "
            "Provide technical support to all departments; "
            "Implement cybersecurity measures and backup procedures; "
            "Manage ICT procurement and asset register; "
            "Support SCADA and telemetry system connectivity"
        ),
        "qualifications": (
            "National Diploma in IT/Computer Science; "
            "Relevant vendor certifications (MCSA, CCNA)"
        ),
        "benefits": "Medical aid; Pension fund; 13th cheque; Cell phone allowance",
        "salaryMin": "420000",
        "salaryMax": "580000",
        "daysAgo": 6,
        "featured": False,
        "urgent": True,
    },
    {
        "title": "Operations Manager",
        "department": "Operations",
        "location": "Newcastle, KZN",
        "employmentType": "FULL_TIME",
        "experienceLevel": "EXECUTIVE",
        "description": (
            "Direct and oversee all operational activities of uThukela Water "
            "including water treatment, distribution, maintenance, and emergency "
            "response across the district."
        ),
        "requirements": (
            "BTech/BEng in Civil or Chemical Engineering; "
            "8+ years in water utility operations; "
            "Management experience in a municipal or water board setting; "
            "Knowledge of Water Services Act and NWA; "
            "Strong leadership and crisis management skills"
        ),
        "responsibilities": (
            "Direct daily operations across all water treatment works; "
            "Manage operational budgets and resource allocation; "
            "Ensure compliance with Blue Drop, Green Drop, and No Drop standards; "
            "Lead emergency response for water service disruptions; "
            "Report to executive management on operational performance metrics"
        ),
        "qualifications": (
            "BTech or BEng in relevant engineering discipline; "
            "Professional registration advantageous; "
            "Valid driver's licence"
        ),
        "benefits": "Medical aid; Pension fund; Vehicle allowance; Performance bonus; Cell phone allowance; 13th cheque",
        "salaryMin": "950000",
        "salaryMax": "1350000",
        "daysAgo": 18,
        "featured": True,
        "urgent": False,
    },
]


def seed_job_posting(job, creator_id, approver_id):
    """Create a JOB_POSTING item in DynamoDB."""
    posting_id = new_id()
    slug = slugify(job['title'])
    created = iso(days_ago(job['daysAgo']))
    published = iso(days_ago(job['daysAgo'] - 2))
    deadline = date_str(now + timedelta(days=60))

    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'JOB_POSTING#{posting_id}'},
        'GSI1PK': {'S': 'POSTING_STATUS#PUBLISHED'},
        'GSI1SK': {'S': f'JOB_POSTING#{created}'},
        'GSI2PK': {'S': f'POSTING_CREATOR#{creator_id}'},
        'GSI2SK': {'S': f'JOB_POSTING#{created}'},
        'GSI3PK': {'S': f'POSTING_DEPT#{job["department"]}'},
        'GSI3SK': {'S': f'JOB_POSTING#{created}'},
        'GSI4PK': {'S': f'POSTING_SLUG#{TENANT_ID}#{slug}'},
        'GSI4SK': {'S': f'JOB_POSTING#{posting_id}'},
        'GSI6PK': {'S': f'POSTING_CREATED#{TENANT_ID}'},
        'GSI6SK': {'S': f'JOB_POSTING#{created}'},
        'id':                  {'S': posting_id},
        'tenantId':            {'S': TENANT_ID},
        'title':               {'S': job['title']},
        'department':          {'S': job['department']},
        'location':            {'S': job['location']},
        'employmentType':      {'S': job['employmentType']},
        'experienceLevel':     {'S': job['experienceLevel']},
        'description':         {'S': job['description']},
        'requirements':        {'S': job['requirements']},
        'responsibilities':    {'S': job['responsibilities']},
        'qualifications':      {'S': job['qualifications']},
        'benefits':            {'S': job['benefits']},
        'salaryMin':           {'S': job['salaryMin']},
        'salaryMax':           {'S': job['salaryMax']},
        'salaryCurrency':      {'S': 'ZAR'},
        'remoteWorkAllowed':   {'BOOL': False},
        'travelRequired':      {'BOOL': job['department'] in ('Operations', 'Community Services', 'Technical Services')},
        'applicationDeadline': {'S': deadline},
        'positionsAvailable':  {'N': '1'},
        'status':              {'S': 'PUBLISHED'},
        'createdBy':           {'S': creator_id},
        'approvedBy':          {'S': approver_id},
        'publishedBy':         {'S': creator_id},
        'slug':                {'S': slug},
        'featured':            {'BOOL': job['featured']},
        'urgent':              {'BOOL': job['urgent']},
        'viewsCount':          {'N': '0'},
        'applicationsCount':   {'N': '0'},
        'createdAt':           {'S': created},
        'updatedAt':           {'S': published},
        'approvedAt':          {'S': iso(days_ago(job['daysAgo'] - 1))},
        'publishedAt':         {'S': published},
    }

    ok, err = put_item(item)
    return posting_id, slug, created, published, ok, err


def seed_job_ad(posting_id, job, slug, created, published, creator_id):
    """Create a JOB_AD item linked to the job posting."""
    ad_id = new_id()
    closing = date_str(now + timedelta(days=60))

    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'JOB_AD#{ad_id}'},
        'GSI1PK': {'S': f'JOBAD_STATUS#{TENANT_ID}#PUBLISHED'},
        'GSI1SK': {'S': f'JOB_AD#{published}'},
        'GSI2PK': {'S': f'JOBAD_POSTING#{posting_id}'},
        'GSI2SK': {'S': f'JOB_AD#{ad_id}'},
        'GSI4PK': {'S': f'JOBAD_SLUG#{TENANT_ID}#{slug}'},
        'GSI4SK': {'S': f'JOB_AD#{ad_id}'},
        'GSI6PK': {'S': f'JOBAD_CREATED#{TENANT_ID}'},
        'GSI6SK': {'S': f'JOB_AD#{published}'},
        'id':              {'S': ad_id},
        'tenantId':        {'S': TENANT_ID},
        'jobPostingId':    {'S': posting_id},
        'title':           {'S': job['title']},
        'status':          {'S': 'PUBLISHED'},
        'channelInternal': {'BOOL': True},
        'channelExternal': {'BOOL': True},
        'closingDate':     {'S': closing},
        'slug':            {'S': slug},
        'createdBy':       {'S': creator_id},
        'createdAt':       {'S': published},
        'updatedAt':       {'S': published},
        'department':      {'S': job['department']},
        'location':        {'S': job['location']},
        'employmentType':  {'S': job['employmentType']},
        'salaryRangeMin':  {'S': job['salaryMin']},
        'salaryRangeMax':  {'S': job['salaryMax']},
        'salaryCurrency':  {'S': 'ZAR'},
    }

    ok, err = put_item(item)
    return ok, err


def main():
    print('=' * 58)
    print(' uThukela Water — Job Postings Seeder (DynamoDB)')
    print('=' * 58)

    check_aws_credentials()
    resolve_table()

    print(f' Table:  {TABLE_NAME}')
    print(f' Tenant: {TENANT_ID}')
    print('=' * 58)
    print()

    # Resolve employee IDs for createdBy / approvedBy
    emp_ids = resolve_employees()
    if not emp_ids:
        print('WARN: No employees found — using placeholder IDs.', file=sys.stderr)
        print('      Run seed-employees-dynamodb.py first for best results.', file=sys.stderr)
        print()

    # Nomvula (HR Manager) creates, Sipho (Admin) approves
    creator_id = emp_ids.get('Nomvula', 'hr-manager-placeholder')
    approver_id = emp_ids.get('Sipho', 'admin-placeholder')

    print(f'Creator:  {creator_id} (Nomvula)')
    print(f'Approver: {approver_id} (Sipho)')
    print()

    postings_ok = 0
    ads_ok = 0

    for job in JOBS:
        posting_id, slug, created, published, p_ok, p_err = \
            seed_job_posting(job, creator_id, approver_id)

        a_ok, a_err = seed_job_ad(
            posting_id, job, slug, created, published, creator_id)

        p_icon = 'OK' if p_ok else 'FAIL'
        a_icon = 'OK' if a_ok else 'FAIL'
        if p_ok:
            postings_ok += 1
        if a_ok:
            ads_ok += 1

        print(f'  {p_icon}  JOB_POSTING  {job["title"]}')
        if p_err:
            print(f'       {p_err}', file=sys.stderr)
        print(f'  {a_icon}  JOB_AD       {job["title"]}')
        if a_err:
            print(f'       {a_err}', file=sys.stderr)
        print()

    print('=' * 58)
    print(f' Done: {postings_ok}/{len(JOBS)} postings, {ads_ok}/{len(JOBS)} ads')
    print('=' * 58)

    if postings_ok < len(JOBS):
        sys.exit(1)


if __name__ == '__main__':
    main()
