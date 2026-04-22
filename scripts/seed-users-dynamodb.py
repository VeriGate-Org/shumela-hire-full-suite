#!/usr/bin/env python3
"""
Direct DynamoDB user seeder — creates User records that bridge Cognito → Employee.

Without these records, the auth chain breaks: Cognito JWT → UserInfoController
calls userRepository.findByEmail(email) → returns null → no employeeId.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S')


def new_id(unique_key):
    seed = f"{TENANT_ID}:USER:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def put_item(item):
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME,
         '--region', REGION,
         '--condition-expression', 'attribute_not_exists(PK)',
         '--item', json.dumps(item)],
        capture_output=True, text=True)
    if result.returncode != 0 and 'ConditionalCheckFailedException' not in result.stderr:
        return False, result.stderr.strip()
    return True, ''


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


# Cognito email → Employee mapping
USERS = [
    {
        "email": "admin@uthukela.shumelahire.co.za",
        "username": "admin@uthukela.shumelahire.co.za",
        "firstName": "Sipho",
        "lastName": "Ndlovu",
        "role": "ADMIN",
        "jobTitle": "Operations Manager",
        "department": "Operations",
        "location": "Newcastle Head Office",
    },
    {
        "email": "hr.manager@uthukela.shumelahire.co.za",
        "username": "hr.manager@uthukela.shumelahire.co.za",
        "firstName": "Nomvula",
        "lastName": "Dlamini",
        "role": "HR_MANAGER",
        "jobTitle": "HR Manager",
        "department": "Corporate Services",
        "location": "Ladysmith Office",
    },
    {
        "email": "hiring.manager@uthukela.shumelahire.co.za",
        "username": "hiring.manager@uthukela.shumelahire.co.za",
        "firstName": "Thabo",
        "lastName": "Khumalo",
        "role": "HIRING_MANAGER",
        "jobTitle": "Senior Civil Engineer",
        "department": "Technical Services",
        "location": "Newcastle Head Office",
    },
    {
        "email": "employee@uthukela.shumelahire.co.za",
        "username": "employee@uthukela.shumelahire.co.za",
        "firstName": "Lindiwe",
        "lastName": "Ngcobo",
        "role": "EMPLOYEE",
        "jobTitle": "Water Process Controller",
        "department": "Water Services",
        "location": "Estcourt Treatment Works",
    },
    {
        "email": "interviewer@uthukela.shumelahire.co.za",
        "username": "interviewer@uthukela.shumelahire.co.za",
        "firstName": "Bongani",
        "lastName": "Zulu",
        "role": "INTERVIEWER",
        "jobTitle": "ICT Systems Administrator",
        "department": "Corporate Services",
        "location": "Newcastle Head Office",
    },
    {
        "email": "applicant@uthukela.shumelahire.co.za",
        "username": "applicant@uthukela.shumelahire.co.za",
        "firstName": "Ayanda",
        "lastName": "Mkhize",
        "role": "APPLICANT",
        "jobTitle": "Community Liaison Officer",
        "department": "Community Services",
        "location": "Ladysmith Office",
    },
    {
        "email": "recruiter@uthukela.shumelahire.co.za",
        "username": "recruiter@uthukela.shumelahire.co.za",
        "firstName": "Zanele",
        "lastName": "Mthembu",
        "role": "RECRUITER",
        "jobTitle": "Supply Chain Officer",
        "department": "Finance",
        "location": "Newcastle Head Office",
    },
    {
        "email": "executive@uthukela.shumelahire.co.za",
        "username": "executive@uthukela.shumelahire.co.za",
        "firstName": "Mandla",
        "lastName": "Shabalala",
        "role": "EXECUTIVE",
        "jobTitle": "Water Quality Technician",
        "department": "Water Services",
        "location": "Estcourt Treatment Works",
    },
]


def seed_users():
    print("Seeding User records...")
    ok = 0
    fail = 0

    for u in USERS:
        uid = new_id(u['email'])
        item = {
            'PK':     {'S': f'TENANT#{TENANT_ID}'},
            'SK':     {'S': f'USER#{uid}'},
            'GSI1PK': {'S': f'USER_ROLE#{u["role"]}'},
            'GSI1SK': {'S': f'USER#{now_iso}'},
            'GSI4PK': {'S': f'USER_USERNAME#{u["username"]}'},
            'GSI4SK': {'S': f'USER#{uid}'},
            'GSI5PK': {'S': f'USER_EMAIL#{u["email"]}'},
            'GSI5SK': {'S': f'USER#{uid}'},
            'GSI6PK': {'S': f'USER_CREATED#{TENANT_ID}'},
            'GSI6SK': {'S': f'USER#{now_iso}'},
            'id':                    {'S': uid},
            'tenantId':              {'S': TENANT_ID},
            'username':              {'S': u['username']},
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
            'createdAt':             {'S': now_iso},
            'updatedAt':             {'S': now_iso},
        }

        success, err = put_item(item)
        name = f"{u['firstName']} {u['lastName']}"
        if success:
            print(f"  OK  User {name} ({u['role']})")
            ok += 1
        else:
            print(f"  FAIL User {name}: {err}", file=sys.stderr)
            fail += 1

    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    ok, fail = seed_users()
    print(f"\nDone: {ok} created, {fail} failed")
    sys.exit(1 if fail > 0 else 0)


if __name__ == '__main__':
    main()
