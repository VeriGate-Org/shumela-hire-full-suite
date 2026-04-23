#!/usr/bin/env python3
"""
Direct DynamoDB seeder — custom field definitions and values for uThukela Water.
Defines water-utility-specific custom fields for employee records.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')


def new_id(unique_key):
    seed = f"{TENANT_ID}:CUSTOM_FIELD:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))


def emp_id(emp_number):
    seed = f"{TENANT_ID}:EMPLOYEE:{emp_number}"
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


# ── Custom Field Definitions ──────────────────────────────────────
FIELDS = [
    {"key": "water-license", "fieldName": "waterOperatorLicenseType", "fieldLabel": "Water Operator License Type",
     "entityType": "EMPLOYEE", "dataType": "SELECT",
     "options": "None,Class I,Class II,Class III,Class IV",
     "defaultValue": "None", "helpText": "DWS water process controller classification level",
     "isRequired": "false", "displayOrder": 1},
    {"key": "watercare-cert", "fieldName": "waterCareCertificationLevel", "fieldLabel": "WaterCare Certification Level",
     "entityType": "EMPLOYEE", "dataType": "SELECT",
     "options": "None,Basic,Intermediate,Advanced,Master",
     "defaultValue": "None", "helpText": "WaterCare Institute SA certification level",
     "isRequired": "false", "displayOrder": 2},
    {"key": "assigned-vehicle", "fieldName": "assignedVehicle", "fieldLabel": "Assigned Vehicle",
     "entityType": "EMPLOYEE", "dataType": "TEXT",
     "options": "", "defaultValue": "", "helpText": "Municipal vehicle registration number if assigned",
     "isRequired": "false", "displayOrder": 3},
    {"key": "safety-clearance", "fieldName": "safetyClearanceDate", "fieldLabel": "Safety Clearance Date",
     "entityType": "EMPLOYEE", "dataType": "DATE",
     "options": "", "defaultValue": "", "helpText": "Date of last OHS safety clearance assessment",
     "isRequired": "false", "displayOrder": 4},
    {"key": "emergency-trained", "fieldName": "emergencyResponseTrained", "fieldLabel": "Emergency Response Trained",
     "entityType": "EMPLOYEE", "dataType": "CHECKBOX",
     "options": "", "defaultValue": "false", "helpText": "Has the employee completed emergency response training?",
     "isRequired": "false", "displayOrder": 5},
    {"key": "ward-assignment", "fieldName": "wardAssignment", "fieldLabel": "Ward Assignment",
     "entityType": "EMPLOYEE", "dataType": "SELECT",
     "options": "Ward 1 - Estcourt\nWard 2 - Weenen\nWard 3 - Colenso\nWard 4 - Loskop\nWard 5 - Ntabamhlophe\nWard 6 - Ematsheni\nWard 7 - Cornfields\nWard 8 - Wembezi",
     "defaultValue": "", "helpText": "Municipal ward the employee is assigned to",
     "isRequired": "false", "displayOrder": 6},
    {"key": "water-scheme-zone", "fieldName": "waterSchemeZone", "fieldLabel": "Water Scheme Zone",
     "entityType": "EMPLOYEE", "dataType": "SELECT",
     "options": "Zone A - Central Distribution\nZone B - Northern Pipeline\nZone C - Southern Reservoir\nZone D - Eastern Bulk Supply\nZone E - Western Treatment Works",
     "defaultValue": "", "helpText": "Water supply scheme zone the employee operates in",
     "isRequired": "false", "displayOrder": 7},
    {"key": "mfma-code", "fieldName": "mfmaComplianceCode", "fieldLabel": "MFMA Compliance Code",
     "entityType": "EMPLOYEE", "dataType": "TEXT",
     "options": "", "defaultValue": "", "helpText": "Municipal Finance Management Act compliance classification code",
     "isRequired": "false", "displayOrder": 8},
]


def seed_fields():
    print("Seeding custom field definitions...")
    field_ids = {}
    ok = fail = 0
    for f in FIELDS:
        fid = new_id(f['key'])
        field_ids[f['key']] = fid
        padded_order = str(f['displayOrder']).zfill(10)
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'CUSTOM_FIELD#{fid}'},
            'GSI1PK':    {'S': f'CF_ENTITY_TYPE#{f["entityType"]}_ACTIVE#true'},
            'GSI1SK':    {'S': f'CF_ORDER#{padded_order}#{fid}'},
            'GSI4PK':    {'S': f'CF_UNIQUE#{f["entityType"]}#{f["fieldName"]}'},
            'GSI4SK':    {'S': f'CUSTOM_FIELD#{fid}'},
            'id':        {'S': fid},
            'tenantId':  {'S': TENANT_ID},
            'fieldName': {'S': f['fieldName']},
            'fieldLabel': {'S': f['fieldLabel']},
            'entityType': {'S': f['entityType']},
            'dataType':  {'S': f['dataType']},
            'isRequired': {'S': f['isRequired']},
            'isActive':  {'S': 'true'},
            'displayOrder': {'N': str(f['displayOrder'])},
            'options':   {'S': f['options']},
            'defaultValue': {'S': f['defaultValue']},
            'validationRegex': {'S': ''},
            'helpText':  {'S': f['helpText']},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Field: {f['fieldLabel']}")
            ok += 1
        else:
            print(f"  FAIL Field {f['fieldLabel']}: {err}", file=sys.stderr)
            fail += 1
    return field_ids, ok, fail


# ── Custom Field Values ──────────────────────────────────────────
# 4 values per field across applicable employees
VALUES = [
    # Water Operator License Type
    {"field": "water-license", "empNum": "UTH-005", "value": "Class III"},
    {"field": "water-license", "empNum": "UTH-010", "value": "Class II"},
    {"field": "water-license", "empNum": "UTH-001", "value": "Class I"},
    {"field": "water-license", "empNum": "UTH-008", "value": "Class II"},
    # WaterCare Certification Level
    {"field": "watercare-cert", "empNum": "UTH-005", "value": "Advanced"},
    {"field": "watercare-cert", "empNum": "UTH-010", "value": "Intermediate"},
    {"field": "watercare-cert", "empNum": "UTH-003", "value": "Basic"},
    {"field": "watercare-cert", "empNum": "UTH-001", "value": "Intermediate"},
    # Assigned Vehicle
    {"field": "assigned-vehicle", "empNum": "UTH-001", "value": "ND 123-456"},
    {"field": "assigned-vehicle", "empNum": "UTH-003", "value": "ND 789-012"},
    {"field": "assigned-vehicle", "empNum": "UTH-008", "value": "ND 345-678"},
    {"field": "assigned-vehicle", "empNum": "UTH-007", "value": "ND 901-234"},
    # Safety Clearance Date
    {"field": "safety-clearance", "empNum": "UTH-005", "value": "2026-01-15"},
    {"field": "safety-clearance", "empNum": "UTH-010", "value": "2025-11-20"},
    {"field": "safety-clearance", "empNum": "UTH-008", "value": "2026-02-28"},
    {"field": "safety-clearance", "empNum": "UTH-001", "value": "2025-12-10"},
    # Emergency Response Trained
    {"field": "emergency-trained", "empNum": "UTH-005", "value": "true"},
    {"field": "emergency-trained", "empNum": "UTH-010", "value": "true"},
    {"field": "emergency-trained", "empNum": "UTH-008", "value": "true"},
    {"field": "emergency-trained", "empNum": "UTH-001", "value": "true"},
    # Ward Assignment
    {"field": "ward-assignment", "empNum": "UTH-001", "value": "Ward 1 - Estcourt"},
    {"field": "ward-assignment", "empNum": "UTH-003", "value": "Ward 3 - Colenso"},
    {"field": "ward-assignment", "empNum": "UTH-005", "value": "Ward 2 - Weenen"},
    {"field": "ward-assignment", "empNum": "UTH-008", "value": "Ward 5 - Ntabamhlophe"},
    {"field": "ward-assignment", "empNum": "UTH-010", "value": "Ward 4 - Loskop"},
    # Water Scheme Zone
    {"field": "water-scheme-zone", "empNum": "UTH-001", "value": "Zone A - Central Distribution"},
    {"field": "water-scheme-zone", "empNum": "UTH-003", "value": "Zone C - Southern Reservoir"},
    {"field": "water-scheme-zone", "empNum": "UTH-005", "value": "Zone D - Eastern Bulk Supply"},
    {"field": "water-scheme-zone", "empNum": "UTH-008", "value": "Zone B - Northern Pipeline"},
    {"field": "water-scheme-zone", "empNum": "UTH-010", "value": "Zone E - Western Treatment Works"},
    # MFMA Compliance Code
    {"field": "mfma-code", "empNum": "UTH-001", "value": "MFMA-S57-A"},
    {"field": "mfma-code", "empNum": "UTH-003", "value": "MFMA-S56-B"},
    {"field": "mfma-code", "empNum": "UTH-005", "value": "MFMA-S56-C"},
    {"field": "mfma-code", "empNum": "UTH-008", "value": "MFMA-S57-B"},
    {"field": "mfma-code", "empNum": "UTH-010", "value": "MFMA-S56-A"},
]


def seed_values(field_ids):
    print("Seeding custom field values...")
    ok = fail = 0
    for i, v in enumerate(VALUES):
        vid = new_id(f"cfv-{v['field']}-{v['empNum']}")
        cf_id = field_ids.get(v['field'], '')
        eid = emp_id(v['empNum'])
        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'CF_VALUE#{vid}'},
            'GSI2PK':    {'S': f'CFV_ENTITY#EMPLOYEE#{eid}'},
            'GSI2SK':    {'S': f'CF_VALUE#{cf_id}'},
            'id':        {'S': vid},
            'tenantId':  {'S': TENANT_ID},
            'customFieldId': {'S': cf_id},
            'entityId':  {'S': eid},
            'entityType': {'S': 'EMPLOYEE'},
            'fieldValue': {'S': v['value']},
            'createdAt': {'S': now_iso},
            'updatedAt': {'S': now_iso},
        }
        success, err = put_item(item)
        if success:
            ok += 1
        else:
            print(f"  FAIL Value {v['field']}/{v['empNum']}: {err}", file=sys.stderr)
            fail += 1
    print(f"  OK  {ok} values seeded")
    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    total_ok = total_fail = 0

    field_ids, ok, fail = seed_fields()
    total_ok += ok; total_fail += fail

    ok, fail = seed_values(field_ids)
    total_ok += ok; total_fail += fail

    print(f"\nDone: {total_ok} created, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
