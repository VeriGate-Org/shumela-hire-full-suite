#!/usr/bin/env python3
"""
Direct DynamoDB employee seeder — bypasses Lambda/API Gateway entirely.

Writes 10 uThukela Water demo employee records directly into DynamoDB
with correct PK/SK, GSI keys, and AES-256-GCM encryption for PII fields.
"""
import json, os, sys, uuid, base64
from datetime import datetime

# AES-256-GCM encryption (same as DataEncryptionService.java)
def encrypt_pii(plaintext, key_bytes):
    if not plaintext:
        return plaintext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = os.urandom(12)
    aesgcm = AESGCM(key_bytes)
    ct = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
    return base64.b64encode(iv + ct).decode('utf-8')


def build_employee_item(emp, tenant_id, key_bytes):
    eid = str(uuid.uuid4())
    now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')
    status = emp.get('status', 'ACTIVE')
    mgr_id = emp.get('reportingManagerId', 'NONE')
    emp_num = emp['employeeNumber']

    item = {
        'PK':    {'S': f'TENANT#{tenant_id}'},
        'SK':    {'S': f'EMPLOYEE#{eid}'},
        # GSI keys
        'GSI1PK': {'S': f'EMP_STATUS#{tenant_id}#{status}'},
        'GSI1SK': {'S': f'EMPLOYEE#{emp["lastName"]}#{emp["firstName"]}'},
        'GSI2PK': {'S': f'EMP_EMAIL#{tenant_id}#{emp["email"]}'},
        'GSI2SK': {'S': f'EMPLOYEE#{eid}'},
        'GSI3PK': {'S': f'EMP_DEPT#{tenant_id}#{emp["department"]}'},
        'GSI3SK': {'S': f'EMPLOYEE#{emp["lastName"]}#{emp["firstName"]}'},
        'GSI4PK': {'S': f'EMP_NUM#{tenant_id}#{emp_num}'},
        'GSI4SK': {'S': f'EMPLOYEE#{eid}'},
        'GSI5PK': {'S': f'EMP_MGR#{tenant_id}#{mgr_id}'},
        'GSI5SK': {'S': f'EMPLOYEE#{emp["lastName"]}#{emp["firstName"]}'},
        'GSI6PK': {'S': f'EMP_HIRE#{tenant_id}'},
        'GSI6SK': {'S': f'{emp["hireDate"]}#{eid}'},
        # Entity fields
        'id':            {'S': eid},
        'tenantId':      {'S': tenant_id},
        'employeeNumber':{'S': emp_num},
        'title':         {'S': emp.get('title', '')},
        'firstName':     {'S': emp['firstName']},
        'lastName':      {'S': emp['lastName']},
        'email':         {'S': emp['email']},
        'phone':         {'S': emp.get('phone', '')},
        'physicalAddress':{'S': emp.get('physicalAddress', '')},
        'postalAddress': {'S': emp.get('postalAddress', '')},
        'city':          {'S': emp.get('city', '')},
        'province':      {'S': emp.get('province', '')},
        'postalCode':    {'S': emp.get('postalCode', '')},
        'country':       {'S': emp.get('country', 'South Africa')},
        'status':        {'S': status},
        'department':    {'S': emp.get('department', '')},
        'division':      {'S': emp.get('division', '')},
        'jobTitle':      {'S': emp.get('jobTitle', '')},
        'jobGrade':      {'S': emp.get('jobGrade', '')},
        'employmentType':{'S': emp.get('employmentType', 'PERMANENT')},
        'hireDate':      {'S': emp['hireDate']},
        'costCentre':    {'S': emp.get('costCentre', '')},
        'location':      {'S': emp.get('location', '')},
        'site':          {'S': emp.get('site', '')},
        'bankName':      {'S': emp.get('bankName', '')},
        'bankBranchCode':{'S': emp.get('bankBranchCode', '')},
        'gender':        {'S': emp.get('gender', '')},
        'race':          {'S': emp.get('race', '')},
        'citizenshipStatus':{'S': emp.get('citizenshipStatus', '')},
        'nationality':   {'S': emp.get('nationality', '')},
        'maritalStatus': {'S': emp.get('maritalStatus', '')},
        'emergencyContactName':        {'S': emp.get('emergencyContactName', '')},
        'emergencyContactPhone':       {'S': emp.get('emergencyContactPhone', '')},
        'emergencyContactRelationship':{'S': emp.get('emergencyContactRelationship', '')},
        'createdAt':     {'S': now},
        'updatedAt':     {'S': now},
    }
    # Optional fields
    if emp.get('preferredName'):
        item['preferredName'] = {'S': emp['preferredName']}
    if emp.get('dateOfBirth'):
        item['dateOfBirth'] = {'S': emp['dateOfBirth']}
    if emp.get('demographicsConsent'):
        item['demographicsConsent'] = {'BOOL': True}
        item['demographicsConsentDate'] = {'S': now}

    # Encrypted PII fields
    for field in ['personalEmail', 'mobilePhone', 'idNumber', 'taxNumber', 'bankAccountNumber']:
        val = emp.get(field)
        if val:
            item[field] = {'S': encrypt_pii(val, key_bytes)}

    return eid, item


EMPLOYEES = [
    {"firstName":"Sipho","lastName":"Ndlovu","email":"sipho.ndlovu@uthukela.shumelahire.co.za","hireDate":"2019-03-01","title":"Mr","preferredName":"Sipho","personalEmail":"sipho.ndlovu@gmail.com","phone":"+27 34 312 1001","mobilePhone":"+27 82 456 7801","dateOfBirth":"1978-06-15","gender":"Male","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Married","idNumber":"7806155123081","taxNumber":"0123456789","bankAccountNumber":"62145678901","bankName":"First National Bank","bankBranchCode":"250655","physicalAddress":"14 Harding Street","postalAddress":"PO Box 1201","city":"Newcastle","province":"KwaZulu-Natal","postalCode":"2940","country":"South Africa","department":"Operations","division":"Water Operations","jobTitle":"Operations Manager","jobGrade":"D3","employmentType":"PERMANENT","costCentre":"OPS-001","location":"Newcastle Head Office","site":"Newcastle","emergencyContactName":"Zanele Ndlovu","emergencyContactPhone":"+27 82 987 6543","emergencyContactRelationship":"Spouse","demographicsConsent":True,"employeeNumber":"UTH-001"},
    {"firstName":"Nomvula","lastName":"Dlamini","email":"nomvula.dlamini@uthukela.shumelahire.co.za","hireDate":"2020-01-15","title":"Ms","personalEmail":"nomvula.d@outlook.com","phone":"+27 34 312 1002","mobilePhone":"+27 83 567 8902","dateOfBirth":"1985-02-20","gender":"Female","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Single","idNumber":"8502200234082","taxNumber":"0234567890","bankAccountNumber":"62245678902","bankName":"Standard Bank","bankBranchCode":"051001","physicalAddress":"22 Scott Street","city":"Ladysmith","province":"KwaZulu-Natal","postalCode":"3370","department":"Corporate Services","division":"Human Resources","jobTitle":"HR Manager","jobGrade":"D2","employmentType":"PERMANENT","costCentre":"HR-001","location":"Ladysmith Office","site":"Ladysmith","emergencyContactName":"Thabo Dlamini","emergencyContactPhone":"+27 83 111 2222","emergencyContactRelationship":"Brother","demographicsConsent":True,"employeeNumber":"UTH-002"},
    {"firstName":"Thabo","lastName":"Khumalo","email":"thabo.khumalo@uthukela.shumelahire.co.za","hireDate":"2018-07-01","title":"Mr","personalEmail":"thabo.k@gmail.com","phone":"+27 34 312 1003","mobilePhone":"+27 82 678 9003","dateOfBirth":"1980-11-10","gender":"Male","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Married","idNumber":"8011105123083","taxNumber":"0345678901","bankAccountNumber":"62345678903","bankName":"Nedbank","bankBranchCode":"198765","physicalAddress":"5 Main Road","city":"Newcastle","province":"KwaZulu-Natal","postalCode":"2940","department":"Technical Services","division":"Civil Engineering","jobTitle":"Senior Civil Engineer","jobGrade":"D3","employmentType":"PERMANENT","costCentre":"ENG-001","location":"Newcastle Head Office","site":"Newcastle","emergencyContactName":"Nomzamo Khumalo","emergencyContactPhone":"+27 82 333 4444","emergencyContactRelationship":"Spouse","demographicsConsent":True,"employeeNumber":"UTH-003"},
    {"firstName":"Pieter","lastName":"van der Merwe","email":"pieter.vdm@uthukela.shumelahire.co.za","hireDate":"2021-04-01","title":"Mr","personalEmail":"pieter.vdm@gmail.com","phone":"+27 34 312 1004","mobilePhone":"+27 84 789 0104","dateOfBirth":"1982-08-25","gender":"Male","race":"White","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Married","idNumber":"8208255123084","taxNumber":"0456789012","bankAccountNumber":"62445678904","bankName":"ABSA","bankBranchCode":"632005","physicalAddress":"10 Church Street","city":"Newcastle","province":"KwaZulu-Natal","postalCode":"2940","department":"Finance","division":"Financial Management","jobTitle":"Finance Manager","jobGrade":"D2","employmentType":"PERMANENT","costCentre":"FIN-001","location":"Newcastle Head Office","site":"Newcastle","emergencyContactName":"Annelie van der Merwe","emergencyContactPhone":"+27 84 555 6666","emergencyContactRelationship":"Spouse","demographicsConsent":True,"employeeNumber":"UTH-004"},
    {"firstName":"Lindiwe","lastName":"Ngcobo","email":"lindiwe.ngcobo@uthukela.shumelahire.co.za","hireDate":"2019-09-01","title":"Ms","personalEmail":"lindiwe.n@yahoo.com","phone":"+27 34 312 1005","mobilePhone":"+27 82 890 1205","dateOfBirth":"1990-04-12","gender":"Female","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Single","idNumber":"9004120234085","taxNumber":"0567890123","bankAccountNumber":"62545678905","bankName":"Capitec","bankBranchCode":"470010","physicalAddress":"8 King Street","city":"Estcourt","province":"KwaZulu-Natal","postalCode":"3310","department":"Water Services","division":"Water Treatment","jobTitle":"Water Process Controller","jobGrade":"C3","employmentType":"PERMANENT","costCentre":"WTR-001","location":"Estcourt Treatment Works","site":"Estcourt","emergencyContactName":"Siphiwe Ngcobo","emergencyContactPhone":"+27 82 777 8888","emergencyContactRelationship":"Mother","demographicsConsent":True,"employeeNumber":"UTH-005"},
    {"firstName":"Bongani","lastName":"Zulu","email":"bongani.zulu@uthukela.shumelahire.co.za","hireDate":"2022-02-01","title":"Mr","personalEmail":"bongani.z@gmail.com","phone":"+27 34 312 1006","mobilePhone":"+27 83 901 2306","dateOfBirth":"1988-12-05","gender":"Male","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Married","idNumber":"8812055123086","taxNumber":"0678901234","bankAccountNumber":"62645678906","bankName":"First National Bank","bankBranchCode":"250655","physicalAddress":"15 Long Street","city":"Newcastle","province":"KwaZulu-Natal","postalCode":"2940","department":"Corporate Services","division":"Information Technology","jobTitle":"ICT Systems Administrator","jobGrade":"C2","employmentType":"PERMANENT","costCentre":"ICT-001","location":"Newcastle Head Office","site":"Newcastle","emergencyContactName":"Thandi Zulu","emergencyContactPhone":"+27 83 999 0000","emergencyContactRelationship":"Spouse","demographicsConsent":True,"employeeNumber":"UTH-006"},
    {"firstName":"Ayanda","lastName":"Mkhize","email":"ayanda.mkhize@uthukela.shumelahire.co.za","hireDate":"2020-06-15","title":"Ms","personalEmail":"ayanda.m@outlook.com","phone":"+27 34 312 1007","mobilePhone":"+27 82 012 3407","dateOfBirth":"1992-07-30","gender":"Female","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Single","idNumber":"9207300234087","taxNumber":"0789012345","bankAccountNumber":"62745678907","bankName":"Standard Bank","bankBranchCode":"051001","physicalAddress":"3 Hospital Road","city":"Ladysmith","province":"KwaZulu-Natal","postalCode":"3370","department":"Community Services","division":"Public Participation","jobTitle":"Community Liaison Officer","jobGrade":"C1","employmentType":"PERMANENT","costCentre":"COM-001","location":"Ladysmith Office","site":"Ladysmith","emergencyContactName":"Nkosazana Mkhize","emergencyContactPhone":"+27 82 111 3333","emergencyContactRelationship":"Sister","demographicsConsent":True,"employeeNumber":"UTH-007"},
    {"firstName":"Johan","lastName":"Pretorius","email":"johan.pretorius@uthukela.shumelahire.co.za","hireDate":"2017-11-01","title":"Mr","personalEmail":"johan.p@telkomsa.net","phone":"+27 34 312 1008","mobilePhone":"+27 84 123 4508","dateOfBirth":"1975-03-18","gender":"Male","race":"White","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Married","idNumber":"7503185123088","taxNumber":"0890123456","bankAccountNumber":"62845678908","bankName":"ABSA","bankBranchCode":"632005","physicalAddress":"25 Voortrekker Street","city":"Newcastle","province":"KwaZulu-Natal","postalCode":"2940","department":"Operations","division":"Maintenance","jobTitle":"Maintenance Supervisor","jobGrade":"C3","employmentType":"PERMANENT","costCentre":"MNT-001","location":"Newcastle Depot","site":"Newcastle","emergencyContactName":"Marie Pretorius","emergencyContactPhone":"+27 84 444 5555","emergencyContactRelationship":"Spouse","demographicsConsent":True,"employeeNumber":"UTH-008"},
    {"firstName":"Zanele","lastName":"Mthembu","email":"zanele.mthembu@uthukela.shumelahire.co.za","hireDate":"2021-08-01","title":"Ms","personalEmail":"zanele.m@gmail.com","phone":"+27 34 312 1009","mobilePhone":"+27 82 234 5609","dateOfBirth":"1991-09-22","gender":"Female","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Single","idNumber":"9109220234089","taxNumber":"0901234567","bankAccountNumber":"62945678909","bankName":"Capitec","bankBranchCode":"470010","physicalAddress":"12 Market Street","city":"Newcastle","province":"KwaZulu-Natal","postalCode":"2940","department":"Finance","division":"Supply Chain","jobTitle":"Supply Chain Officer","jobGrade":"C1","employmentType":"PERMANENT","costCentre":"SCM-001","location":"Newcastle Head Office","site":"Newcastle","emergencyContactName":"Sibusiso Mthembu","emergencyContactPhone":"+27 82 666 7777","emergencyContactRelationship":"Father","demographicsConsent":True,"employeeNumber":"UTH-009"},
    {"firstName":"Mandla","lastName":"Shabalala","email":"mandla.shabalala@uthukela.shumelahire.co.za","hireDate":"2022-01-10","title":"Mr","personalEmail":"mandla.s@gmail.com","phone":"+27 34 312 1010","mobilePhone":"+27 83 345 6710","dateOfBirth":"1993-01-08","gender":"Male","race":"African","citizenshipStatus":"South African","nationality":"South African","maritalStatus":"Single","idNumber":"9301085123090","taxNumber":"1012345678","bankAccountNumber":"63045678910","bankName":"Nedbank","bankBranchCode":"198765","physicalAddress":"7 River Road","city":"Estcourt","province":"KwaZulu-Natal","postalCode":"3310","department":"Water Services","division":"Water Quality","jobTitle":"Water Quality Technician","jobGrade":"B3","employmentType":"PERMANENT","costCentre":"WQL-001","location":"Estcourt Treatment Works","site":"Estcourt","emergencyContactName":"Themba Shabalala","emergencyContactPhone":"+27 83 888 9999","emergencyContactRelationship":"Brother","demographicsConsent":True,"employeeNumber":"UTH-010"},
]


def main():
    import subprocess

    region = os.environ.get('AWS_REGION', 'af-south-1')
    table_name = os.environ.get('DYNAMODB_TABLE_NAME', '')
    tenant_id = os.environ.get('TENANT_ID', 'uthukela')
    enc_key_arn = os.environ.get('ENCRYPTION_KEY_ARN', '')

    if not table_name:
        # Resolve from CDK stack
        prefix = os.environ.get('STACK_PREFIX', 'shumelahire-dev')
        result = subprocess.run(
            ['aws', 'cloudformation', 'describe-stacks',
             '--stack-name', f'{prefix}-serverless',
             '--region', region,
             '--query', 'Stacks[0].Outputs[?OutputKey==`DataTableName`].OutputValue',
             '--output', 'text'],
            capture_output=True, text=True)
        table_name = result.stdout.strip()
        if not table_name or table_name == 'None':
            print("ERROR: Could not resolve DynamoDB table name", file=sys.stderr)
            sys.exit(1)

    # Get encryption key from Secrets Manager
    if not enc_key_arn:
        enc_key_arn = f'shumelahire/dev/encryption-key'
    result = subprocess.run(
        ['aws', 'secretsmanager', 'get-secret-value',
         '--secret-id', enc_key_arn,
         '--region', region,
         '--query', 'SecretString',
         '--output', 'text'],
        capture_output=True, text=True)
    enc_key_b64 = result.stdout.strip()
    if not enc_key_b64:
        print("ERROR: Could not read encryption key", file=sys.stderr)
        sys.exit(1)
    key_bytes = base64.b64decode(enc_key_b64)

    print(f"Table:  {table_name}")
    print(f"Tenant: {tenant_id}")
    print(f"Region: {region}")
    print(f"Employees: {len(EMPLOYEES)}")
    print()

    created = 0
    failed = 0
    for emp in EMPLOYEES:
        name = f"{emp['firstName']} {emp['lastName']}"
        try:
            eid, item = build_employee_item(emp, tenant_id, key_bytes)
            # Write to DynamoDB
            result = subprocess.run(
                ['aws', 'dynamodb', 'put-item',
                 '--table-name', table_name,
                 '--region', region,
                 '--condition-expression', 'attribute_not_exists(PK)',
                 '--item', json.dumps(item)],
                capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  OK  Employee #{eid[:8]}: {name}")
                created += 1
            elif 'ConditionalCheckFailedException' in result.stderr:
                print(f"  SKIP {name} (already exists)")
                created += 1  # Count as success
            else:
                print(f"  FAIL {name}: {result.stderr.strip()}", file=sys.stderr)
                failed += 1
        except Exception as e:
            print(f"  FAIL {name}: {e}", file=sys.stderr)
            failed += 1

    print()
    print(f"Done: {created} created, {failed} failed")
    sys.exit(1 if failed > 0 else 0)


if __name__ == '__main__':
    main()
