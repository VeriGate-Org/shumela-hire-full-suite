#!/usr/bin/env python3
"""
Comprehensive DynamoDB seeder for dev environment — generic tech/services company.

Seeds ALL modules with realistic demo data for "Shumela Hire Dev" tenant:
  - Employees (10) with full profiles, encrypted PII
  - User records bridging Cognito → Employee
  - Departments (6)
  - Recruitment: job postings, applicants, applications, interviews, job ads
  - Leave: types, balances, requests
  - Performance: cycles, contracts, feedback
  - Training: courses, sessions, enrollments
  - Engagement: surveys, questions, responses, recognition, attrition risk
  - Documents: employee documents
  - Onboarding: templates, checklists
  - Shifts: definitions, schedules
  - Sage integration: config, schedules, logs

No uThukela/water-utility references — uses a generic tech/services company context.
"""
import json, os, sys, uuid, base64, subprocess, hashlib
from datetime import datetime, timezone, timedelta

# ============================================================
# Configuration
# ============================================================
TENANT_ID = os.environ.get('TENANT_ID', '')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')
STACK_PREFIX = os.environ.get('STACK_PREFIX', 'shumelahire-dev')

NOW = datetime.now(timezone.utc)
# Two timestamp formats needed by the DynamoDB Enhanced Client:
# - Instant fields: require 'Z' suffix (parsed by Instant.parse / ISO_INSTANT)
# - LocalDateTime fields: require NO 'Z' suffix (parsed by LocalDateTime.parse)
NOW_ISO = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')            # For Instant fields
NOW_ISO_LOCAL = NOW.strftime('%Y-%m-%dT%H:%M:%S')       # For LocalDateTime fields


# ============================================================
# Utilities
# ============================================================
def deterministic_id(tenant_id, entity_type, unique_key):
    """Generate a deterministic UUID from tenant + entity type + unique key."""
    seed = f"{tenant_id}:{entity_type}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def encrypt_pii(plaintext, key_bytes):
    """AES-256-GCM encryption matching DataEncryptionService.java."""
    if not plaintext or not key_bytes:
        return plaintext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = os.urandom(12)
    aesgcm = AESGCM(key_bytes)
    ct = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
    return base64.b64encode(iv + ct).decode('utf-8')


def resolve_table():
    global TABLE_NAME
    if TABLE_NAME:
        return
    result = subprocess.run(
        ['aws', 'cloudformation', 'describe-stacks',
         '--stack-name', f'{STACK_PREFIX}-serverless', '--region', REGION,
         '--query', 'Stacks[0].Outputs[?OutputKey==`DataTableName`].OutputValue',
         '--output', 'text'], capture_output=True, text=True)
    TABLE_NAME = result.stdout.strip()
    if not TABLE_NAME or TABLE_NAME == 'None':
        TABLE_NAME = f'{STACK_PREFIX}-data'


def get_encryption_key():
    secret_id = os.environ.get('ENCRYPTION_KEY_ARN', f'shumelahire/dev/encryption-key')
    result = subprocess.run(
        ['aws', 'secretsmanager', 'get-secret-value',
         '--secret-id', secret_id, '--region', REGION,
         '--query', 'SecretString', '--output', 'text'],
        capture_output=True, text=True)
    key_b64 = result.stdout.strip()
    if key_b64:
        return base64.b64decode(key_b64)
    return None


def put_item(item):
    """Write item to DynamoDB (overwrites if exists)."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--item', json.dumps(item)],
        capture_output=True, text=True)
    if result.returncode != 0:
        return False, result.stderr.strip()
    return True, ''


def date_offset(days):
    """Return ISO date string offset from today."""
    return (NOW + timedelta(days=days)).strftime('%Y-%m-%d')


def iso_offset(days=0, hours=0):
    """Return ISO datetime with Z suffix (for Instant fields)."""
    return (NOW + timedelta(days=days, hours=hours)).strftime('%Y-%m-%dT%H:%M:%SZ')


def iso_offset_local(days=0, hours=0):
    """Return ISO datetime without Z (for LocalDateTime fields)."""
    return (NOW + timedelta(days=days, hours=hours)).strftime('%Y-%m-%dT%H:%M:%S')


# ============================================================
# Employee Data — Generic Tech/Services Company
# ============================================================
EMPLOYEES = [
    {
        "employeeNumber": "SH-001", "firstName": "Arthur", "lastName": "Manena",
        "email": "admin@shumelahire.co.za", "title": "Mr",
        "hireDate": "2022-01-15", "dateOfBirth": "1990-05-20",
        "gender": "Male", "race": "African", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Single",
        "department": "Engineering", "division": "Platform Engineering",
        "jobTitle": "CTO & Co-Founder", "jobGrade": "E1",
        "employmentType": "PERMANENT", "costCentre": "ENG-001",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0001", "mobilePhone": "+27 82 100 0001",
        "personalEmail": "arthur.manena@gmail.com",
        "idNumber": "9005205123081", "taxNumber": "0123456789",
        "bankAccountNumber": "62145678901", "bankName": "First National Bank",
        "bankBranchCode": "250655",
        "physicalAddress": "42 Innovation Drive", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2196",
        "emergencyContactName": "Grace Manena",
        "emergencyContactPhone": "+27 82 987 6543",
        "emergencyContactRelationship": "Mother",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-002", "firstName": "Sarah", "lastName": "Johnson",
        "email": "hr.manager@shumelahire.co.za", "title": "Ms",
        "hireDate": "2022-03-01", "dateOfBirth": "1987-08-12",
        "gender": "Female", "race": "White", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Married",
        "department": "Human Resources", "division": "People Operations",
        "jobTitle": "Head of People", "jobGrade": "D1",
        "employmentType": "PERMANENT", "costCentre": "HR-001",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0002", "mobilePhone": "+27 83 200 0002",
        "personalEmail": "sarah.j@outlook.com",
        "idNumber": "8708120234082", "taxNumber": "0234567890",
        "bankAccountNumber": "62245678902", "bankName": "Standard Bank",
        "bankBranchCode": "051001",
        "physicalAddress": "15 Rosebank Road", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2196",
        "emergencyContactName": "Mark Johnson",
        "emergencyContactPhone": "+27 83 111 2222",
        "emergencyContactRelationship": "Spouse",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-003", "firstName": "David", "lastName": "Chen",
        "email": "hiring.manager@shumelahire.co.za", "title": "Mr",
        "hireDate": "2022-06-15", "dateOfBirth": "1985-03-28",
        "gender": "Male", "race": "Asian", "citizenshipStatus": "Permanent Resident",
        "nationality": "South African", "maritalStatus": "Married",
        "department": "Engineering", "division": "Backend Engineering",
        "jobTitle": "VP of Engineering", "jobGrade": "D2",
        "employmentType": "PERMANENT", "costCentre": "ENG-002",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0003", "mobilePhone": "+27 82 300 0003",
        "personalEmail": "david.chen@gmail.com",
        "idNumber": "8503285123083", "taxNumber": "0345678901",
        "bankAccountNumber": "62345678903", "bankName": "Nedbank",
        "bankBranchCode": "198765",
        "physicalAddress": "8 Sandton Drive", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2196",
        "emergencyContactName": "Lin Chen",
        "emergencyContactPhone": "+27 82 333 4444",
        "emergencyContactRelationship": "Spouse",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-004", "firstName": "Priya", "lastName": "Naidoo",
        "email": "recruiter@shumelahire.co.za", "title": "Ms",
        "hireDate": "2023-01-10", "dateOfBirth": "1992-11-05",
        "gender": "Female", "race": "Indian", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Single",
        "department": "Human Resources", "division": "Talent Acquisition",
        "jobTitle": "Senior Recruiter", "jobGrade": "C2",
        "employmentType": "PERMANENT", "costCentre": "HR-002",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0004", "mobilePhone": "+27 84 400 0004",
        "personalEmail": "priya.n@gmail.com",
        "idNumber": "9211050234084", "taxNumber": "0456789012",
        "bankAccountNumber": "62445678904", "bankName": "ABSA",
        "bankBranchCode": "632005",
        "physicalAddress": "22 Rivonia Road", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2128",
        "emergencyContactName": "Raj Naidoo",
        "emergencyContactPhone": "+27 84 555 6666",
        "emergencyContactRelationship": "Father",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-005", "firstName": "James", "lastName": "Wilson",
        "email": "interviewer@shumelahire.co.za", "title": "Mr",
        "hireDate": "2022-09-01", "dateOfBirth": "1988-07-14",
        "gender": "Male", "race": "White", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Single",
        "department": "Engineering", "division": "Frontend Engineering",
        "jobTitle": "Senior Software Engineer", "jobGrade": "C3",
        "employmentType": "PERMANENT", "costCentre": "ENG-003",
        "location": "Cape Town Office", "site": "Cape Town",
        "phone": "+27 21 555 0005", "mobilePhone": "+27 82 500 0005",
        "personalEmail": "james.w@gmail.com",
        "idNumber": "8807145123085", "taxNumber": "0567890123",
        "bankAccountNumber": "62545678905", "bankName": "Capitec",
        "bankBranchCode": "470010",
        "physicalAddress": "5 Long Street", "city": "Cape Town",
        "province": "Western Cape", "postalCode": "8001",
        "emergencyContactName": "Helen Wilson",
        "emergencyContactPhone": "+27 82 777 8888",
        "emergencyContactRelationship": "Mother",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-006", "firstName": "Lisa", "lastName": "Mokoena",
        "email": "employee@shumelahire.co.za", "title": "Ms",
        "hireDate": "2023-04-01", "dateOfBirth": "1995-01-22",
        "gender": "Female", "race": "African", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Single",
        "department": "Product", "division": "Product Design",
        "jobTitle": "UX Designer", "jobGrade": "C1",
        "employmentType": "PERMANENT", "costCentre": "PRD-001",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0006", "mobilePhone": "+27 83 600 0006",
        "personalEmail": "lisa.m@outlook.com",
        "idNumber": "9501220234086", "taxNumber": "0678901234",
        "bankAccountNumber": "62645678906", "bankName": "First National Bank",
        "bankBranchCode": "250655",
        "physicalAddress": "12 Melville Road", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2092",
        "emergencyContactName": "Thandi Mokoena",
        "emergencyContactPhone": "+27 83 999 0000",
        "emergencyContactRelationship": "Sister",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-007", "firstName": "Michael", "lastName": "Botha",
        "email": "executive@shumelahire.co.za", "title": "Mr",
        "hireDate": "2022-01-15", "dateOfBirth": "1978-09-03",
        "gender": "Male", "race": "White", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Married",
        "department": "Operations", "division": "Business Operations",
        "jobTitle": "COO", "jobGrade": "E1",
        "employmentType": "PERMANENT", "costCentre": "OPS-001",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0007", "mobilePhone": "+27 82 700 0007",
        "personalEmail": "michael.b@gmail.com",
        "idNumber": "7809035123087", "taxNumber": "0789012345",
        "bankAccountNumber": "62745678907", "bankName": "Standard Bank",
        "bankBranchCode": "051001",
        "physicalAddress": "30 Hyde Park Lane", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2196",
        "emergencyContactName": "Karen Botha",
        "emergencyContactPhone": "+27 82 111 3333",
        "emergencyContactRelationship": "Spouse",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-008", "firstName": "Thandi", "lastName": "Molefe",
        "email": "applicant@shumelahire.co.za", "title": "Ms",
        "hireDate": "2024-02-01", "dateOfBirth": "1996-06-18",
        "gender": "Female", "race": "African", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Single",
        "department": "Sales & Marketing", "division": "Marketing",
        "jobTitle": "Marketing Coordinator", "jobGrade": "B2",
        "employmentType": "PERMANENT", "costCentre": "MKT-001",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0008", "mobilePhone": "+27 84 800 0008",
        "personalEmail": "thandi.molefe@gmail.com",
        "idNumber": "9606180234088", "taxNumber": "0890123456",
        "bankAccountNumber": "62845678908", "bankName": "ABSA",
        "bankBranchCode": "632005",
        "physicalAddress": "7 Braamfontein Road", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2001",
        "emergencyContactName": "Nomsa Molefe",
        "emergencyContactPhone": "+27 84 444 5555",
        "emergencyContactRelationship": "Mother",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-009", "firstName": "Ravi", "lastName": "Pillay",
        "email": "ravi.pillay@shumelahire.co.za", "title": "Mr",
        "hireDate": "2023-07-15", "dateOfBirth": "1991-04-09",
        "gender": "Male", "race": "Indian", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Married",
        "department": "Finance", "division": "Financial Planning",
        "jobTitle": "Financial Controller", "jobGrade": "D1",
        "employmentType": "PERMANENT", "costCentre": "FIN-001",
        "location": "Johannesburg HQ", "site": "Johannesburg",
        "phone": "+27 11 555 0009", "mobilePhone": "+27 82 900 0009",
        "personalEmail": "ravi.p@outlook.com",
        "idNumber": "9104095123089", "taxNumber": "0901234567",
        "bankAccountNumber": "62945678909", "bankName": "Capitec",
        "bankBranchCode": "470010",
        "physicalAddress": "18 Pretoria Road", "city": "Johannesburg",
        "province": "Gauteng", "postalCode": "2196",
        "emergencyContactName": "Sunita Pillay",
        "emergencyContactPhone": "+27 82 666 7777",
        "emergencyContactRelationship": "Spouse",
        "demographicsConsent": True, "status": "ACTIVE",
    },
    {
        "employeeNumber": "SH-010", "firstName": "Naledi", "lastName": "Kgosi",
        "email": "naledi.kgosi@shumelahire.co.za", "title": "Ms",
        "hireDate": "2024-01-08", "dateOfBirth": "1994-12-30",
        "gender": "Female", "race": "African", "citizenshipStatus": "South African",
        "nationality": "South African", "maritalStatus": "Single",
        "department": "Operations", "division": "Customer Success",
        "jobTitle": "Customer Success Manager", "jobGrade": "C2",
        "employmentType": "PERMANENT", "costCentre": "OPS-002",
        "location": "Cape Town Office", "site": "Cape Town",
        "phone": "+27 21 555 0010", "mobilePhone": "+27 83 100 0010",
        "personalEmail": "naledi.k@gmail.com",
        "idNumber": "9412300234090", "taxNumber": "1012345678",
        "bankAccountNumber": "63045678910", "bankName": "Nedbank",
        "bankBranchCode": "198765",
        "physicalAddress": "3 Kloof Street", "city": "Cape Town",
        "province": "Western Cape", "postalCode": "8001",
        "emergencyContactName": "Mpho Kgosi",
        "emergencyContactPhone": "+27 83 888 9999",
        "emergencyContactRelationship": "Brother",
        "demographicsConsent": True, "status": "ACTIVE",
    },
]

# User records mapping Cognito → Employee
USERS = [
    {"email": "admin@shumelahire.co.za", "firstName": "Arthur", "lastName": "Manena",
     "role": "ADMIN", "jobTitle": "CTO & Co-Founder", "department": "Engineering", "location": "Johannesburg HQ"},
    {"email": "hr.manager@shumelahire.co.za", "firstName": "Sarah", "lastName": "Johnson",
     "role": "HR_MANAGER", "jobTitle": "Head of People", "department": "Human Resources", "location": "Johannesburg HQ"},
    {"email": "hiring.manager@shumelahire.co.za", "firstName": "David", "lastName": "Chen",
     "role": "HIRING_MANAGER", "jobTitle": "VP of Engineering", "department": "Engineering", "location": "Johannesburg HQ"},
    {"email": "recruiter@shumelahire.co.za", "firstName": "Priya", "lastName": "Naidoo",
     "role": "RECRUITER", "jobTitle": "Senior Recruiter", "department": "Human Resources", "location": "Johannesburg HQ"},
    {"email": "interviewer@shumelahire.co.za", "firstName": "James", "lastName": "Wilson",
     "role": "INTERVIEWER", "jobTitle": "Senior Software Engineer", "department": "Engineering", "location": "Cape Town Office"},
    {"email": "employee@shumelahire.co.za", "firstName": "Lisa", "lastName": "Mokoena",
     "role": "EMPLOYEE", "jobTitle": "UX Designer", "department": "Product", "location": "Johannesburg HQ"},
    {"email": "executive@shumelahire.co.za", "firstName": "Michael", "lastName": "Botha",
     "role": "EXECUTIVE", "jobTitle": "COO", "department": "Operations", "location": "Johannesburg HQ"},
    {"email": "applicant@shumelahire.co.za", "firstName": "Thandi", "lastName": "Molefe",
     "role": "APPLICANT", "jobTitle": "Marketing Coordinator", "department": "Sales & Marketing", "location": "Johannesburg HQ"},
]

# ============================================================
# Builder Functions
# ============================================================
def build_employee_item(emp, key_bytes):
    eid = deterministic_id(TENANT_ID, 'EMPLOYEE', emp['employeeNumber'])
    status = emp.get('status', 'ACTIVE')
    mgr_id = emp.get('reportingManagerId', 'NONE')
    if emp.get('reportingManagerNumber'):
        mgr_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp['reportingManagerNumber'])

    item = {
        'PK':    {'S': f'TENANT#{TENANT_ID}'},
        'SK':    {'S': f'EMPLOYEE#{eid}'},
        'GSI1PK': {'S': f'EMP_STATUS#{TENANT_ID}#{status}'},
        'GSI1SK': {'S': f'EMPLOYEE#{emp["lastName"]}#{emp["firstName"]}'},
        'GSI2PK': {'S': f'EMP_EMAIL#{TENANT_ID}#{emp["email"]}'},
        'GSI2SK': {'S': f'EMPLOYEE#{eid}'},
        'GSI3PK': {'S': f'EMP_DEPT#{TENANT_ID}#{emp["department"]}'},
        'GSI3SK': {'S': f'EMPLOYEE#{emp["lastName"]}#{emp["firstName"]}'},
        'GSI4PK': {'S': f'EMP_NUM#{TENANT_ID}#{emp["employeeNumber"]}'},
        'GSI4SK': {'S': f'EMPLOYEE#{eid}'},
        'GSI5PK': {'S': f'EMP_MGR#{TENANT_ID}#{mgr_id}'},
        'GSI5SK': {'S': f'EMPLOYEE#{emp["lastName"]}#{emp["firstName"]}'},
        'GSI6PK': {'S': f'EMP_HIRE#{TENANT_ID}'},
        'GSI6SK': {'S': f'{emp["hireDate"]}#{eid}'},
        'id':              {'S': eid},
        'tenantId':        {'S': TENANT_ID},
        'employeeNumber':  {'S': emp['employeeNumber']},
        'title':           {'S': emp.get('title', '')},
        'firstName':       {'S': emp['firstName']},
        'lastName':        {'S': emp['lastName']},
        'email':           {'S': emp['email']},
        'phone':           {'S': emp.get('phone', '')},
        'physicalAddress': {'S': emp.get('physicalAddress', '')},
        'postalAddress':   {'S': emp.get('postalAddress', '')},
        'city':            {'S': emp.get('city', '')},
        'province':        {'S': emp.get('province', '')},
        'postalCode':      {'S': emp.get('postalCode', '')},
        'country':         {'S': emp.get('country', 'South Africa')},
        'status':          {'S': status},
        'department':      {'S': emp.get('department', '')},
        'division':        {'S': emp.get('division', '')},
        'jobTitle':        {'S': emp.get('jobTitle', '')},
        'jobGrade':        {'S': emp.get('jobGrade', '')},
        'employmentType':  {'S': emp.get('employmentType', 'PERMANENT')},
        'hireDate':        {'S': emp['hireDate']},
        'costCentre':      {'S': emp.get('costCentre', '')},
        'location':        {'S': emp.get('location', '')},
        'site':            {'S': emp.get('site', '')},
        'bankName':        {'S': emp.get('bankName', '')},
        'bankBranchCode':  {'S': emp.get('bankBranchCode', '')},
        'gender':          {'S': emp.get('gender', '')},
        'race':            {'S': emp.get('race', '')},
        'citizenshipStatus': {'S': emp.get('citizenshipStatus', '')},
        'nationality':     {'S': emp.get('nationality', '')},
        'maritalStatus':   {'S': emp.get('maritalStatus', '')},
        'emergencyContactName':         {'S': emp.get('emergencyContactName', '')},
        'emergencyContactPhone':        {'S': emp.get('emergencyContactPhone', '')},
        'emergencyContactRelationship': {'S': emp.get('emergencyContactRelationship', '')},
        'createdAt':       {'S': NOW_ISO},
        'updatedAt':       {'S': NOW_ISO},
    }
    if emp.get('dateOfBirth'):
        item['dateOfBirth'] = {'S': emp['dateOfBirth']}
    if emp.get('demographicsConsent'):
        item['demographicsConsent'] = {'BOOL': True}
        item['demographicsConsentDate'] = {'S': NOW_ISO}
    if mgr_id != 'NONE':
        item['reportingManagerId'] = {'S': mgr_id}

    # Encrypted PII
    for field in ['personalEmail', 'mobilePhone', 'idNumber', 'taxNumber', 'bankAccountNumber']:
        val = emp.get(field)
        if val and key_bytes:
            item[field] = {'S': encrypt_pii(val, key_bytes)}

    return eid, item


def build_user_item(u):
    uid = deterministic_id(TENANT_ID, 'USER', u['email'])
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'USER#{uid}'},
        'GSI1PK': {'S': f'USER_ROLE#{u["role"]}'},
        'GSI1SK': {'S': f'USER#{NOW_ISO}'},
        'GSI4PK': {'S': f'USER_USERNAME#{u["email"]}'},
        'GSI4SK': {'S': f'USER#{uid}'},
        'GSI5PK': {'S': f'USER_EMAIL#{u["email"]}'},
        'GSI5SK': {'S': f'USER#{uid}'},
        'GSI6PK': {'S': f'USER_CREATED#{TENANT_ID}'},
        'GSI6SK': {'S': f'USER#{NOW_ISO}'},
        'id':                    {'S': uid},
        'tenantId':              {'S': TENANT_ID},
        'username':              {'S': u['email']},
        'email':                 {'S': u['email']},
        'firstName':             {'S': u['firstName']},
        'lastName':              {'S': u['lastName']},
        'role':                  {'S': u['role']},
        'enabled':               {'BOOL': True},
        'accountNonExpired':     {'BOOL': True},
        'accountNonLocked':      {'BOOL': True},
        'credentialsNonExpired': {'BOOL': True},
        'emailVerified':         {'BOOL': True},
        'jobTitle':              {'S': u['jobTitle']},
        'department':            {'S': u['department']},
        'location':              {'S': u['location']},
        'createdAt':             {'S': NOW_ISO},
        'updatedAt':             {'S': NOW_ISO},
    }
    return uid, item


# ============================================================
# Leave Module
# ============================================================
LEAVE_TYPES = [
    {"name": "Annual Leave", "code": "AL", "description": "Paid annual vacation leave",
     "category": "ANNUAL", "defaultDays": "15", "maxCarryForward": "5",
     "requiresMedCert": False, "medCertThreshold": 0, "isPaid": True,
     "allowEncashment": True, "encashmentRate": "100", "colorCode": "#3B82F6"},
    {"name": "Sick Leave", "code": "SL", "description": "Paid sick leave per BCEA cycle",
     "category": "SICK", "defaultDays": "30", "maxCarryForward": "0",
     "requiresMedCert": True, "medCertThreshold": 2, "isPaid": True,
     "allowEncashment": False, "colorCode": "#EF4444"},
    {"name": "Family Responsibility Leave", "code": "FRL",
     "description": "Leave for family emergencies (birth, death, illness)",
     "category": "FAMILY", "defaultDays": "3", "maxCarryForward": "0",
     "requiresMedCert": False, "medCertThreshold": 0, "isPaid": True,
     "allowEncashment": False, "colorCode": "#8B5CF6"},
    {"name": "Study Leave", "code": "STL", "description": "Leave for examinations and study",
     "category": "STUDY", "defaultDays": "5", "maxCarryForward": "0",
     "requiresMedCert": False, "medCertThreshold": 0, "isPaid": True,
     "allowEncashment": False, "colorCode": "#F59E0B"},
    {"name": "Maternity Leave", "code": "ML", "description": "Maternity leave per BCEA (4 months)",
     "category": "MATERNITY", "defaultDays": "120", "maxCarryForward": "0",
     "requiresMedCert": True, "medCertThreshold": 0, "isPaid": True,
     "allowEncashment": False, "colorCode": "#EC4899"},
    {"name": "Paternity Leave", "code": "PL", "description": "Paternity leave (10 consecutive days)",
     "category": "PATERNITY", "defaultDays": "10", "maxCarryForward": "0",
     "requiresMedCert": False, "medCertThreshold": 0, "isPaid": True,
     "allowEncashment": False, "colorCode": "#06B6D4"},
    {"name": "Unpaid Leave", "code": "UL", "description": "Unpaid leave by arrangement",
     "category": "UNPAID", "defaultDays": "0", "maxCarryForward": "0",
     "requiresMedCert": False, "medCertThreshold": 0, "isPaid": False,
     "allowEncashment": False, "colorCode": "#6B7280"},
]


def build_leave_type_items():
    items = []
    for lt in LEAVE_TYPES:
        lid = deterministic_id(TENANT_ID, 'LEAVE_TYPE', lt['code'])
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'LEAVE_TYPE#{lid}'},
            'GSI1PK': {'S': f'LT_CODE#{TENANT_ID}'},
            'GSI1SK': {'S': lt['code']},
            'id':                          {'S': lid},
            'tenantId':                    {'S': TENANT_ID},
            'name':                        {'S': lt['name']},
            'code':                        {'S': lt['code']},
            'description':                 {'S': lt['description']},
            'category':                    {'S': lt['category']},
            'defaultDaysPerYear':          {'S': lt['defaultDays']},
            'maxCarryForwardDays':         {'S': lt['maxCarryForward']},
            'requiresMedicalCertificate':  {'BOOL': lt['requiresMedCert']},
            'medicalCertThresholdDays':    {'N': str(lt['medCertThreshold'])},
            'isPaid':                      {'BOOL': lt['isPaid']},
            'allowEncashment':             {'BOOL': lt['allowEncashment']},
            'colorCode':                   {'S': lt['colorCode']},
            'isActive':                    {'BOOL': True},
            'createdAt':                   {'S': NOW_ISO},
            'updatedAt':                   {'S': NOW_ISO},
        }
        if lt.get('encashmentRate'):
            item['encashmentRate'] = {'S': lt['encashmentRate']}
        items.append(('LEAVE_TYPE', lt['name'], item))
    return items


def build_leave_balance_items():
    items = []
    # Give first 3 leave types (AL, SL, FRL) balances for all employees
    for emp in EMPLOYEES:
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp['employeeNumber'])
        for lt in LEAVE_TYPES[:3]:
            lt_id = deterministic_id(TENANT_ID, 'LEAVE_TYPE', lt['code'])
            bal_id = deterministic_id(TENANT_ID, 'LEAVE_BAL', f"{emp['employeeNumber']}:{lt['code']}")
            taken = "3" if lt['code'] == 'AL' else ("1" if lt['code'] == 'SL' else "0")
            item = {
                'PK':     {'S': f'TENANT#{TENANT_ID}'},
                'SK':     {'S': f'LEAVE_BAL#{bal_id}'},
                'GSI1PK': {'S': f'LB_EMP#{TENANT_ID}#{emp_id}'},
                'GSI1SK': {'S': f'LEAVE_BAL#2026#{lt_id}'},
                'id':                {'S': bal_id},
                'tenantId':          {'S': TENANT_ID},
                'employeeId':        {'S': emp_id},
                'leaveTypeId':       {'S': lt_id},
                'cycleYear':         {'N': '2026'},
                'entitledDays':      {'S': lt['defaultDays']},
                'takenDays':         {'S': taken},
                'pendingDays':       {'S': '0'},
                'carriedForwardDays': {'S': '2' if lt['code'] == 'AL' else '0'},
                'adjustmentDays':    {'S': '0'},
                'encashedDays':      {'S': '0'},
                'createdAt':         {'S': NOW_ISO},
                'updatedAt':         {'S': NOW_ISO},
            }
            items.append(('LEAVE_BAL', f"{emp['firstName']} {lt['code']}", item))
    return items


def build_leave_request_items():
    items = []
    al_id = deterministic_id(TENANT_ID, 'LEAVE_TYPE', 'AL')
    sl_id = deterministic_id(TENANT_ID, 'LEAVE_TYPE', 'SL')
    hr_emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-002')

    requests = [
        {"empNum": "SH-005", "leaveType": al_id, "start": date_offset(14), "end": date_offset(18),
         "days": "5", "status": "APPROVED", "reason": "Family holiday", "approver": hr_emp_id},
        {"empNum": "SH-006", "leaveType": al_id, "start": date_offset(30), "end": date_offset(32),
         "days": "3", "status": "PENDING", "reason": "Personal time off"},
        {"empNum": "SH-008", "leaveType": sl_id, "start": date_offset(-5), "end": date_offset(-4),
         "days": "2", "status": "APPROVED", "reason": "Flu", "approver": hr_emp_id},
        {"empNum": "SH-004", "leaveType": al_id, "start": date_offset(45), "end": date_offset(49),
         "days": "5", "status": "REJECTED", "reason": "Vacation", "rejectionReason": "Team capacity constraints"},
    ]

    for i, req in enumerate(requests):
        req_id = deterministic_id(TENANT_ID, 'LEAVE_REQ', f"req-{i}")
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', req['empNum'])
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'LEAVE_REQ#{req_id}'},
            'GSI1PK': {'S': f'LR_EMP#{TENANT_ID}#{emp_id}'},
            'GSI1SK': {'S': f'LEAVE_REQ#{req_id}'},
            'id':           {'S': req_id},
            'tenantId':     {'S': TENANT_ID},
            'employeeId':   {'S': emp_id},
            'leaveTypeId':  {'S': req['leaveType']},
            'startDate':    {'S': req['start']},
            'endDate':      {'S': req['end']},
            'totalDays':    {'S': req['days']},
            'status':       {'S': req['status']},
            'reason':       {'S': req['reason']},
            'isHalfDay':    {'BOOL': False},
            'createdAt':    {'S': NOW_ISO},
            'updatedAt':    {'S': NOW_ISO},
        }
        if req.get('approver'):
            item['approverId'] = {'S': req['approver']}
            item['approvedAt'] = {'S': NOW_ISO}
        if req.get('rejectionReason'):
            item['rejectionReason'] = {'S': req['rejectionReason']}
        items.append(('LEAVE_REQ', f"Request {i+1}", item))
    return items


# ============================================================
# Recruitment Module
# ============================================================
JOB_POSTINGS = [
    {"title": "Senior Backend Engineer", "department": "Engineering", "location": "Johannesburg, GP",
     "employmentType": "FULL_TIME", "experienceLevel": "SENIOR", "salaryMin": "750000", "salaryMax": "1100000",
     "description": "Build scalable microservices for our HR platform. You'll work with Java, Spring Boot, and AWS to deliver high-availability systems serving thousands of users.",
     "requirements": "5+ years Java/Spring Boot experience;AWS services (Lambda, DynamoDB, SQS);Microservices architecture;CI/CD pipelines;REST API design",
     "responsibilities": "Design and implement backend services;Code review and mentoring;Performance optimization;On-call rotation;Technical documentation",
     "qualifications": "BSc Computer Science or equivalent;AWS certification preferred;Strong problem-solving skills",
     "benefits": "Medical aid;Provident fund;Remote work flexibility;Learning budget R30k/year;Stock options"},
    {"title": "Product Manager", "department": "Product", "location": "Johannesburg, GP",
     "employmentType": "FULL_TIME", "experienceLevel": "MID", "salaryMin": "650000", "salaryMax": "900000",
     "description": "Own the product roadmap for our core HR management modules. Drive discovery, prioritisation, and delivery working closely with engineering and design.",
     "requirements": "3+ years product management in SaaS;Experience with B2B enterprise software;Data-driven decision making;Stakeholder management;Agile/Scrum experience",
     "responsibilities": "Define product strategy and roadmap;Conduct user research and discovery;Write PRDs and user stories;Prioritize backlog with engineering;Analyze product metrics",
     "qualifications": "Degree in Business, CS, or related field;Product management certification advantageous",
     "benefits": "Medical aid;Provident fund;Flexible hours;Annual team retreats;Learning budget"},
    {"title": "Sales Development Representative", "department": "Sales & Marketing", "location": "Johannesburg, GP",
     "employmentType": "FULL_TIME", "experienceLevel": "ENTRY_LEVEL", "salaryMin": "300000", "salaryMax": "420000",
     "description": "Drive pipeline growth by identifying and qualifying leads for our enterprise HR platform. Perfect for ambitious self-starters ready to build a career in SaaS sales.",
     "requirements": "1+ year B2B sales or business development;CRM experience (HubSpot preferred);Excellent communication skills;Self-motivated;Understanding of HR industry a plus",
     "responsibilities": "Prospect and qualify inbound leads;Cold outreach via email and LinkedIn;Book demos for Account Executives;Maintain CRM data hygiene;Hit monthly meeting targets",
     "qualifications": "Diploma or degree in Business/Marketing;Sales training certification advantageous",
     "benefits": "Base + commission (OTE R500k);Medical aid;Provident fund;Sales incentive trips"},
    {"title": "DevOps Engineer", "department": "Engineering", "location": "Cape Town, WC",
     "employmentType": "FULL_TIME", "experienceLevel": "MID", "salaryMin": "600000", "salaryMax": "850000",
     "description": "Build and maintain our cloud infrastructure on AWS. Automate deployments, improve observability, and ensure 99.9% uptime for our multi-tenant HR platform.",
     "requirements": "3+ years DevOps/SRE experience;AWS (CDK, CloudFormation, ECS, Lambda);Docker and container orchestration;CI/CD (GitHub Actions);Infrastructure as Code",
     "responsibilities": "Manage AWS infrastructure via CDK;Implement monitoring and alerting;Automate deployment pipelines;Incident response and post-mortems;Cost optimization",
     "qualifications": "BSc in CS/IT or equivalent experience;AWS Solutions Architect certification preferred",
     "benefits": "Medical aid;Provident fund;Remote-first;Home office budget;Learning budget"},
    {"title": "Head of Customer Success", "department": "Operations", "location": "Johannesburg, GP",
     "employmentType": "FULL_TIME", "experienceLevel": "SENIOR", "salaryMin": "800000", "salaryMax": "1100000",
     "description": "Lead our customer success function, ensuring enterprise clients achieve maximum value from the platform. Build and scale the CS team as we grow.",
     "requirements": "5+ years customer success leadership in B2B SaaS;Experience managing enterprise accounts;Team building and coaching;Churn reduction strategies;Strong commercial acumen",
     "responsibilities": "Build and lead the CS team;Develop customer health scoring;Drive net revenue retention;Executive relationship management;Voice of customer to product",
     "qualifications": "Degree in Business or related field;Customer success certification (e.g., CSM) preferred",
     "benefits": "Medical aid;Provident fund;Performance bonus;Stock options;Executive coaching budget"},
    {"title": "Junior Frontend Developer", "department": "Engineering", "location": "Remote (SA)",
     "employmentType": "FULL_TIME", "experienceLevel": "ENTRY_LEVEL", "salaryMin": "350000", "salaryMax": "480000",
     "description": "Join our frontend team building modern React interfaces for our HR platform. Great opportunity for graduates or early-career developers passionate about UI/UX.",
     "requirements": "1+ year React/TypeScript experience;HTML/CSS proficiency;Git version control;Eagerness to learn;Portfolio or side projects demonstrating skills",
     "responsibilities": "Build UI components in React;Implement designs from Figma;Write unit tests;Participate in code reviews;Collaborate with designers",
     "qualifications": "BSc/Diploma in CS, IT, or self-taught with strong portfolio;Understanding of responsive design",
     "benefits": "Medical aid;Provident fund;Remote work;Mentorship program;Conference budget"},
]

APPLICANTS = [
    {"name": "Siphelele", "surname": "Dlamini", "email": "siphelele.d@gmail.com", "phone": "+27 82 111 2001",
     "location": "Johannesburg", "education": "BSc Computer Science (Wits)", "experience": "4 years",
     "skills": "Java, Spring Boot, AWS, PostgreSQL, Docker", "source": "LinkedIn",
     "gender": "Male", "race": "African", "citizenshipStatus": "South African"},
    {"name": "Anika", "surname": "van Rooyen", "email": "anika.vr@outlook.com", "phone": "+27 83 222 3002",
     "location": "Cape Town", "education": "BSc Honours CS (UCT)", "experience": "6 years",
     "skills": "Python, Kubernetes, Terraform, AWS CDK, CI/CD", "source": "Company Website",
     "gender": "Female", "race": "White", "citizenshipStatus": "South African"},
    {"name": "Kagiso", "surname": "Mokoena", "email": "kagiso.m@yahoo.com", "phone": "+27 84 333 4003",
     "location": "Pretoria", "education": "BTech IT (TUT)", "experience": "3 years",
     "skills": "React, TypeScript, Node.js, Figma, Tailwind CSS", "source": "Indeed",
     "gender": "Male", "race": "African", "citizenshipStatus": "South African"},
    {"name": "Zinhle", "surname": "Mthethwa", "email": "zinhle.m@gmail.com", "phone": "+27 82 444 5004",
     "location": "Durban", "education": "MBA (GIBS)", "experience": "5 years",
     "skills": "Product Strategy, Agile, User Research, SQL, Jira", "source": "Referral",
     "gender": "Female", "race": "African", "citizenshipStatus": "South African"},
    {"name": "Johan", "surname": "Booysen", "email": "johan.b@telkomsa.net", "phone": "+27 83 555 6005",
     "location": "Johannesburg", "education": "BCom Marketing (UJ)", "experience": "2 years",
     "skills": "CRM, Cold Outreach, LinkedIn Sales Navigator, HubSpot", "source": "LinkedIn",
     "gender": "Male", "race": "White", "citizenshipStatus": "South African"},
    {"name": "Nomfundo", "surname": "Zwane", "email": "nomfundo.z@outlook.com", "phone": "+27 84 666 7006",
     "location": "Johannesburg", "education": "BSc CS (UJ)", "experience": "1 year",
     "skills": "React, JavaScript, HTML/CSS, Git, REST APIs", "source": "Company Website",
     "gender": "Female", "race": "African", "citizenshipStatus": "South African"},
    {"name": "Tariq", "surname": "Essop", "email": "tariq.e@gmail.com", "phone": "+27 82 777 8007",
     "location": "Cape Town", "education": "BSc CS Honours (Stellenbosch)", "experience": "7 years",
     "skills": "Java, Microservices, Event-Driven Architecture, DynamoDB", "source": "LinkedIn",
     "gender": "Male", "race": "Coloured", "citizenshipStatus": "South African"},
    {"name": "Busisiwe", "surname": "Nkosi", "email": "busi.n@gmail.com", "phone": "+27 83 888 9008",
     "location": "Johannesburg", "education": "BCom Honours (Wits)", "experience": "8 years",
     "skills": "Customer Success, SaaS, Account Management, Churn Analysis", "source": "Referral",
     "gender": "Female", "race": "African", "citizenshipStatus": "South African"},
]


def build_recruitment_items(key_bytes):
    items = []
    creator_id = deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-003')  # David Chen
    recruiter_id = deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-004')  # Priya
    interviewer_id = deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-005')  # James

    posting_ids = []
    for i, jp in enumerate(JOB_POSTINGS):
        pid = deterministic_id(TENANT_ID, 'JOB_POSTING', jp['title'])
        posting_ids.append(pid)
        slug = jp['title'].lower().replace(' ', '-').replace('/', '-')
        created = iso_offset(days=-(30 - i * 3))
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'JOB_POSTING#{pid}'},
            'GSI1PK': {'S': f'POSTING_STATUS#PUBLISHED'},
            'GSI1SK': {'S': f'JOB_POSTING#{created}'},
            'GSI2PK': {'S': f'POSTING_CREATOR#{creator_id}'},
            'GSI2SK': {'S': f'JOB_POSTING#{created}'},
            'GSI3PK': {'S': f'POSTING_DEPT#{jp["department"]}'},
            'GSI3SK': {'S': f'JOB_POSTING#{created}'},
            'GSI4PK': {'S': f'POSTING_SLUG#{TENANT_ID}#{slug}'},
            'GSI4SK': {'S': f'JOB_POSTING#{pid}'},
            'GSI6PK': {'S': f'POSTING_CREATED#{TENANT_ID}'},
            'GSI6SK': {'S': f'JOB_POSTING#{created}'},
            'id':                   {'S': pid},
            'tenantId':             {'S': TENANT_ID},
            'title':                {'S': jp['title']},
            'slug':                 {'S': slug},
            'department':           {'S': jp['department']},
            'location':             {'S': jp['location']},
            'employmentType':       {'S': jp['employmentType']},
            'experienceLevel':      {'S': jp['experienceLevel']},
            'description':          {'S': jp['description']},
            'requirements':         {'S': jp['requirements']},
            'responsibilities':     {'S': jp['responsibilities']},
            'qualifications':       {'S': jp['qualifications']},
            'benefits':             {'S': jp['benefits']},
            'salaryMin':            {'S': jp['salaryMin']},
            'salaryMax':            {'S': jp['salaryMax']},
            'salaryCurrency':       {'S': 'ZAR'},
            'remoteWorkAllowed':    {'BOOL': 'Remote' in jp['location']},
            'travelRequired':       {'BOOL': False},
            'applicationDeadline':  {'S': date_offset(60)},
            'positionsAvailable':   {'N': '1'},
            'status':               {'S': 'PUBLISHED'},
            'featured':             {'BOOL': i == 0},
            'urgent':               {'BOOL': i == 3},
            'viewsCount':           {'N': str(50 + i * 20)},
            'applicationsCount':    {'N': str(2 + i)},
            'createdBy':            {'S': creator_id},
            'approvedBy':           {'S': creator_id},
            'publishedBy':          {'S': recruiter_id},
            'createdAt':            {'S': created},
            'updatedAt':            {'S': created},
            'approvedAt':           {'S': created},
            'publishedAt':          {'S': created},
        }
        items.append(('JOB_POSTING', jp['title'], item))

        # Job Ad for each posting
        ad_id = deterministic_id(TENANT_ID, 'JOB_AD', f"ad-{jp['title']}")
        ad_item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'JOB_AD#{ad_id}'},
            'GSI1PK': {'S': f'JOBAD_STATUS#PUBLISHED'},
            'GSI1SK': {'S': f'JOB_AD#{created}'},
            'GSI2PK': {'S': f'JOBAD_POSTING#{pid}'},
            'GSI2SK': {'S': f'JOB_AD#{ad_id}'},
            'GSI4PK': {'S': f'JOBAD_SLUG#{TENANT_ID}#{slug}-ad'},
            'GSI4SK': {'S': f'JOB_AD#{ad_id}'},
            'GSI6PK': {'S': f'JOBAD_CREATED#{TENANT_ID}'},
            'GSI6SK': {'S': f'JOB_AD#{created}'},
            'id':              {'S': ad_id},
            'tenantId':        {'S': TENANT_ID},
            'jobPostingId':    {'S': pid},
            'title':           {'S': jp['title']},
            'slug':            {'S': f"{slug}-ad"},
            'status':          {'S': 'PUBLISHED'},
            'channelInternal': {'BOOL': True},
            'channelExternal': {'BOOL': True},
            'closingDate':     {'S': date_offset(60)},
            'department':      {'S': jp['department']},
            'location':        {'S': jp['location']},
            'employmentType':  {'S': jp['employmentType']},
            'salaryRangeMin':  {'S': jp['salaryMin']},
            'salaryRangeMax':  {'S': jp['salaryMax']},
            'salaryCurrency':  {'S': 'ZAR'},
            'createdBy':       {'S': recruiter_id},
            'createdAt':       {'S': created},
            'updatedAt':       {'S': created},
        }
        items.append(('JOB_AD', f"Ad: {jp['title']}", ad_item))

    # Applicants
    applicant_ids = []
    for i, app in enumerate(APPLICANTS):
        aid = deterministic_id(TENANT_ID, 'APPLICANT', app['email'])
        applicant_ids.append(aid)
        submitted = iso_offset(days=-(20 - i * 2))
        phone_val = encrypt_pii(app['phone'], key_bytes) if key_bytes else app['phone']
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'APPLICANT#{aid}'},
            'GSI1PK': {'S': f'APPLICANT_CREATED#{TENANT_ID}'},
            'GSI1SK': {'S': f'APPLICANT#{submitted}'},
            'GSI4PK': {'S': f'APPLICANT_EMAIL#{TENANT_ID}#{app["email"]}'},
            'GSI4SK': {'S': f'APPLICANT#{aid}'},
            'id':                   {'S': aid},
            'tenantId':             {'S': TENANT_ID},
            'name':                 {'S': app['name']},
            'surname':              {'S': app['surname']},
            'email':                {'S': app['email']},
            'phone':                {'S': phone_val},
            'location':             {'S': app['location']},
            'education':            {'S': app['education']},
            'experience':           {'S': app['experience']},
            'skills':               {'S': app['skills']},
            'source':               {'S': app['source']},
            'gender':               {'S': app['gender']},
            'race':                 {'S': app['race']},
            'citizenshipStatus':    {'S': app['citizenshipStatus']},
            'demographicsConsent':  {'BOOL': True},
            'demographicsConsentDate': {'S': NOW_ISO},
            'createdAt':            {'S': submitted},
            'updatedAt':            {'S': submitted},
        }
        items.append(('APPLICANT', f"{app['name']} {app['surname']}", item))

    # Applications — map applicants to postings with various statuses
    app_mappings = [
        (0, 0, "INTERVIEW_COMPLETED"),  # Siphelele → Senior Backend
        (1, 3, "SCREENING"),            # Anika → DevOps
        (2, 5, "SUBMITTED"),            # Kagiso → Junior Frontend
        (3, 1, "REFERENCE_CHECK"),      # Zinhle → Product Manager
        (4, 2, "INTERVIEW_COMPLETED"),  # Johan → SDR
        (5, 5, "SCREENING"),            # Nomfundo → Junior Frontend
        (6, 0, "HIRED"),                # Tariq → Senior Backend (accepted offer)
        (7, 4, "INTERVIEW_COMPLETED"),  # Busisiwe → Head of CS
    ]

    for appl_idx, post_idx, status in app_mappings:
        application_id = deterministic_id(TENANT_ID, 'APPLICATION', f"app-{appl_idx}-{post_idx}")
        submitted = iso_offset(days=-(18 - appl_idx * 2))
        posting = JOB_POSTINGS[post_idx]
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'APPLICATION#{application_id}'},
            'GSI1PK': {'S': f'APP_STATUS#{status}'},
            'GSI1SK': {'S': f'APP#{submitted}'},
            'GSI2PK': {'S': f'APP_JOB_POSTING#{posting_ids[post_idx]}'},
            'GSI2SK': {'S': f'APP#{application_id}'},
            'GSI3PK': {'S': f'APP_DEPT#{posting["department"]}'},
            'GSI3SK': {'S': f'APP#{submitted}'},
            'GSI4PK': {'S': f'APP_APPLICANT#{applicant_ids[appl_idx]}'},
            'GSI4SK': {'S': f'APP#{application_id}'},
            'GSI6PK': {'S': f'APP_CREATED#{TENANT_ID}'},
            'GSI6SK': {'S': f'APP#{submitted}'},
            'id':                    {'S': application_id},
            'tenantId':              {'S': TENANT_ID},
            'applicantId':           {'S': applicant_ids[appl_idx]},
            'jobPostingId':          {'S': posting_ids[post_idx]},
            'jobTitle':              {'S': posting['title']},
            'department':            {'S': posting['department']},
            'status':                {'S': status},
            'pipelineStage':         {'S': status},
            'pipelineStageEnteredAt': {'S': iso_offset(days=-5)},
            'applicationSource':     {'S': APPLICANTS[appl_idx]['source']},
            'submittedAt':           {'S': submitted},
            'createdAt':             {'S': submitted},
            'updatedAt':             {'S': NOW_ISO},
        }
        if status in ('INTERVIEW_COMPLETED', 'REFERENCE_CHECK', 'HIRED'):
            item['screeningNotes'] = {'S': 'Strong candidate, meets requirements.'}
            item['rating'] = {'S': '4'}
        if status in ('INTERVIEW_COMPLETED', 'HIRED'):
            item['interviewFeedback'] = {'S': 'Excellent technical skills, good cultural fit.'}
            item['interviewedAt'] = {'S': iso_offset(days=-7)}
        items.append(('APPLICATION', f"App: {APPLICANTS[appl_idx]['name']} → {posting['title']}", item))

    # Interviews
    interview_data = [
        (0, 0, "COMPLETED", "STRONG_HIRE", 5, "Exceptional system design knowledge."),
        (3, 1, "COMPLETED", "HIRE", 4, "Strong product sense, good stakeholder skills."),
        (4, 2, "COMPLETED", "CONSIDER", 3, "Enthusiastic but needs more B2B experience."),
        (6, 0, "COMPLETED", "STRONG_HIRE", 5, "Outstanding architecture skills, 7 years experience shows."),
        (7, 4, "COMPLETED", "HIRE", 4, "Proven CS leadership, good strategic thinking."),
        (1, 3, "SCHEDULED", None, 0, ""),
    ]

    for appl_idx, post_idx, status, recommendation, rating, feedback in interview_data:
        application_id = deterministic_id(TENANT_ID, 'APPLICATION', f"app-{appl_idx}-{post_idx}")
        intv_id = deterministic_id(TENANT_ID, 'INTERVIEW', f"intv-{appl_idx}-{post_idx}")
        scheduled = iso_offset(days=(-10 if status == "COMPLETED" else 5), hours=10)
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'INTERVIEW#{intv_id}'},
            'GSI1PK': {'S': f'INTERVIEW_STATUS#{status}'},
            'GSI1SK': {'S': f'INTERVIEW#{scheduled}'},
            'GSI2PK': {'S': f'INTERVIEW_APP#{application_id}'},
            'GSI2SK': {'S': f'INTERVIEW#{scheduled}'},
            'GSI5PK': {'S': f'INTERVIEW_INTERVIEWER#{interviewer_id}'},
            'GSI5SK': {'S': f'INTERVIEW#{scheduled}'},
            'GSI6PK': {'S': f'INTERVIEW_DATE#{TENANT_ID}'},
            'GSI6SK': {'S': scheduled},
            'id':              {'S': intv_id},
            'tenantId':        {'S': TENANT_ID},
            'applicationId':   {'S': application_id},
            'title':           {'S': f"Technical Interview - {APPLICANTS[appl_idx]['name']}"},
            'type':            {'S': 'VIDEO' if appl_idx % 2 == 0 else 'IN_PERSON'},
            'round':           {'S': 'FIRST_ROUND'},
            'status':          {'S': status},
            'scheduledAt':     {'S': scheduled},
            'durationMinutes': {'N': '60'},
            'location':        {'S': 'Google Meet' if appl_idx % 2 == 0 else 'Johannesburg HQ'},
            'interviewerId':   {'S': interviewer_id},
            'interviewerName': {'S': 'James Wilson'},
            'createdBy':       {'S': recruiter_id},
            'createdAt':       {'S': iso_offset(days=-15)},
            'updatedAt':       {'S': NOW_ISO},
        }
        if status == "COMPLETED":
            item['feedback'] = {'S': feedback}
            item['rating'] = {'N': str(rating)}
            item['recommendation'] = {'S': recommendation}
            item['overallImpression'] = {'S': feedback[:50]}
            item['completedAt'] = {'S': iso_offset(days=-10)}
        items.append(('INTERVIEW', f"Interview: {APPLICANTS[appl_idx]['name']}", item))

    return items


# ============================================================
# Performance Module
# ============================================================
def build_performance_items():
    items = []

    # Performance Cycle (PerformanceCycleItem uses LocalDateTime — no Z)
    cycle_id = deterministic_id(TENANT_ID, 'PERF_CYCLE', '2026-annual')
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'PERF_CYCLE#{cycle_id}'},
        'GSI1PK': {'S': f'PC_STATUS#{TENANT_ID}#MID_YEAR'},
        'GSI1SK': {'S': f'PERF_CYCLE#{cycle_id}'},
        'id':                    {'S': cycle_id},
        'tenantId':              {'S': TENANT_ID},
        'name':                  {'S': '2026 Annual Performance Review'},
        'description':           {'S': 'Annual performance assessment cycle for FY2026'},
        'startDate':             {'S': '2026-01-01'},
        'endDate':               {'S': '2026-12-31'},
        'midYearDeadline':       {'S': '2026-06-30'},
        'finalReviewDeadline':   {'S': '2026-11-30'},
        'status':                {'S': 'MID_YEAR'},
        'isDefault':             {'BOOL': True},
        'createdBy':             {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-002')},
        'createdAt':             {'S': '2026-01-05T08:00:00'},
        'updatedAt':             {'S': NOW_ISO_LOCAL},
    }
    items.append(('PERF_CYCLE', '2026 Annual Review', item))

    # Performance Contracts for key employees
    contracts = [
        ("SH-003", "David Chen", "VP of Engineering", "Engineering", "D2"),
        ("SH-005", "James Wilson", "Senior Software Engineer", "Engineering", "C3"),
        ("SH-006", "Lisa Mokoena", "UX Designer", "Product", "C1"),
        ("SH-009", "Ravi Pillay", "Financial Controller", "Finance", "D1"),
        ("SH-010", "Naledi Kgosi", "Customer Success Manager", "Operations", "C2"),
    ]

    manager_id = deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-001')  # Arthur as overall manager

    for emp_num, name, title, dept, grade in contracts:
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        con_id = deterministic_id(TENANT_ID, 'PERF_CONTRACT', f"{emp_num}-2026")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'PERF_CONTRACT#{con_id}'},
            'GSI1PK': {'S': f'PCON_EMP#{TENANT_ID}#{emp_id}'},
            'GSI1SK': {'S': f'PERF_CONTRACT#{con_id}'},
            'id':             {'S': con_id},
            'tenantId':       {'S': TENANT_ID},
            'cycleId':        {'S': cycle_id},
            'employeeId':     {'S': emp_id},
            'employeeName':   {'S': name},
            'employeeNumber': {'S': emp_num},
            'managerId':      {'S': manager_id},
            'managerName':    {'S': 'Arthur Manena'},
            'department':     {'S': dept},
            'jobTitle':       {'S': title},
            'jobLevel':       {'S': grade},
            'status':         {'S': 'ACTIVE'},
            'version':        {'N': '1'},
            'createdAt':      {'S': '2026-01-10T09:00:00'},
            'updatedAt':      {'S': NOW_ISO},
        }
        items.append(('PERF_CONTRACT', f"Contract: {name}", item))

    # Feedback Requests (FeedbackRequestItem uses LocalDateTime — no Z)
    for emp_num, name, _, _, _ in contracts[:3]:
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        fr_id = deterministic_id(TENANT_ID, 'FEEDBACK_REQ', f"self-{emp_num}-2026")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'FEEDBACK_REQ#{fr_id}'},
            'GSI1PK': {'S': f'FR_EMP#{TENANT_ID}#{emp_id}'},
            'GSI1SK': {'S': f'FR#{fr_id}'},
            'id':           {'S': fr_id},
            'tenantId':     {'S': TENANT_ID},
            'employeeId':   {'S': emp_id},
            'requesterId':  {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-002')},
            'feedbackType': {'S': 'SELF'},
            'status':       {'S': 'PENDING'},
            'dueDate':      {'S': '2026-07-31'},
            'createdAt':    {'S': '2026-06-15T08:00:00'},
            'updatedAt':    {'S': NOW_ISO_LOCAL},
        }
        items.append(('FEEDBACK_REQ', f"Self-assessment: {name}", item))

    return items


# ============================================================
# Training Module
# ============================================================
def build_training_items():
    items = []

    courses = [
        {"title": "Leadership Essentials", "code": "LEAD-101", "category": "Leadership",
         "provider": "Internal", "deliveryMethod": "WORKSHOP", "duration": 16, "maxParticipants": 20,
         "description": "Foundational leadership skills for new managers", "isMandatory": False, "cost": "0"},
        {"title": "Data Privacy & POPIA Compliance", "code": "COMP-201", "category": "Compliance",
         "provider": "Legal Team", "deliveryMethod": "ONLINE", "duration": 4, "maxParticipants": 100,
         "description": "Annual POPIA compliance training for all staff", "isMandatory": True, "cost": "0"},
        {"title": "AWS Solutions Architect", "code": "TECH-301", "category": "Technical",
         "provider": "AWS Training", "deliveryMethod": "ONLINE", "duration": 40, "maxParticipants": 10,
         "description": "AWS Solutions Architect Associate certification prep", "isMandatory": False, "cost": "15000"},
        {"title": "Agile Product Management", "code": "PROD-101", "category": "Product",
         "provider": "Scrum.org", "deliveryMethod": "CLASSROOM", "duration": 16, "maxParticipants": 15,
         "description": "Professional Scrum Product Owner certification", "isMandatory": False, "cost": "12000"},
        {"title": "Unconscious Bias Workshop", "code": "DEI-101", "category": "Diversity",
         "provider": "Internal", "deliveryMethod": "WORKSHOP", "duration": 8, "maxParticipants": 30,
         "description": "Understanding and mitigating unconscious bias in hiring and management", "isMandatory": True, "cost": "0"},
    ]

    course_ids = []
    for c in courses:
        cid = deterministic_id(TENANT_ID, 'TRAIN_COURSE', c['code'])
        course_ids.append(cid)
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'TRAIN_COURSE#{cid}'},
            'GSI1PK': {'S': f'TC_CAT#{TENANT_ID}#{c["category"]}'},
            'GSI1SK': {'S': f'TRAIN_COURSE#{cid}'},
            'id':              {'S': cid},
            'tenantId':        {'S': TENANT_ID},
            'title':           {'S': c['title']},
            'code':            {'S': c['code']},
            'description':     {'S': c['description']},
            'deliveryMethod':  {'S': c['deliveryMethod']},
            'category':        {'S': c['category']},
            'provider':        {'S': c['provider']},
            'durationHours':   {'N': str(c['duration'])},
            'maxParticipants': {'N': str(c['maxParticipants'])},
            'cost':            {'S': c['cost']},
            'isMandatory':     {'BOOL': c['isMandatory']},
            'isActive':        {'BOOL': True},
            'createdAt':       {'S': NOW_ISO},
            'updatedAt':       {'S': NOW_ISO},
        }
        items.append(('TRAIN_COURSE', c['title'], item))

    # Sessions (TrainingSessionItem uses Instant for startDate/endDate/createdAt/updatedAt — with Z)
    sessions = [
        (0, "2026-07-15T09:00:00Z", "2026-07-16T17:00:00Z", "IN_PROGRESS", "Sarah Johnson", "Johannesburg HQ", 15),
        (1, "2026-06-01T09:00:00Z", "2026-06-01T13:00:00Z", "COMPLETED", "Legal Team", "Online", 95),
        (2, "2026-08-01T09:00:00Z", "2026-09-15T17:00:00Z", "OPEN", "AWS Instructor", "Online", 8),
        (4, "2026-05-10T09:00:00Z", "2026-05-10T17:00:00Z", "COMPLETED", "Sarah Johnson", "Johannesburg HQ", 25),
    ]

    session_ids = []
    for course_idx, start, end, status, trainer, location, seats in sessions:
        sid = deterministic_id(TENANT_ID, 'TRAIN_SESSION', f"sess-{courses[course_idx]['code']}-{start[:10]}")
        session_ids.append((sid, course_idx))
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'TRAIN_SESSION#{sid}'},
            'GSI1PK': {'S': f'TS_COURSE#{TENANT_ID}#{course_ids[course_idx]}'},
            'GSI1SK': {'S': f'TRAIN_SESSION#{sid}'},
            'id':             {'S': sid},
            'tenantId':       {'S': TENANT_ID},
            'courseId':       {'S': course_ids[course_idx]},
            'trainerName':    {'S': trainer},
            'location':       {'S': location},
            'startDate':      {'S': start},
            'endDate':        {'S': end},
            'status':         {'S': status},
            'availableSeats': {'N': str(seats)},
            'createdAt':      {'S': NOW_ISO},
            'updatedAt':      {'S': NOW_ISO},
        }
        items.append(('TRAIN_SESSION', f"Session: {courses[course_idx]['title']}", item))

    # Enrollments
    enrollments = [
        ("SH-003", 0, "ATTENDED"),   # David → Leadership
        ("SH-005", 0, "REGISTERED"), # James → Leadership
        ("SH-001", 1, "COMPLETED"),  # Arthur → POPIA
        ("SH-002", 1, "COMPLETED"),  # Sarah → POPIA
        ("SH-003", 1, "COMPLETED"),  # David → POPIA
        ("SH-005", 2, "REGISTERED"), # James → AWS
        ("SH-006", 3, "COMPLETED"),  # Lisa → Unconscious Bias (session idx 3 = course 4)
    ]

    for emp_num, sess_idx, status in enrollments:
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        sid, _ = session_ids[sess_idx] if sess_idx < len(session_ids) else (session_ids[0][0], 0)
        enr_id = deterministic_id(TENANT_ID, 'TRAIN_ENROLL', f"{emp_num}-{sid}")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'TRAIN_ENROLL#{enr_id}'},
            'GSI1PK': {'S': f'TE_EMP#{TENANT_ID}#{emp_id}'},
            'GSI1SK': {'S': f'TRAIN_ENROLL#{enr_id}'},
            'id':         {'S': enr_id},
            'tenantId':   {'S': TENANT_ID},
            'sessionId':  {'S': sid},
            'employeeId': {'S': emp_id},
            'status':     {'S': status},
            'enrolledAt': {'S': NOW_ISO},
            'createdAt':  {'S': NOW_ISO},
            'updatedAt':  {'S': NOW_ISO},
        }
        if status == 'COMPLETED':
            item['completedAt'] = {'S': NOW_ISO}
            item['score'] = {'S': '85'}
        items.append(('TRAIN_ENROLL', f"Enrollment: {emp_num}", item))

    return items


# ============================================================
# Engagement Module
# ============================================================
def build_engagement_items():
    items = []

    # Pulse Survey (SurveyItem uses LocalDateTime — no Z)
    survey_id = deterministic_id(TENANT_ID, 'SURVEY', 'q2-2026-pulse')
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'SURVEY#{survey_id}'},
        'GSI1PK': {'S': f'SURVEY_STATUS#{TENANT_ID}#ACTIVE'},
        'GSI1SK': {'S': f'SURVEY#{NOW_ISO_LOCAL}'},
        'id':          {'S': survey_id},
        'tenantId':    {'S': TENANT_ID},
        'title':       {'S': 'Q2 2026 Employee Pulse Survey'},
        'description': {'S': 'Quarterly engagement pulse check - your anonymous feedback helps us improve.'},
        'status':      {'S': 'ACTIVE'},
        'isAnonymous': {'BOOL': True},
        'startDate':   {'S': '2026-07-01'},
        'endDate':     {'S': '2026-07-31'},
        'createdBy':   {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-002')},
        'createdAt':   {'S': '2026-06-25T09:00:00'},
        'updatedAt':   {'S': NOW_ISO_LOCAL},
    }
    items.append(('SURVEY', 'Q2 Pulse Survey', item))

    # Survey Questions
    questions = [
        ("I feel valued at work", "RATING"),
        ("I have the tools and resources to do my job well", "RATING"),
        ("My manager supports my professional development", "RATING"),
        ("I would recommend this company as a great place to work", "RATING"),
        ("What could we do better?", "TEXT"),
    ]

    # Survey Questions (SurveyQuestionItem uses LocalDateTime — no Z)
    question_ids = []
    for i, (text, qtype) in enumerate(questions):
        qid = deterministic_id(TENANT_ID, 'SURVEY_Q', f"q2-2026-q{i}")
        question_ids.append(qid)
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'SURVEY_Q#{qid}'},
            'GSI1PK': {'S': f'SURVQ_SURV#{TENANT_ID}#{survey_id}'},
            'GSI1SK': {'S': f'SURVEY_Q#{str(i).zfill(3)}#{qid}'},
            'id':           {'S': qid},
            'tenantId':     {'S': TENANT_ID},
            'surveyId':     {'S': survey_id},
            'questionText': {'S': text},
            'questionType': {'S': qtype},
            'displayOrder': {'N': str(i + 1)},
            'isRequired':   {'BOOL': True},
            'createdAt':    {'S': NOW_ISO_LOCAL},
        }
        if qtype == 'RATING':
            item['options'] = {'S': json.dumps(["1", "2", "3", "4", "5"])}
        items.append(('SURVEY_Q', f"Question: {text[:30]}", item))

    # Survey Responses (SurveyResponseItem uses LocalDateTime — no Z)
    for emp_idx in range(5):
        emp_num = f"SH-{str(emp_idx + 3).zfill(3)}"
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        for q_idx, (_, qtype) in enumerate(questions):
            resp_id = deterministic_id(TENANT_ID, 'SURVEY_R', f"resp-{emp_idx}-{q_idx}")
            item = {
                'PK':     {'S': f'TENANT#{TENANT_ID}'},
                'SK':     {'S': f'SURVEY_R#{resp_id}'},
                'GSI1PK': {'S': f'SURVR_SURV#{TENANT_ID}#{survey_id}'},
                'GSI1SK': {'S': f'SURVEY_R#{NOW_ISO_LOCAL}'},
                'id':         {'S': resp_id},
                'tenantId':   {'S': TENANT_ID},
                'surveyId':   {'S': survey_id},
                'questionId': {'S': question_ids[q_idx]},
                'employeeId': {'S': emp_id},
                'createdAt':  {'S': NOW_ISO_LOCAL},
            }
            if qtype == 'RATING':
                item['rating'] = {'N': str(3 + (emp_idx + q_idx) % 3)}  # 3-5 range
            else:
                texts = ["More team social events", "Better work-life balance", "More learning opportunities",
                         "Cross-team collaboration", "Clearer career paths"]
                item['textResponse'] = {'S': texts[emp_idx]}
            items.append(('SURVEY_R', f"Response {emp_idx}-{q_idx}", item))

    # Recognition entries
    recognitions = [
        ("SH-003", "SH-005", "INNOVATION", "Outstanding work on the new caching layer - reduced latency by 60%!", 50),
        ("SH-002", "SH-004", "GOING_ABOVE", "Priya filled 3 critical roles ahead of schedule this quarter.", 30),
        ("SH-001", "SH-006", "TEAMWORK", "Lisa's design system has made the whole team more productive.", 40),
        ("SH-005", "SH-003", "LEADERSHIP", "David's mentorship has helped two juniors get promoted.", 50),
        ("SH-007", "SH-010", "CUSTOMER_SERVICE", "Naledi saved a churning enterprise account through proactive outreach.", 40),
    ]

    for i, (from_num, to_num, category, message, points) in enumerate(recognitions):
        rec_id = deterministic_id(TENANT_ID, 'RECOGNITION', f"recog-{i}")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'RECOGNITION#{rec_id}'},
            'GSI1PK': {'S': f'RECOG_TO#{TENANT_ID}#{deterministic_id(TENANT_ID, "EMPLOYEE", to_num)}'},
            'GSI1SK': {'S': f'RECOGNITION#{iso_offset(days=-(i * 5))}'},
            'id':             {'S': rec_id},
            'tenantId':       {'S': TENANT_ID},
            'fromEmployeeId': {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', from_num)},
            'toEmployeeId':   {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', to_num)},
            'category':       {'S': category},
            'message':        {'S': message},
            'points':         {'N': str(points)},
            'isPublic':       {'BOOL': True},
            'createdAt':      {'S': iso_offset(days=-(i * 5))},
        }
        items.append(('RECOGNITION', f"Recognition: {category}", item))

    # Attrition Risk scores
    risk_data = [
        ("SH-008", "0.25", "LOW"),
        ("SH-005", "0.45", "MEDIUM"),
        ("SH-010", "0.15", "LOW"),
        ("SH-006", "0.62", "HIGH"),
    ]
    for emp_num, score, level in risk_data:
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        risk_id = deterministic_id(TENANT_ID, 'ATTRITION_RISK', f"risk-{emp_num}")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'ATTRITION_RISK#{risk_id}'},
            'GSI1PK': {'S': f'ATTR_EMP#{TENANT_ID}#{emp_id}'},
            'GSI1SK': {'S': f'ATTRITION_RISK#{NOW_ISO}'},
            'id':           {'S': risk_id},
            'tenantId':     {'S': TENANT_ID},
            'employeeId':   {'S': emp_id},
            'riskScore':    {'S': score},
            'riskLevel':    {'S': level},
            'factors':      {'S': json.dumps({"tenure": 0.3, "engagement": 0.4, "compensation": 0.3})},
            'calculatedAt': {'S': NOW_ISO},
            'createdAt':    {'S': NOW_ISO},
        }
        items.append(('ATTRITION_RISK', f"Risk: {emp_num} ({level})", item))

    return items


# ============================================================
# Documents Module
# ============================================================
def build_document_items():
    items = []
    doc_types = [
        ("SH-001", "CONTRACT", "Employment Contract - Arthur Manena", "arthur_contract_2022.pdf"),
        ("SH-001", "ID_DOCUMENT", "ID Document - Arthur Manena", "arthur_id.pdf"),
        ("SH-002", "CONTRACT", "Employment Contract - Sarah Johnson", "sarah_contract_2022.pdf"),
        ("SH-002", "QUALIFICATION", "MBA Certificate - Sarah Johnson", "sarah_mba_cert.pdf"),
        ("SH-003", "CONTRACT", "Employment Contract - David Chen", "david_contract_2022.pdf"),
        ("SH-003", "WORK_PERMIT", "Work Permit - David Chen", "david_work_permit.pdf"),
        ("SH-005", "CONTRACT", "Employment Contract - James Wilson", "james_contract_2022.pdf"),
        ("SH-005", "TRAINING_CERTIFICATE", "AWS SA Associate - James Wilson", "james_aws_cert.pdf"),
        ("SH-006", "CONTRACT", "Employment Contract - Lisa Mokoena", "lisa_contract_2023.pdf"),
        ("SH-009", "CONTRACT", "Employment Contract - Ravi Pillay", "ravi_contract_2023.pdf"),
        ("SH-009", "QUALIFICATION", "CA(SA) Certificate - Ravi Pillay", "ravi_casa_cert.pdf"),
    ]

    for i, (emp_num, doc_type, title, filename) in enumerate(doc_types):
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        doc_id = deterministic_id(TENANT_ID, 'EMPDOC', f"{emp_num}-{doc_type}-{i}")
        created = iso_offset(days=-(60 - i * 5))
        expiry = date_offset(365) if doc_type == 'WORK_PERMIT' else ''
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'EMPDOC#{doc_id}'},
            'GSI1PK': {'S': f'EMPDOC_ACTIVE#{TENANT_ID}#true'},
            'GSI1SK': {'S': f'EMPDOC#{doc_type}#{created}'},
            'GSI2PK': {'S': f'EMPDOC_EMP#{TENANT_ID}#{emp_id}'},
            'GSI2SK': {'S': f'EMPDOC#{created}'},
            'id':           {'S': doc_id},
            'tenantId':     {'S': TENANT_ID},
            'employeeId':   {'S': emp_id},
            'documentType': {'S': doc_type},
            'title':        {'S': title},
            'description':  {'S': f'{doc_type.replace("_", " ").title()} for employee {emp_num}'},
            'filename':     {'S': filename},
            'fileUrl':      {'S': f's3://shumelahire-dev-documents/{TENANT_ID}/{emp_id}/{filename}'},
            'fileSize':     {'S': str(150000 + i * 50000)},
            'contentType':  {'S': 'application/pdf'},
            'version':      {'N': '1'},
            'isActive':     {'BOOL': True},
            'uploadedBy':   {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-002')},
            'createdAt':    {'S': created},
            'updatedAt':    {'S': created},
        }
        if expiry:
            item['expiryDate'] = {'S': expiry}
            item['GSI6PK'] = {'S': f'EMPDOC_EXPIRY#{TENANT_ID}'}
            item['GSI6SK'] = {'S': f'#{expiry}#{doc_id}'}
        items.append(('EMPDOC', title, item))

    return items


# ============================================================
# Onboarding Module
# ============================================================
def build_onboarding_items():
    items = []

    # Onboarding Template
    template_id = deterministic_id(TENANT_ID, 'ONBOARD_TEMPLATE', 'general-onboarding')
    checklist_items = [
        {"title": "Sign employment contract", "description": "Review and sign the employment agreement", "category": "Documentation", "sortOrder": 1},
        {"title": "Submit ID and tax documents", "description": "Provide certified ID copy and tax number", "category": "Documentation", "sortOrder": 2},
        {"title": "Complete banking details form", "description": "Submit banking details for payroll setup", "category": "Documentation", "sortOrder": 3},
        {"title": "IT setup - laptop and accounts", "description": "Collect laptop, set up email, Slack, and system access", "category": "IT Setup", "sortOrder": 4},
        {"title": "Office tour and introductions", "description": "Meet the team, tour the office, locate facilities", "category": "Orientation", "sortOrder": 5},
        {"title": "Complete POPIA training", "description": "Mandatory data privacy compliance training", "category": "Training", "sortOrder": 6},
        {"title": "Review company policies", "description": "Read employee handbook and sign acknowledgement", "category": "Policies", "sortOrder": 7},
        {"title": "Set up benefits enrollment", "description": "Choose medical aid and pension fund options", "category": "Benefits", "sortOrder": 8},
        {"title": "First week goals meeting", "description": "Meet with manager to discuss first 30/60/90 day goals", "category": "Goals", "sortOrder": 9},
        {"title": "Buddy introduction", "description": "Meet assigned onboarding buddy for first month", "category": "Culture", "sortOrder": 10},
    ]
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'ONBOARD_TEMPLATE#{template_id}'},
        'id':          {'S': template_id},
        'tenantId':    {'S': TENANT_ID},
        'name':        {'S': 'General Onboarding Checklist'},
        'description': {'S': 'Standard onboarding process for all new hires'},
        'department':  {'S': 'ALL'},
        'isActive':    {'BOOL': True},
        'itemsJson':   {'S': json.dumps(checklist_items)},
        'createdAt':   {'S': NOW_ISO},
        'updatedAt':   {'S': NOW_ISO},
    }
    items.append(('ONBOARD_TEMPLATE', 'General Onboarding Template', item))

    # Active checklist for most recent hire (Thandi - SH-008)
    emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-008')
    cl_id = deterministic_id(TENANT_ID, 'ONBOARD_CHECKLIST', 'SH-008-general')
    active_items = []
    for ci in checklist_items:
        ci_copy = ci.copy()
        if ci['sortOrder'] <= 6:
            ci_copy['status'] = 'COMPLETED'
            ci_copy['completedAt'] = iso_offset(days=-30)
        else:
            ci_copy['status'] = 'PENDING'
        active_items.append(ci_copy)

    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'ONBOARD_CHECKLIST#{cl_id}'},
        'GSI1PK': {'S': f'OB_CL_EMP#{TENANT_ID}#{emp_id}'},
        'GSI1SK': {'S': f'ONBOARD_CHECKLIST#{cl_id}'},
        'id':           {'S': cl_id},
        'tenantId':     {'S': TENANT_ID},
        'employeeId':   {'S': emp_id},
        'templateId':   {'S': template_id},
        'startDate':    {'S': '2024-02-01'},
        'dueDate':      {'S': '2024-03-01'},
        'status':       {'S': 'IN_PROGRESS'},
        'assignedHrId': {'S': deterministic_id(TENANT_ID, 'EMPLOYEE', 'SH-002')},
        'itemsJson':    {'S': json.dumps(active_items)},
        'createdAt':    {'S': '2024-02-01T08:00:00Z'},
        'updatedAt':    {'S': NOW_ISO},
    }
    items.append(('ONBOARD_CHECKLIST', 'Checklist: Thandi Molefe', item))

    return items


# ============================================================
# Shifts Module
# ============================================================
def build_shift_items():
    items = []

    shifts = [
        {"name": "Morning Shift", "code": "MORN", "startTime": "07:00", "endTime": "15:00", "breakMinutes": 60, "colorCode": "#F59E0B"},
        {"name": "Day Shift", "code": "DAY", "startTime": "08:00", "endTime": "17:00", "breakMinutes": 60, "colorCode": "#3B82F6"},
        {"name": "Afternoon Shift", "code": "AFTN", "startTime": "14:00", "endTime": "22:00", "breakMinutes": 45, "colorCode": "#8B5CF6"},
        {"name": "Flexi Hours", "code": "FLEX", "startTime": "06:00", "endTime": "18:00", "breakMinutes": 60, "colorCode": "#10B981"},
    ]

    shift_ids = []
    for s in shifts:
        sid = deterministic_id(TENANT_ID, 'SHIFT', s['code'])
        shift_ids.append(sid)
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'SHIFT#{sid}'},
            'id':           {'S': sid},
            'tenantId':     {'S': TENANT_ID},
            'name':         {'S': s['name']},
            'code':         {'S': s['code']},
            'startTime':    {'S': s['startTime']},
            'endTime':      {'S': s['endTime']},
            'breakMinutes': {'N': str(s['breakMinutes'])},
            'colorCode':    {'S': s['colorCode']},
            'isActive':     {'BOOL': True},
            'createdAt':    {'S': NOW_ISO},
            'updatedAt':    {'S': NOW_ISO},
        }
        items.append(('SHIFT', s['name'], item))

    # Shift schedules for next week — assign DAY shift to first 5 employees
    day_shift_id = shift_ids[1]  # DAY shift
    for emp_idx in range(5):
        emp_num = f"SH-{str(emp_idx + 1).zfill(3)}"
        emp_id = deterministic_id(TENANT_ID, 'EMPLOYEE', emp_num)
        for day in range(5):  # Mon-Fri next week
            sched_date = date_offset(7 + day - NOW.weekday())  # Next Monday + offset
            sched_id = deterministic_id(TENANT_ID, 'SHIFT_SCHED', f"{emp_num}-{sched_date}")
            item = {
                'PK':     {'S': f'TENANT#{TENANT_ID}'},
                'SK':     {'S': f'SHIFT_SCHED#{sched_id}'},
                'GSI1PK': {'S': f'SS_EMP#{TENANT_ID}#{emp_id}'},
                'GSI1SK': {'S': f'#{sched_date}#{sched_id}'},
                'id':           {'S': sched_id},
                'tenantId':     {'S': TENANT_ID},
                'employeeId':   {'S': emp_id},
                'shiftId':      {'S': day_shift_id},
                'scheduleDate': {'S': sched_date},
                'status':       {'S': 'SCHEDULED'},
                'notes':        {'S': ''},
                'createdAt':    {'S': NOW_ISO},
                'updatedAt':    {'S': NOW_ISO},
            }
            items.append(('SHIFT_SCHED', f"Schedule: {emp_num} {sched_date}", item))

    return items


# ============================================================
# Sage Integration Module
# ============================================================
def build_sage_items():
    items = []

    # Sage Config
    config_id = deterministic_id(TENANT_ID, 'SAGE_CONFIG', 'sage-300-people')
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'SAGE_CONFIG#{config_id}'},
        'GSI1PK': {'S': f'SAGE_TYPE#{TENANT_ID}#SAGE_300_PEOPLE'},
        'GSI1SK': {'S': f'SAGE_CONFIG#{config_id}'},
        'id':              {'S': config_id},
        'tenantId':        {'S': TENANT_ID},
        'name':            {'S': 'Sage 300 People - Dev'},
        'connectorType':   {'S': 'SAGE_300_PEOPLE'},
        'authMethod':      {'S': 'API_KEY'},
        'baseUrl':         {'S': 'https://api.sage.com/people/v2'},
        'credentials':     {'S': json.dumps({"apiKey": "dev-placeholder-key"})},
        'isActive':        {'BOOL': False},
        'lastTestedAt':    {'S': NOW_ISO},
        'lastTestSuccess': {'BOOL': False},
        'createdAt':       {'S': NOW_ISO},
        'updatedAt':       {'S': NOW_ISO},
    }
    items.append(('SAGE_CONFIG', 'Sage 300 People Config', item))

    # Sage Schedules
    schedules = [
        ("EMPLOYEE", "IMPORT", "DAILY", "0 2 * * *"),
        ("DEPARTMENT", "IMPORT", "WEEKLY", "0 3 * * 1"),
        ("LEAVE", "EXPORT", "HOURLY", "0 * * * *"),
    ]
    for entity, direction, frequency, cron in schedules:
        sched_id = deterministic_id(TENANT_ID, 'SAGE_SCHEDULE', f"{config_id}-{entity}")
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'SAGE_SCHEDULE#{sched_id}'},
            'GSI1PK': {'S': f'SAGE_SCHED_CONN#{TENANT_ID}#{config_id}'},
            'GSI1SK': {'S': f'SAGE_SCHEDULE#{sched_id}'},
            'id':             {'S': sched_id},
            'tenantId':       {'S': TENANT_ID},
            'connectorId':    {'S': config_id},
            'entityType':     {'S': entity},
            'direction':      {'S': direction},
            'frequency':      {'S': frequency},
            'cronExpression': {'S': cron},
            'isActive':       {'BOOL': False},
            'lastRunAt':      {'S': ''},
            'nextRunAt':      {'S': ''},
            'createdAt':      {'S': NOW_ISO},
            'updatedAt':      {'S': NOW_ISO},
        }
        items.append(('SAGE_SCHEDULE', f"Schedule: {entity} {direction}", item))

    return items


# ============================================================
# Tenant Record
# ============================================================
def build_tenant_item():
    """Create the tenant record directly in DynamoDB."""
    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'TENANT#{TENANT_ID}'},
        'GSI1PK': {'S': f'TENANT_STATUS#ACTIVE'},
        'GSI1SK': {'S': f'TENANT#{TENANT_ID}'},
        'id':            {'S': TENANT_ID},
        'tenantId':      {'S': TENANT_ID},
        'name':          {'S': 'Shumela Hire Dev'},
        'status':        {'S': 'ACTIVE'},
        'plan':          {'S': 'ENTERPRISE'},
        'maxUsers':      {'N': '100'},
        'contactEmail':  {'S': 'admin@shumelahire.co.za'},
        'contactName':   {'S': 'Arthur Manena'},
        'settings':      {'S': json.dumps({
            "branding": {
                "primaryColor": "#1a56db",
                "secondaryColor": "#1e40af",
                "accentColor": "#3b82f6"
            },
            "companyInfo": {
                "description": "Shumela Hire is an AI-powered HR platform for South African businesses.",
                "industry": "Technology / SaaS",
                "address": "42 Innovation Drive, Johannesburg, GP 2196",
                "website": "https://dev.shumelahire.co.za"
            }
        })},
        'createdAt':     {'S': NOW_ISO},
        'updatedAt':     {'S': NOW_ISO},
    }
    return ('TENANT', 'Shumela Hire Dev', item)


# ============================================================
# Departments
# ============================================================
DEPARTMENTS = [
    {"name": "Engineering", "code": "ENG", "description": "Software engineering, platform development, and DevOps"},
    {"name": "Product", "code": "PROD", "description": "Product management, UX design, and product strategy"},
    {"name": "Sales & Marketing", "code": "SM", "description": "Sales, marketing, business development, and growth"},
    {"name": "Finance", "code": "FIN", "description": "Financial planning, accounting, and payroll"},
    {"name": "Human Resources", "code": "HR", "description": "People operations, talent acquisition, and employee experience"},
    {"name": "Operations", "code": "OPS", "description": "Business operations, customer success, and support"},
]


def build_department_items():
    """Build DynamoDB items for departments."""
    items = []
    for dept in DEPARTMENTS:
        dept_id = deterministic_id(TENANT_ID, 'DEPARTMENT', dept['name'])
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'DEPARTMENT#{dept_id}'},
            'GSI1PK': {'S': 'DEPT_ACTIVE#true'},
            'GSI1SK': {'S': f'DEPARTMENT#{dept["name"]}'},
            'GSI4PK': {'S': f'DEPT_NAME#{TENANT_ID}#{dept["name"]}'},
            'GSI4SK': {'S': f'DEPARTMENT#{dept_id}'},
            'id':          {'S': dept_id},
            'tenantId':    {'S': TENANT_ID},
            'name':        {'S': dept['name']},
            'code':        {'S': dept['code']},
            'description': {'S': dept['description']},
            'isActive':    {'BOOL': True},
            'createdAt':   {'S': NOW_ISO_LOCAL},
            'updatedAt':   {'S': NOW_ISO_LOCAL},
        }
        items.append(('DEPARTMENT', dept['name'], item))
    return items


# ============================================================
# Main
# ============================================================
def main():
    global TENANT_ID

    resolve_table()
    if not TENANT_ID:
        # The TenantResolutionFilter falls back to "default" for dev.shumelahire.co.za
        TENANT_ID = 'default'
        print(f"Using tenant ID: {TENANT_ID}")

    key_bytes = get_encryption_key()
    if not key_bytes:
        print("WARNING: No encryption key found — PII fields will be stored as plaintext", file=sys.stderr)

    print(f"Table:     {TABLE_NAME}")
    print(f"Tenant:    {TENANT_ID}")
    print(f"Region:    {REGION}")
    print(f"Encrypted: {'Yes' if key_bytes else 'No'}")
    print()

    # Collect all items
    all_items = []

    # Tenant record
    all_items.append(build_tenant_item())

    # Departments
    print("Building departments...")
    all_items.extend(build_department_items())

    # Employees
    print("Building employees...")
    for emp in EMPLOYEES:
        eid, item = build_employee_item(emp, key_bytes)
        all_items.append(('EMPLOYEE', f"{emp['firstName']} {emp['lastName']}", item))

    # Users
    print("Building users...")
    for u in USERS:
        uid, item = build_user_item(u)
        all_items.append(('USER', f"{u['firstName']} {u['lastName']}", item))

    # Leave
    print("Building leave types...")
    all_items.extend(build_leave_type_items())
    print("Building leave balances...")
    all_items.extend(build_leave_balance_items())
    print("Building leave requests...")
    all_items.extend(build_leave_request_items())

    # Recruitment
    print("Building recruitment data...")
    all_items.extend(build_recruitment_items(key_bytes))

    # Performance
    print("Building performance data...")
    all_items.extend(build_performance_items())

    # Training
    print("Building training data...")
    all_items.extend(build_training_items())

    # Engagement
    print("Building engagement data...")
    all_items.extend(build_engagement_items())

    # Documents
    print("Building documents...")
    all_items.extend(build_document_items())

    # Onboarding
    print("Building onboarding data...")
    all_items.extend(build_onboarding_items())

    # Shifts
    print("Building shifts...")
    all_items.extend(build_shift_items())

    # Sage
    print("Building Sage integration...")
    all_items.extend(build_sage_items())

    print(f"\nTotal items to seed: {len(all_items)}")
    print()

    # Write all items (overwrites existing)
    created = 0
    failed = 0
    by_type = {}

    for entity_type, label, item in all_items:
        success, err = put_item(item)
        if success:
            created += 1
            by_type[entity_type] = by_type.get(entity_type, 0) + 1
        else:
            print(f"  FAIL [{entity_type}] {label}: {err}", file=sys.stderr)
            failed += 1

    # Summary
    print()
    print("=" * 50)
    print(f"  Written: {created}")
    print(f"  Failed:  {failed}")
    print()
    print("  By entity type:")
    for etype, count in sorted(by_type.items()):
        print(f"    {etype:20s} {count}")
    print("=" * 50)

    # Output tenant ID for use by orchestrator
    print(f"\nTENANT_ID={TENANT_ID}")

    sys.exit(1 if failed > 0 else 0)


if __name__ == '__main__':
    main()
