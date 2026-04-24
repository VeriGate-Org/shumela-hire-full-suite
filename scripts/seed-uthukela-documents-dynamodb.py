#!/usr/bin/env python3
"""
Direct DynamoDB seeder — employee documents for Lindiwe Ngcobo (UTH-005)
at uThukela Water. Seeds all 19 document types with realistic South African
water utility context, plus a few extras for variety.
"""
import json, os, sys, uuid, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')


def doc_id(unique_key):
    seed = f"{TENANT_ID}:EMPDOC:{unique_key}"
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


def date_ago(days):
    return (now - timedelta(days=days)).strftime('%Y-%m-%d')


def dt_ago(days):
    return (now - timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S')


def date_ahead(days):
    return (now + timedelta(days=days)).strftime('%Y-%m-%d')


def dt_ahead(days):
    return (now + timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S')


# ── Employee: Lindiwe Ngcobo (UTH-005, Water Process Controller) ──────

EMPLOYEE_ID = emp_id("UTH-005")
LINDIWE_EMAIL = "employee@uthukela.shumelahire.co.za"

# All 19 document types + 3 extras for variety = 22 documents
DOCUMENTS = [
    # ── Core Identity Documents ──
    {
        "key": "lindiwe-id-doc",
        "type": "ID_DOCUMENT",
        "title": "South African National Identity Document",
        "description": "Certified copy of SA ID Book (Green Barcoded). ID Number: 9203150XXXX086.",
        "filename": "lindiwe-ngcobo-sa-id-document.pdf",
        "contentType": "application/pdf",
        "fileSize": 1245678,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 730,
    },
    {
        "key": "lindiwe-passport",
        "type": "PASSPORT",
        "title": "South African Passport",
        "description": "Republic of South Africa Machine-Readable Passport. Passport No: A09XXXXXX.",
        "filename": "lindiwe-ngcobo-passport.pdf",
        "contentType": "application/pdf",
        "fileSize": 2145890,
        "version": 1,
        "expiryDate": "2029-03-15",
        "createdDaysAgo": 540,
    },
    {
        "key": "lindiwe-work-permit",
        "type": "WORK_PERMIT",
        "title": "SA Citizen Employment Eligibility Declaration",
        "description": "Declaration confirming South African citizenship and eligibility for employment. No work permit required.",
        "filename": "employment-eligibility-declaration.pdf",
        "contentType": "application/pdf",
        "fileSize": 312456,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 730,
    },

    # ── Tax & Financial ──
    {
        "key": "lindiwe-tax-cert",
        "type": "TAX_CERTIFICATE",
        "title": "SARS Tax Compliance Status (TCS) 2025/2026",
        "description": "South African Revenue Service Tax Compliance Status Pin certificate. Valid for 12 months from issue date.",
        "filename": "sars-tcs-pin-2025-2026.pdf",
        "contentType": "application/pdf",
        "fileSize": 534210,
        "version": 1,
        "expiryDate": date_ahead(22),  # Expiring soon!
        "createdDaysAgo": 340,
    },
    {
        "key": "lindiwe-banking",
        "type": "BANKING_DETAILS",
        "title": "FNB Banking Confirmation Letter",
        "description": "First National Bank account confirmation letter for salary deposits. Cheque account ending 6742.",
        "filename": "fnb-banking-confirmation-letter.pdf",
        "contentType": "application/pdf",
        "fileSize": 289340,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 730,
    },

    # ── Employment Documents ──
    {
        "key": "lindiwe-contract",
        "type": "CONTRACT",
        "title": "Employment Contract - Water Services Department",
        "description": "Permanent employment contract for Water Process Controller position at uThukela Water, Estcourt Treatment Works.",
        "filename": "employment-contract-uthukela-water.pdf",
        "contentType": "application/pdf",
        "fileSize": 1876543,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 730,
        "eSignatureStatus": "completed",
        "eSignatureCompletedDaysAgo": 728,
        "eSignatureSentDaysAgo": 730,
    },
    {
        "key": "lindiwe-offer",
        "type": "OFFER_LETTER",
        "title": "Offer of Employment - Water Process Controller",
        "description": "Original offer letter for the position of Water Process Controller Level 4 at uThukela Water.",
        "filename": "offer-letter-uthukela-water.pdf",
        "contentType": "application/pdf",
        "fileSize": 945210,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 745,
        "eSignatureStatus": "completed",
        "eSignatureCompletedDaysAgo": 740,
        "eSignatureSentDaysAgo": 745,
    },
    {
        "key": "lindiwe-nda",
        "type": "NDA",
        "title": "Non-Disclosure Agreement - Water Treatment Processes",
        "description": "Confidentiality agreement covering proprietary water treatment methodologies, chemical dosing formulas, and infrastructure security details.",
        "filename": "nda-water-treatment-processes.pdf",
        "contentType": "application/pdf",
        "fileSize": 623890,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 25,
        "eSignatureStatus": "sent",
        "eSignatureSentDaysAgo": 25,
    },

    # ── Qualifications & Training ──
    {
        "key": "lindiwe-qualification-wpc",
        "type": "QUALIFICATION",
        "title": "National Diploma: Water Process Controller Level 4",
        "description": "National Qualification issued by the Water Institute of Southern Africa (WISA). Qualification ID: SAQA 57883.",
        "filename": "qualification-water-process-controller-level4.pdf",
        "contentType": "application/pdf",
        "fileSize": 3245670,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 730,
    },
    {
        "key": "lindiwe-training-chemical",
        "type": "TRAINING_CERTIFICATE",
        "title": "Chemical Handling & Safety Certificate",
        "description": "SABS-accredited certificate for safe handling of water treatment chemicals including chlorine gas, sodium hypochlorite, and aluminium sulphate.",
        "filename": "chemical-handling-safety-certificate.pdf",
        "contentType": "application/pdf",
        "fileSize": 712340,
        "version": 2,
        "expiryDate": "2027-06-30",
        "createdDaysAgo": 180,
    },
    {
        "key": "lindiwe-training-fire",
        "type": "TRAINING_CERTIFICATE",
        "title": "Fire Safety & Emergency Evacuation Certificate",
        "description": "Annual fire safety and emergency evacuation training completed at Estcourt Treatment Works. Includes practical firefighting drill.",
        "filename": "fire-safety-evacuation-certificate.pdf",
        "contentType": "application/pdf",
        "fileSize": 534210,
        "version": 1,
        "expiryDate": date_ahead(12),  # Expiring soon!
        "createdDaysAgo": 355,
    },

    # ── Health & Safety ──
    {
        "key": "lindiwe-medical",
        "type": "MEDICAL",
        "title": "Occupational Health Medical Fitness Certificate",
        "description": "Annual occupational medical examination as per OHS Act Section 12. Includes lung function, audiometry, and biological monitoring for chemical exposure.",
        "filename": "occupational-medical-fitness-certificate.pdf",
        "contentType": "application/pdf",
        "fileSize": 1123456,
        "version": 1,
        "expiryDate": date_ago(40),  # EXPIRED!
        "createdDaysAgo": 405,
    },

    # ── Performance ──
    {
        "key": "lindiwe-perf-2024",
        "type": "PERFORMANCE_REVIEW",
        "title": "Annual Performance Review 2024/2025",
        "description": "Performance assessment for FY2024/25. Overall rating: Exceeds Expectations. Key achievement: 99.7% water quality compliance rate.",
        "filename": "performance-review-2024-2025.pdf",
        "contentType": "application/pdf",
        "fileSize": 1534210,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 75,
    },
    {
        "key": "lindiwe-perf-2023",
        "type": "PERFORMANCE_REVIEW",
        "title": "Annual Performance Review 2023/2024",
        "description": "Performance assessment for FY2023/24. Overall rating: Meets Expectations. Completed chemical handling re-certification ahead of schedule.",
        "filename": "performance-review-2023-2024.pdf",
        "contentType": "application/pdf",
        "fileSize": 1389000,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 440,
    },

    # ── Disciplinary ──
    {
        "key": "lindiwe-disciplinary",
        "type": "DISCIPLINARY",
        "title": "Counselling Record - PPE Compliance Reminder",
        "description": "Verbal counselling regarding consistent use of personal protective equipment in chemical storage area. Non-punitive reminder.",
        "filename": "counselling-record-ppe-compliance.pdf",
        "contentType": "application/pdf",
        "fileSize": 423560,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 210,
    },

    # ── Address & Verification ──
    {
        "key": "lindiwe-address",
        "type": "PROOF_OF_ADDRESS",
        "title": "uThukela Municipal Rates Account",
        "description": "uThukela Local Municipality rates and services account confirming residential address in Estcourt, KwaZulu-Natal.",
        "filename": "uthukela-municipal-rates-account.pdf",
        "contentType": "application/pdf",
        "fileSize": 845230,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 120,
    },
    {
        "key": "lindiwe-clearance",
        "type": "CLEARANCE",
        "title": "SAPS Police Clearance Certificate",
        "description": "South African Police Service clearance certificate confirming no criminal record. Required for access to critical water infrastructure.",
        "filename": "saps-police-clearance-certificate.pdf",
        "contentType": "application/pdf",
        "fileSize": 912340,
        "version": 1,
        "expiryDate": date_ahead(18),  # Expiring soon!
        "createdDaysAgo": 350,
    },

    # ── Benefits ──
    {
        "key": "lindiwe-benefits",
        "type": "BENEFITS_ENROLLMENT",
        "title": "Discovery Health Medical Aid Enrollment",
        "description": "Discovery Health KeyCare Plus plan enrollment. Principal member with 2 dependants. Effective from date of employment.",
        "filename": "discovery-medical-aid-enrollment.pdf",
        "contentType": "application/pdf",
        "fileSize": 534210,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 730,
    },

    # ── Previous Employment Records ──
    {
        "key": "lindiwe-resignation",
        "type": "RESIGNATION_LETTER",
        "title": "Resignation Letter - eThekwini Water & Sanitation",
        "description": "Copy of resignation letter from previous employer eThekwini Municipality Water & Sanitation unit. Served full notice period.",
        "filename": "resignation-letter-ethekwini.pdf",
        "contentType": "application/pdf",
        "fileSize": 234560,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 760,
    },
    {
        "key": "lindiwe-exit-interview",
        "type": "EXIT_INTERVIEW",
        "title": "Exit Interview Summary - eThekwini Water & Sanitation",
        "description": "Exit interview summary from eThekwini Municipality. Reason for leaving: career advancement opportunity at uThukela Water.",
        "filename": "exit-interview-ethekwini.pdf",
        "contentType": "application/pdf",
        "fileSize": 412300,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 758,
    },

    # ── Other / Miscellaneous ──
    {
        "key": "lindiwe-first-aid",
        "type": "OTHER",
        "title": "First Aid Level 1 Certificate",
        "description": "South African Red Cross Society First Aid Level 1 certificate. Valid for 3 years from date of issue.",
        "filename": "first-aid-level1-certificate.pdf",
        "contentType": "application/pdf",
        "fileSize": 423000,
        "version": 1,
        "expiryDate": "2027-01-15",
        "createdDaysAgo": 365,
    },

    # ── Extra: Matric Certificate ──
    {
        "key": "lindiwe-matric",
        "type": "QUALIFICATION",
        "title": "National Senior Certificate (Matric)",
        "description": "NSC Matric certificate with Mathematics, Physical Science, and Life Sciences. Achieved Bachelor's Pass.",
        "filename": "matric-certificate-nsc.pdf",
        "contentType": "application/pdf",
        "fileSize": 1678900,
        "version": 1,
        "expiryDate": None,
        "createdDaysAgo": 735,
    },
]


def build_item(d):
    """Build a DynamoDB item dict from a document definition."""
    did = doc_id(d['key'])
    created_at = dt_ago(d['createdDaysAgo'])
    expiry = d.get('expiryDate') or ''
    expiry_sort = expiry if expiry else '9999-12-31'

    item = {
        'PK':     {'S': f'TENANT#{TENANT_ID}'},
        'SK':     {'S': f'EMPDOC#{did}'},
        'GSI1PK': {'S': f'EMPDOC_ACTIVE#{TENANT_ID}#true'},
        'GSI1SK': {'S': f'EMPDOC#{d["type"]}#{created_at}'},
        'GSI2PK': {'S': f'EMPDOC_EMP#{TENANT_ID}#{EMPLOYEE_ID}'},
        'GSI2SK': {'S': f'EMPDOC#{created_at}'},
        'GSI6PK': {'S': f'EMPDOC_EXPIRY#{TENANT_ID}'},
        'GSI6SK': {'S': f'{expiry_sort}#{did}'},

        'id':          {'S': did},
        'tenantId':    {'S': TENANT_ID},
        'employeeId':  {'S': EMPLOYEE_ID},
        'documentType': {'S': d['type']},
        'title':       {'S': d['title']},
        'description': {'S': d.get('description', '')},
        'filename':    {'S': d['filename']},
        'fileUrl':     {'S': f'documents/{TENANT_ID}/{EMPLOYEE_ID}/{d["filename"]}'},
        'fileSize':    {'S': str(d['fileSize'])},
        'contentType': {'S': d['contentType']},
        'version':     {'N': str(d.get('version', 1))},
        'isActive':    {'BOOL': True},
        'uploadedBy':  {'S': 'SYSTEM'},
        'createdAt':   {'S': created_at},
        'updatedAt':   {'S': now_iso},
    }

    if expiry:
        item['expiryDate'] = {'S': expiry}

    # E-Signature fields (only include if present)
    sig_status = d.get('eSignatureStatus')
    if sig_status:
        item['eSignatureEnvelopeId'] = {'S': doc_id(f'envelope-{d["key"]}')}
        item['eSignatureStatus'] = {'S': sig_status}
        if d.get('eSignatureSentDaysAgo') is not None:
            item['eSignatureSentAt'] = {'S': dt_ago(d['eSignatureSentDaysAgo'])}
            item['eSignatureSignerEmail'] = {'S': LINDIWE_EMAIL}
        if sig_status == 'completed' and d.get('eSignatureCompletedDaysAgo') is not None:
            item['eSignatureCompletedAt'] = {'S': dt_ago(d['eSignatureCompletedDaysAgo'])}

    return item


def seed_documents():
    print(f"Seeding {len(DOCUMENTS)} employee documents for Lindiwe Ngcobo (UTH-005)...")
    print(f"Employee ID: {EMPLOYEE_ID}")
    print()

    ok = fail = skip = 0
    for d in DOCUMENTS:
        item = build_item(d)
        success, err = put_item(item)
        if success:
            status_info = []
            if d.get('eSignatureStatus'):
                status_info.append(f"e-sig:{d['eSignatureStatus']}")
            if d.get('expiryDate'):
                status_info.append(f"expires:{d['expiryDate']}")
            extra = f" ({', '.join(status_info)})" if status_info else ""
            print(f"  OK   {d['type']:25s} {d['title'][:50]}{extra}")
            ok += 1
        elif 'ConditionalCheckFailedException' in err or not err:
            print(f"  SKIP {d['type']:25s} {d['title'][:50]} (already exists)")
            skip += 1
        else:
            print(f"  FAIL {d['type']:25s} {err}", file=sys.stderr)
            fail += 1

    return ok, fail, skip


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    ok, fail, skip = seed_documents()

    print(f"\nDone: {ok} created, {skip} skipped, {fail} failed")

    if ok > 0:
        print(f"\nDocuments are now visible for employee@uthukela login.")
        print("Summary of seeded states:")
        expired = sum(1 for d in DOCUMENTS if d.get('expiryDate') and d['expiryDate'] < now.strftime('%Y-%m-%d'))
        expiring = sum(1 for d in DOCUMENTS if d.get('expiryDate') and d['expiryDate'] >= now.strftime('%Y-%m-%d')
                       and (datetime.strptime(d['expiryDate'], '%Y-%m-%d') - now.replace(tzinfo=None)).days <= 30)
        awaiting = sum(1 for d in DOCUMENTS if d.get('eSignatureStatus') == 'sent')
        signed = sum(1 for d in DOCUMENTS if d.get('eSignatureStatus') == 'completed')
        print(f"  Total: {len(DOCUMENTS)}, Expired: {expired}, Expiring soon: {expiring}, "
              f"Awaiting signature: {awaiting}, Signed: {signed}")

    sys.exit(1 if fail > 0 else 0)


if __name__ == '__main__':
    main()
