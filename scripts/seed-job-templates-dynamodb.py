#!/usr/bin/env python3
"""
Direct DynamoDB job ad template seeder for production.

Seeds the 5 IDC-relevant job ad templates that the dev-profile
DataSeederService creates, but writes directly to DynamoDB so it
works in any environment (dev, staging, prod).

Idempotent — uses condition-expression to skip items that already exist.

Prerequisites:
  - AWS CLI configured with credentials for the target account
  - DynamoDB table must exist

Usage:
  # Production (uThukela Water)
  export STACK_PREFIX="shumelahire-prod"
  export TENANT_ID="97282820-uthukela"
  export AWS_REGION="af-south-1"
  python3 scripts/seed-job-templates-dynamodb.py

  # Or with explicit table name:
  export DYNAMODB_TABLE_NAME="shumelahire-prod-data"
  python3 scripts/seed-job-templates-dynamodb.py
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)

_id_counter = 0


def new_id(unique_key=None):
    """Generate a deterministic UUID so re-runs produce the same IDs."""
    global _id_counter
    if unique_key is None:
        _id_counter += 1
        unique_key = f"job-template-{_id_counter}"
    seed = f"{TENANT_ID}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def put_item(item):
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--condition-expression', 'attribute_not_exists(PK)',
         '--item', json.dumps(item)],
        capture_output=True, text=True)
    if result.returncode != 0 and 'ConditionalCheckFailedException' not in result.stderr:
        return False, result.stderr.strip()
    if 'ConditionalCheckFailedException' in (result.stderr or ''):
        return True, 'SKIPPED (already exists)'
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
        print(f'  AWS Account: {identity.get("Account", "unknown")}')
        print(f'  IAM ARN:     {identity.get("Arn", "unknown")}')
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


def make_template_item(template_id, created_at, name, description, title,
                       intro, responsibilities, requirements, benefits,
                       location, employment_type, salary_min, salary_max,
                       contact_email):
    """Build a DynamoDB item dict matching the JobAdTemplateItem schema."""
    ts = iso(created_at)
    return {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'JOB_AD_TEMPLATE#{template_id}'},
        'GSI1PK': {'S': 'TEMPLATE_ARCHIVED#false'},
        'GSI1SK': {'S': f'JOB_AD_TEMPLATE#{ts}'},
        'GSI3PK': {'S': f'TEMPLATE_EMPTYPE#{employment_type}'},
        'GSI3SK': {'S': f'JOB_AD_TEMPLATE#{ts}'},
        'GSI6PK': {'S': f'TEMPLATE_CREATED#{TENANT_ID}'},
        'GSI6SK': {'S': f'JOB_AD_TEMPLATE#{ts}'},
        'id':               {'S': template_id},
        'tenantId':         {'S': TENANT_ID},
        'name':             {'S': name},
        'description':      {'S': description},
        'title':            {'S': title},
        'intro':            {'S': intro},
        'responsibilities': {'S': responsibilities},
        'requirements':     {'S': requirements},
        'benefits':         {'S': benefits},
        'location':         {'S': location},
        'employmentType':   {'S': employment_type},
        'salaryRangeMin':   {'S': str(salary_min)},
        'salaryRangeMax':   {'S': str(salary_max)},
        'contactEmail':     {'S': contact_email},
        'isArchived':       {'BOOL': False},
        'usageCount':       {'N': '0'},
        'createdBy':        {'S': 'system-seed'},
        'createdAt':        {'S': ts},
        'updatedAt':        {'S': ts},
    }


# ---------------------------------------------------------------------------
# Template definitions (matching DataSeederService.seedJobAdTemplates())
# ---------------------------------------------------------------------------

TEMPLATES = [
    # 1. Investment Analyst
    {
        'name': 'Investment Analyst',
        'description': 'Template for Investment Analyst roles in development finance and industrial funding divisions.',
        'title': '{{jobTitle}} — {{department}}',
        'intro': (
            '<p><strong>{{companyName}}</strong> is a leading development finance institution mandated to drive '
            'industrial capacity and economic growth across South Africa. We are seeking a skilled '
            '<strong>{{jobTitle}}</strong> to join our {{department}} team in {{location}}.</p>'
            '<p>This role offers the opportunity to evaluate high-impact investment opportunities, perform rigorous '
            'financial analysis, and contribute to strategic funding decisions that shape the country\'s industrial landscape.</p>'
        ),
        'responsibilities': (
            '<h3>Key Responsibilities</h3><ul>'
            '<li>Conduct financial due diligence and feasibility assessments for investment proposals</li>'
            '<li>Build and maintain financial models (DCF, LBO, comparable analysis) for project appraisals</li>'
            '<li>Prepare investment memoranda and present recommendations to the Investment Committee</li>'
            '<li>Monitor portfolio performance and covenant compliance of funded projects</li>'
            '<li>Perform sector research and identify emerging industrial development opportunities</li>'
            '<li>Collaborate with legal, risk, and credit teams throughout the deal lifecycle</li>'
            '<li>Support post-investment monitoring and restructuring activities where required</li>'
            '</ul>'
        ),
        'requirements': (
            '<h3>Requirements</h3><ul>'
            '<li>BCom (Hons) / BBusSci in Finance, Economics, or Accounting; CFA progress advantageous</li>'
            '<li>3\u20135 years\' experience in investment analysis, corporate finance, or development finance</li>'
            '<li>Advanced financial modelling skills in Excel; familiarity with Bloomberg or Capital IQ</li>'
            '<li>Strong understanding of project finance, credit risk assessment, and deal structuring</li>'
            '<li>Excellent written and verbal communication skills for committee-level presentations</li>'
            '<li>Knowledge of PFMA, Companies Act, and B-BBEE regulatory frameworks</li>'
            '</ul>'
        ),
        'benefits': (
            '<h3>What We Offer</h3><ul>'
            '<li>Competitive salary: {{salaryRange}}</li>'
            '<li>Performance-linked incentive bonus</li>'
            '<li>Employer-contributed pension and medical aid</li>'
            '<li>Study assistance and professional development funding (CFA, CA(SA))</li>'
            '<li>Hybrid working arrangement</li>'
            '<li>Meaningful work that drives industrialisation and job creation in South Africa</li>'
            '</ul>'
        ),
        'location': '{{location}}',
        'employment_type': 'Full-time',
        'salary_min': 550000,
        'salary_max': 850000,
        'contact_email': 'careers@company.co.za',
        'days_ago': 0,
    },
    # 2. ICT Business Analyst
    {
        'name': 'ICT Business Analyst',
        'description': 'Template for Business Analyst roles within IT and digital transformation divisions.',
        'title': '{{jobTitle}} — {{department}}',
        'intro': (
            '<p><strong>{{companyName}}</strong> is accelerating its digital transformation journey and is looking '
            'for a talented <strong>{{jobTitle}}</strong> to join the {{department}} team in {{location}}.</p>'
            '<p>You will bridge the gap between business stakeholders and technology delivery teams, translating '
            'organisational needs into well-defined requirements that power modern, user-centred solutions.</p>'
        ),
        'responsibilities': (
            '<h3>Key Responsibilities</h3><ul>'
            '<li>Elicit, analyse, and document business and functional requirements using interviews, workshops, and process mapping</li>'
            '<li>Produce user stories, acceptance criteria, and process flow diagrams for agile delivery squads</li>'
            '<li>Facilitate stakeholder workshops and UAT sessions, ensuring solutions meet business objectives</li>'
            '<li>Maintain a product backlog and prioritise features in collaboration with Product Owners</li>'
            '<li>Analyse existing systems and data flows to identify automation and optimisation opportunities</li>'
            '<li>Support change management, training material development, and post-go-live hypercare</li>'
            '</ul>'
        ),
        'requirements': (
            '<h3>Requirements</h3><ul>'
            '<li>Degree in Information Systems, Computer Science, or Business Management</li>'
            '<li>3+ years\' experience as a Business Analyst in an enterprise IT environment</li>'
            '<li>Proficiency with BPMN, UML, or similar modelling notations</li>'
            '<li>Experience with Agile/Scrum delivery and tools such as Jira or Azure DevOps</li>'
            '<li>Strong SQL skills for data analysis and reporting</li>'
            '<li>CBAP, CCBA, or IIBA certification advantageous</li>'
            '<li>Exposure to ERP systems (SAP, Oracle, Sage) is a plus</li>'
            '</ul>'
        ),
        'benefits': (
            '<h3>What We Offer</h3><ul>'
            '<li>Competitive salary: {{salaryRange}}</li>'
            '<li>Annual performance bonus</li>'
            '<li>Medical aid and retirement fund contributions</li>'
            '<li>Training budget for certifications and conferences</li>'
            '<li>Flexible / hybrid working model</li>'
            '<li>Exposure to enterprise-scale digital transformation programmes</li>'
            '</ul>'
        ),
        'location': '{{location}}',
        'employment_type': 'Full-time',
        'salary_min': 480000,
        'salary_max': 720000,
        'contact_email': 'careers@company.co.za',
        'days_ago': 1,
    },
    # 3. Legal Advisor — Corporate & Commercial
    {
        'name': 'Legal Advisor \u2014 Corporate & Commercial',
        'description': 'Template for in-house legal counsel roles covering corporate governance, commercial transactions, and regulatory compliance.',
        'title': '{{jobTitle}} — {{department}}',
        'intro': (
            '<p><strong>{{companyName}}</strong> invites applications from admitted attorneys for the position of '
            '<strong>{{jobTitle}}</strong> within our {{department}}. Based in {{location}}, this role provides '
            'strategic legal support across corporate transactions, funding agreements, and regulatory compliance.</p>'
        ),
        'responsibilities': (
            '<h3>Key Responsibilities</h3><ul>'
            '<li>Draft, review, and negotiate commercial contracts, funding agreements, and shareholder compacts</li>'
            '<li>Advise the Board and Executive Committee on corporate governance, fiduciary duties, and King IV compliance</li>'
            '<li>Manage litigation, disputes, and external counsel relationships</li>'
            '<li>Ensure compliance with the PFMA, Companies Act, POPIA, and sector-specific regulations</li>'
            '<li>Provide legal opinions on investment transactions and risk mitigation strategies</li>'
            '<li>Support B-BBEE verification, supply chain compliance, and procurement governance</li>'
            '</ul>'
        ),
        'requirements': (
            '<h3>Requirements</h3><ul>'
            '<li>LLB degree; admitted attorney of the High Court of South Africa</li>'
            '<li>5+ years\' post-admission experience in corporate/commercial law (in-house or private practice)</li>'
            '<li>Solid understanding of the PFMA, Treasury Regulations, and public entity governance</li>'
            '<li>Experience with project finance, investment agreements, or development finance transactions</li>'
            '<li>Strong drafting and negotiation skills</li>'
            '<li>LLM or postgraduate diploma in commercial law advantageous</li>'
            '</ul>'
        ),
        'benefits': (
            '<h3>What We Offer</h3><ul>'
            '<li>Competitive salary: {{salaryRange}}</li>'
            '<li>Performance bonus</li>'
            '<li>Medical aid subsidy and defined-contribution pension</li>'
            '<li>CPD-accredited in-house training programmes</li>'
            '<li>Opportunity to work on nationally significant transactions</li>'
            '<li>Supportive, collegial legal team environment</li>'
            '</ul>'
        ),
        'location': '{{location}}',
        'employment_type': 'Full-time',
        'salary_min': 700000,
        'salary_max': 1100000,
        'contact_email': 'careers@company.co.za',
        'days_ago': 2,
    },
    # 4. Project Manager — Infrastructure & Industrial
    {
        'name': 'Project Manager \u2014 Infrastructure & Industrial',
        'description': 'Template for Project Manager roles overseeing capital-intensive industrial and infrastructure development projects.',
        'title': '{{jobTitle}} — {{department}}',
        'intro': (
            '<p><strong>{{companyName}}</strong> is at the forefront of industrial development and infrastructure '
            'investment in South Africa. We are recruiting an experienced <strong>{{jobTitle}}</strong> to drive '
            'the delivery of funded projects within our {{department}}, based in {{location}}.</p>'
            '<p>This is a high-impact role for a results-driven professional who thrives on managing complex, '
            'multi-stakeholder projects from inception through to completion.</p>'
        ),
        'responsibilities': (
            '<h3>Key Responsibilities</h3><ul>'
            '<li>Lead end-to-end project delivery for industrial development and infrastructure programmes</li>'
            '<li>Develop and manage project plans, budgets, timelines, and risk registers</li>'
            '<li>Coordinate with engineers, contractors, government departments, and community stakeholders</li>'
            '<li>Report project status to the Executive Committee and funding partners using dashboards and milestone trackers</li>'
            '<li>Ensure compliance with environmental, safety, and regulatory requirements (EIA, OHS Act)</li>'
            '<li>Manage procurement processes in line with PFMA and SCM policy</li>'
            '<li>Drive post-implementation reviews and lessons-learned processes</li>'
            '</ul>'
        ),
        'requirements': (
            '<h3>Requirements</h3><ul>'
            '<li>Degree in Engineering, Construction Management, Project Management, or related field</li>'
            '<li>PMP, PRINCE2 Practitioner, or equivalent project management certification</li>'
            '<li>5\u20138 years\' experience managing capital projects (R50M+) in infrastructure, energy, or manufacturing</li>'
            '<li>Proficiency with MS Project, Primavera, or similar scheduling tools</li>'
            '<li>Strong stakeholder management and communication skills</li>'
            '<li>Valid driver\u2019s licence and willingness to travel to project sites nationally</li>'
            '</ul>'
        ),
        'benefits': (
            '<h3>What We Offer</h3><ul>'
            '<li>Competitive salary: {{salaryRange}}</li>'
            '<li>Performance-based incentive scheme</li>'
            '<li>Company vehicle or car allowance</li>'
            '<li>Medical aid and pension fund</li>'
            '<li>Professional body membership fees covered</li>'
            '<li>Opportunity to deliver transformative infrastructure across South Africa</li>'
            '</ul>'
        ),
        'location': '{{location}}',
        'employment_type': 'Full-time',
        'salary_min': 650000,
        'salary_max': 950000,
        'contact_email': 'careers@company.co.za',
        'days_ago': 3,
    },
    # 5. Graduate Trainee Programme
    {
        'name': 'Graduate Trainee Programme',
        'description': 'Template for structured graduate / internship programmes with rotational placements.',
        'title': '{{jobTitle}} — Graduate Trainee Programme',
        'intro': (
            '<p><strong>{{companyName}}</strong> is committed to developing the next generation of professionals '
            'who will drive South Africa\'s industrial and economic growth. Our <strong>Graduate Trainee Programme</strong> '
            'offers recent graduates a structured 24-month rotational programme across key business divisions in {{location}}.</p>'
            '<p>If you are a high-potential graduate eager to launch your career in development finance, project management, '
            'or corporate services, we want to hear from you.</p>'
        ),
        'responsibilities': (
            '<h3>What You\'ll Do</h3><ul>'
            '<li>Rotate through 3\u20134 business units (e.g. Investment Appraisal, Risk, Strategy, Corporate Affairs) over 24 months</li>'
            '<li>Work alongside experienced professionals on live projects and transactions</li>'
            '<li>Complete a structured learning curriculum including technical skills, leadership, and professional ethics</li>'
            '<li>Deliver a capstone research project aligned with the organisation\'s strategic priorities</li>'
            '<li>Participate in mentorship pairings, peer learning cohorts, and executive exposure sessions</li>'
            '<li>Receive ongoing feedback and formal performance reviews every six months</li>'
            '</ul>'
        ),
        'requirements': (
            '<h3>Requirements</h3><ul>'
            '<li>Completed degree (NQF 7+) in Finance, Economics, Engineering, Law, IT, or related field within the last 2 years</li>'
            '<li>South African citizen or permanent resident</li>'
            '<li>Strong academic record (minimum 65% aggregate or equivalent)</li>'
            '<li>No prior full-time professional work experience exceeding 12 months</li>'
            '<li>Excellent analytical thinking, communication, and teamwork skills</li>'
            '<li>Proficiency in MS Office (Excel, PowerPoint, Word)</li>'
            '<li>Willingness to relocate to {{location}} for the programme duration</li>'
            '</ul>'
        ),
        'benefits': (
            '<h3>What We Offer</h3><ul>'
            '<li>Competitive graduate stipend: {{salaryRange}}</li>'
            '<li>Medical aid contribution during the programme</li>'
            '<li>Study support for relevant professional qualifications</li>'
            '<li>Structured mentorship by senior leaders</li>'
            '<li>Possible permanent placement on successful completion</li>'
            '<li>Networking opportunities across government and private sector partners</li>'
            '</ul>'
        ),
        'location': '{{location}}',
        'employment_type': 'Fixed-term Contract',
        'salary_min': 240000,
        'salary_max': 320000,
        'contact_email': 'graduates@company.co.za',
        'days_ago': 4,
    },
]


def main():
    print('=' * 60)
    print('  Job Ad Templates Seeder (DynamoDB)')
    print('=' * 60)

    check_aws_credentials()
    resolve_table()

    print(f'  Table:  {TABLE_NAME}')
    print(f'  Tenant: {TENANT_ID}')
    print(f'  Region: {REGION}')
    print('=' * 60)
    print()

    if not TABLE_NAME:
        print('ERROR: Could not resolve DynamoDB table name.', file=sys.stderr)
        print('       Set DYNAMODB_TABLE_NAME or STACK_PREFIX.', file=sys.stderr)
        sys.exit(1)

    created = 0
    skipped = 0

    for t in TEMPLATES:
        template_id = new_id(f"job-template-{t['name']}")
        created_at = now - timedelta(days=t['days_ago'])

        item = make_template_item(
            template_id=template_id,
            created_at=created_at,
            name=t['name'],
            description=t['description'],
            title=t['title'],
            intro=t['intro'],
            responsibilities=t['responsibilities'],
            requirements=t['requirements'],
            benefits=t['benefits'],
            location=t['location'],
            employment_type=t['employment_type'],
            salary_min=t['salary_min'],
            salary_max=t['salary_max'],
            contact_email=t['contact_email'],
        )

        ok, msg = put_item(item)
        if 'SKIPPED' in msg:
            print(f'  SKIP  {t["name"]}  (already exists)')
            skipped += 1
        elif ok:
            print(f'  OK    {t["name"]}')
            created += 1
        else:
            print(f'  FAIL  {t["name"]}')
            print(f'        {msg}', file=sys.stderr)

    print()
    print(f'  Done: {created} created, {skipped} skipped, {len(TEMPLATES)} total')

    if created + skipped < len(TEMPLATES):
        sys.exit(1)


if __name__ == '__main__':
    main()
