#!/usr/bin/env python3
"""
Direct DynamoDB seeder for IDC screenshot demo data.
Seeds interviews, salary recommendations, talent pool entries,
and updates offer statuses to populate empty-state screens.

Usage:
    AWS_PROFILE=alusa-dev python3 seed-idc-dynamo.py
"""

import json, os, subprocess, uuid, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = "idc"
TABLE_NAME = "shumelahire-data"
REGION = "af-south-1"
ADMIN_ID = "756ed04a-2854-4d2a-b304-c41b71aef220"

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')

_counter = 0

def new_id(seed_key=None):
    global _counter
    if seed_key is None:
        _counter += 1
        seed_key = f"idc-seed-{_counter}"
    return str(uuid.UUID(hashlib.sha256(f"{TENANT_ID}:{seed_key}".encode()).hexdigest()[:32]))


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def put_item(item):
    result = subprocess.run(
        ['aws', 'dynamodb', 'put-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--condition-expression', 'attribute_not_exists(PK)',
         '--item', json.dumps(item)],
        capture_output=True, text=True,
        env={**os.environ, 'AWS_PROFILE': 'alusa-dev'})
    if result.returncode != 0 and 'ConditionalCheckFailedException' not in result.stderr:
        return False, result.stderr.strip()[:120]
    if 'ConditionalCheckFailedException' in (result.stderr or ''):
        return True, 'exists'
    return True, ''


def update_item(key, updates):
    """Update specific attributes on an existing item."""
    expr_parts = []
    attr_names = {}
    attr_values = {}
    for i, (field, value) in enumerate(updates.items()):
        alias = f"#f{i}"
        val_alias = f":v{i}"
        expr_parts.append(f"{alias} = {val_alias}")
        attr_names[alias] = field
        attr_values[val_alias] = value

    cmd = [
        'aws', 'dynamodb', 'update-item',
        '--table-name', TABLE_NAME, '--region', REGION,
        '--key', json.dumps(key),
        '--update-expression', 'SET ' + ', '.join(expr_parts),
        '--expression-attribute-names', json.dumps(attr_names),
        '--expression-attribute-values', json.dumps(attr_values),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True,
                           env={**os.environ, 'AWS_PROFILE': 'alusa-dev'})
    return result.returncode == 0, result.stderr.strip()[:120] if result.returncode != 0 else ''


def query_items(pk_value, sk_prefix):
    """Query items by PK and SK prefix."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': pk_value}, ':sk': {'S': sk_prefix}
         }),
         '--output', 'json'],
        capture_output=True, text=True,
        env={**os.environ, 'AWS_PROFILE': 'alusa-dev'})
    return json.loads(result.stdout).get('Items', [])


def delete_item(key):
    """Delete a single item by key."""
    result = subprocess.run(
        ['aws', 'dynamodb', 'delete-item',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key', json.dumps(key)],
        capture_output=True, text=True,
        env={**os.environ, 'AWS_PROFILE': 'alusa-dev'})
    return result.returncode == 0, result.stderr.strip()[:120] if result.returncode != 0 else ''


# ============================================================
# 0. THANDI MOLEFE — candidate character for bid narrative
# ============================================================
THANDI_ID = new_id("thandi-molefe")
THANDI_APP_ID = new_id("thandi-molefe-app")

def seed_thandi_molefe():
    """Create Thandi Molefe as the bid narrative's candidate character.

    Thandi is a CFA charterholder with six years in commercial banking
    who applies to the Senior Investment Analyst vacancy via the Careers
    Page. She appears in the applicant list, application management,
    and pipeline screenshots.
    """
    print("\n" + "="*50)
    print(" Seeding Thandi Molefe (Candidate Character)")
    print("="*50)

    created = 0

    # ---- Applicant record ----
    # Query an existing applicant to discover the full item schema
    existing = query_items(f'TENANT#{TENANT_ID}', 'APPLICANT#')
    if not existing:
        print("  ⚠ No existing applicants — cannot derive schema")
        return 0

    ref = existing[0]
    ref_id = ref['id']['S']

    # Core fields for Thandi's profile
    thandi = {
        'PK':        {'S': f'TENANT#{TENANT_ID}'},
        'SK':        {'S': f'APPLICANT#{THANDI_ID}'},
        'id':        {'S': THANDI_ID},
        'tenantId':  {'S': TENANT_ID},
        'name':      {'S': 'Thandi'},
        'surname':   {'S': 'Molefe'},
        'email':     {'S': 'thandi.molefe@outlook.co.za'},
        'phone':     {'S': '+27 83 456 7890'},
        'createdAt': {'S': iso(now - timedelta(days=14))},
        'updatedAt': {'S': now_iso},
        'createdBy': {'S': ADMIN_ID},
    }

    # Clone GSI keys from the reference record, substituting the ref ID
    for key in ref:
        if key.startswith('GSI') and key not in thandi:
            val = ref[key]
            if 'S' in val:
                thandi[key] = {'S': val['S'].replace(ref_id, THANDI_ID)}
            else:
                thandi[key] = val

    # Copy auxiliary fields we haven't set (source, location, etc.)
    skip = {'PK','SK','id','tenantId','name','surname','email','phone',
            'createdAt','updatedAt','createdBy'}
    for key in ref:
        if key not in thandi and key not in skip and not key.startswith('GSI'):
            thandi[key] = ref[key]

    ok1, err1 = put_item(thandi)
    print(f"  {'✓' if ok1 else '⚠'} Applicant: Thandi Molefe  {'OK' if ok1 else err1}")
    if ok1:
        created += 1

    # ---- Application to Senior Investment Analyst (SCREENING) ----
    reqs = query_items(f'TENANT#{TENANT_ID}', 'REQUISITION#')
    sia_req_id = ''
    for req in reqs:
        title = req.get('jobTitle', {}).get('S', '')
        if 'Investment Analyst' in title:
            sia_req_id = req['id']['S']
            break

    apps = query_items(f'TENANT#{TENANT_ID}', 'APPLICATION#')
    if not apps:
        print("  ⚠ No existing applications — skipping application")
        return created

    app_ref = apps[0]
    app_ref_id = app_ref['id']['S']
    app_ref_applicant = app_ref.get('applicantId', {}).get('S', '')
    app_ref_status = app_ref.get('status', {}).get('S', '')

    thandi_app = {
        'PK':          {'S': f'TENANT#{TENANT_ID}'},
        'SK':          {'S': f'APPLICATION#{THANDI_APP_ID}'},
        'id':          {'S': THANDI_APP_ID},
        'tenantId':    {'S': TENANT_ID},
        'applicantId': {'S': THANDI_ID},
        'jobTitle':    {'S': 'Senior Investment Analyst'},
        'department':  {'S': 'Strategic Business Unit'},
        'status':      {'S': 'SCREENING'},
        'source':      {'S': 'CAREERS_PAGE'},
        'coverLetter': {'S': 'I am writing to express my strong interest in the Senior Investment Analyst position at the Industrial Development Corporation. With six years of experience in commercial banking at Standard Bank and my CFA charter, I am eager to transition into development finance where I can contribute to South Africa\'s industrial growth. My experience in credit analysis, financial modelling, and project finance aligns closely with the requirements of this role.'},
        'createdAt':   {'S': iso(now - timedelta(days=10))},
        'updatedAt':   {'S': now_iso},
        'createdBy':   {'S': THANDI_ID},
    }

    if sia_req_id:
        thandi_app['requisitionId'] = {'S': sia_req_id}

    # Clone GSI keys from reference, substituting IDs and status
    for key in app_ref:
        if key.startswith('GSI') and key not in thandi_app:
            val = app_ref[key]
            if 'S' in val:
                new_val = val['S']
                new_val = new_val.replace(app_ref_id, THANDI_APP_ID)
                if app_ref_applicant:
                    new_val = new_val.replace(app_ref_applicant, THANDI_ID)
                if app_ref_status:
                    new_val = new_val.replace(app_ref_status, 'SCREENING')
                thandi_app[key] = {'S': new_val}
            else:
                thandi_app[key] = val

    # Copy auxiliary fields
    skip_app = {'PK','SK','id','tenantId','applicantId','jobTitle','department',
                'status','source','coverLetter','createdAt','updatedAt','createdBy',
                'requisitionId'}
    for key in app_ref:
        if key not in thandi_app and key not in skip_app and not key.startswith('GSI'):
            thandi_app[key] = app_ref[key]

    ok2, err2 = put_item(thandi_app)
    print(f"  {'✓' if ok2 else '⚠'} Application: Senior Investment Analyst (SCREENING)  {'OK' if ok2 else err2}")
    if ok2:
        created += 1

    return created


# ============================================================
# 1. INTERVIEWS — scheduled for this week and next
# ============================================================
def seed_interviews():
    print("\n" + "="*50)
    print(" Seeding Interviews")
    print("="*50)

    # Get some applications to link interviews to
    apps = query_items(f'TENANT#{TENANT_ID}', 'APPLICATION#')

    # Get applicant names for interview titles
    applicants = query_items(f'TENANT#{TENANT_ID}', 'APPLICANT#')
    applicant_map = {a['id']['S']: f"{a.get('name',{}).get('S','')} {a.get('surname',{}).get('S','')}"
                     for a in applicants}

    # Find INTERVIEW_SCHEDULED and INTERVIEW_COMPLETED apps
    scheduled_apps = [a for a in apps if a.get('status',{}).get('S') in
                      ('INTERVIEW_SCHEDULED', 'SCREENING', 'SUBMITTED', 'INTERVIEW_COMPLETED')][:8]

    interviews = [
        # (app_index, status, type, round, days_from_now, hour, duration, location, rating, recommendation, feedback)
        (0, "SCHEDULED", "PANEL", "FIRST_ROUND", 2, 10, 60,
         "IDC Boardroom A, 19 Fredman Drive, Sandton", None, None, None),
        (1, "SCHEDULED", "TECHNICAL", "TECHNICAL", 2, 14, 90,
         "IDC IT Lab, 19 Fredman Drive, Sandton", None, None, None),
        (2, "SCHEDULED", "IN_PERSON", "FIRST_ROUND", 3, 9, 60,
         "IDC Boardroom B, 19 Fredman Drive, Sandton", None, None, None),
        (3, "SCHEDULED", "PANEL", "SECOND_ROUND", 3, 14, 60,
         "IDC Boardroom A, 19 Fredman Drive, Sandton", None, None, None),
        (4, "SCHEDULED", "TECHNICAL", "TECHNICAL", 4, 10, 90,
         "IDC IT Lab, 19 Fredman Drive, Sandton", None, None, None),
        (5, "SCHEDULED", "IN_PERSON", "FIRST_ROUND", 5, 9, 60,
         "IDC Boardroom B, 19 Fredman Drive, Sandton", None, None, None),
        (6, "COMPLETED", "PANEL", "FIRST_ROUND", -5, 10, 60,
         "IDC Boardroom A, 19 Fredman Drive, Sandton", 4, "HIRE",
         "Strong candidate with excellent technical skills. Good communication. Recommended for shortlist."),
        (7, "COMPLETED", "TECHNICAL", "TECHNICAL", -3, 14, 90,
         "IDC IT Lab, 19 Fredman Drive, Sandton", 5, "STRONG_HIRE",
         "Exceptional technical assessment. Deep domain knowledge. Outstanding problem-solving. Top candidate."),
    ]

    created = 0
    for idx, status, itype, iround, days_offset, hour, duration, location, rating, rec, feedback in interviews:
        if idx >= len(scheduled_apps):
            break

        app = scheduled_apps[idx]
        app_id = app['id']['S']
        applicant_id = app.get('applicantId', {}).get('S', '')
        job_title = app.get('jobTitle', {}).get('S', 'Position')
        candidate_name = applicant_map.get(applicant_id, 'Candidate')

        iid = new_id(f"interview-{idx}")
        sched_dt = now + timedelta(days=days_offset, hours=hour - now.hour)
        sched = iso(sched_dt)

        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'INTERVIEW#{iid}'},
            'GSI1PK': {'S': f'INTERVIEW_STATUS#{status}'},
            'GSI1SK': {'S': f'INTERVIEW#{sched}'},
            'GSI2PK': {'S': f'INTERVIEW_APP#{app_id}'},
            'GSI2SK': {'S': f'INTERVIEW#{sched}'},
            'GSI5PK': {'S': f'INTERVIEW_INTERVIEWER#{ADMIN_ID}'},
            'GSI5SK': {'S': f'INTERVIEW#{sched}'},
            'GSI6PK': {'S': f'INTERVIEW_DATE#{TENANT_ID}'},
            'GSI6SK': {'S': sched},
            'id': {'S': iid},
            'tenantId': {'S': TENANT_ID},
            'applicationId': {'S': app_id},
            'title': {'S': f'{iround.replace("_", " ").title()} Interview — {job_title}'},
            'type': {'S': itype},
            'round': {'S': iround},
            'status': {'S': status},
            'scheduledAt': {'S': sched},
            'durationMinutes': {'N': str(duration)},
            'location': {'S': location},
            'interviewerId': {'S': ADMIN_ID},
            'interviewerName': {'S': 'IDC Administrator'},
            'createdBy': {'S': ADMIN_ID},
            'createdAt': {'S': iso(now - timedelta(days=7))},
            'updatedAt': {'S': now_iso},
        }

        if rating is not None:
            item['rating'] = {'N': str(rating)}
            item['recommendation'] = {'S': rec}
            item['feedback'] = {'S': feedback}
            item['overallImpression'] = {'S': feedback[:100]}
            item['completedAt'] = {'S': sched}

        ok, err = put_item(item)
        icon = '📅' if status == 'SCHEDULED' else '✅'
        day = sched_dt.strftime('%a %d %b')
        time_str = sched_dt.strftime('%H:%M')
        print(f"  {icon} {day} {time_str} — {itype:10s} {iround:15s} {candidate_name[:20]:20s} {'OK' if ok else 'FAIL'} {err}")
        if ok:
            created += 1

    print(f"  → {created} interviews seeded")
    return created


# ============================================================
# 2. SALARY RECOMMENDATIONS
# ============================================================
def seed_salary_recommendations():
    print("\n" + "="*50)
    print(" Seeding Salary Recommendations")
    print("="*50)

    recs = [
        {
            'positionTitle': 'Senior Investment Analyst',
            'department': 'Strategic Business Unit',
            'jobGrade': 'D3',
            'positionLevel': 'SENIOR',
            'candidateName': 'Thandi Molefe',
            'candidateCurrentSalary': '650000',
            'candidateExpectedSalary': '780000',
            'proposedMinSalary': '700000',
            'proposedMaxSalary': '850000',
            'proposedTargetSalary': '750000',
            'recommendedSalary': '720000',
            'status': 'APPROVED',
            'recommendationJustification': 'CFA charter holder with 6 years commercial banking experience (Standard Bank). Strong financial modelling, credit analysis and project finance skills. Market rate for senior investment analysts in DFIs ranges R680k-R850k. Proposed target of R750k reflects mid-range for experience level; recommended R720k accounts for transition from commercial banking to development finance.',
            'marketDataReference': 'Remchannel DFI Salary Survey 2026, 75th percentile',
            'bonusRecommendation': '15% target, 20% stretch',
        },
        {
            'positionTitle': 'Software Developer',
            'department': 'Information Technology',
            'jobGrade': 'C4',
            'positionLevel': 'MID_LEVEL',
            'candidateName': 'Naledi Dlamini',
            'candidateCurrentSalary': '520000',
            'candidateExpectedSalary': '650000',
            'proposedMinSalary': '550000',
            'proposedMaxSalary': '700000',
            'proposedTargetSalary': '620000',
            'recommendedSalary': '620000',
            'status': 'PENDING_REVIEW',
            'recommendationJustification': 'AWS certified developer with 5 years full-stack experience (React, Java, Spring Boot). Gauteng market rate for mid-senior developers R550k-R700k. Proposed target reflects cloud certification premium and scarce skills.',
            'marketDataReference': 'OfferZen State of Developer Salaries 2026',
            'bonusRecommendation': '10% target',
        },
        {
            'positionTitle': 'Risk Manager',
            'department': 'Enterprise Risk Management',
            'jobGrade': 'D4',
            'positionLevel': 'SENIOR',
            'candidateName': 'Pieter van der Merwe',
            'candidateCurrentSalary': '880000',
            'candidateExpectedSalary': '1000000',
            'proposedMinSalary': '850000',
            'proposedMaxSalary': '1100000',
            'proposedTargetSalary': '950000',
            'recommendedSalary': '920000',
            'status': 'PENDING_REVIEW',
            'recommendationJustification': 'FRM certified with 8 years at DBSA in enterprise risk. Senior risk manager market rate in DFIs R850k-R1.1M. Candidate brings direct development finance risk expertise. Above-median offer recommended given scarce skills and competitor pressure.',
            'marketDataReference': 'Deloitte Financial Services Remuneration Survey 2026, median + 10%',
            'bonusRecommendation': '18% target, 25% stretch',
        },
    ]

    created = 0
    for i, rec in enumerate(recs):
        rid = new_id(f"salrec-{i}")
        rec_num = f"SR-{TENANT_ID.upper()}-2026-{1001 + i}"
        created_at = iso(now - timedelta(days=5 - i))

        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'SALREC#{rid}'},
            'GSI1PK': {'S': f'SALREC_STATUS#{rec["status"]}'},
            'GSI1SK': {'S': f'SALREC#{created_at}'},
            'GSI4PK': {'S': f'SALREC_NUM#{rec_num}'},
            'GSI4SK': {'S': f'SALREC#{rid}'},
            'GSI5PK': {'S': f'SALREC_DEPT#{rec["department"]}'},
            'GSI5SK': {'S': f'SALREC#{created_at}'},
            'id': {'S': rid},
            'tenantId': {'S': TENANT_ID},
            'recommendationNumber': {'S': rec_num},
            'status': {'S': rec['status']},
            'positionTitle': {'S': rec['positionTitle']},
            'department': {'S': rec['department']},
            'jobGrade': {'S': rec['jobGrade']},
            'positionLevel': {'S': rec['positionLevel']},
            'candidateName': {'S': rec['candidateName']},
            'candidateCurrentSalary': {'N': rec['candidateCurrentSalary']},
            'candidateExpectedSalary': {'N': rec['candidateExpectedSalary']},
            'proposedMinSalary': {'N': rec['proposedMinSalary']},
            'proposedMaxSalary': {'N': rec['proposedMaxSalary']},
            'proposedTargetSalary': {'N': rec['proposedTargetSalary']},
            'recommendedSalary': {'N': rec['recommendedSalary']},
            'requestedBy': {'S': ADMIN_ID},
            'recommendedBy': {'S': ADMIN_ID},
            'recommendedAt': {'S': created_at},
            'recommendationJustification': {'S': rec['recommendationJustification']},
            'marketDataReference': {'S': rec['marketDataReference']},
            'bonusRecommendation': {'S': rec['bonusRecommendation']},
            'currency': {'S': 'ZAR'},
            'requiresApproval': {'BOOL': True},
            'approvalLevelRequired': {'N': '2'},
            'createdAt': {'S': created_at},
            'updatedAt': {'S': now_iso},
        }

        if rec['status'] == 'APPROVED':
            item['approvedBy'] = {'S': ADMIN_ID}
            item['approvedAt'] = {'S': iso(now - timedelta(days=2))}
            item['approvalNotes'] = {'S': 'Approved. Aligned with market benchmarks and internal equity.'}

        ok, err = put_item(item)
        status_icon = '✅' if rec['status'] == 'APPROVED' else '⏳'
        print(f"  {status_icon} {rec['positionTitle']:30s} R{rec['proposedTargetSalary']:>10s}  {rec['status']:10s} {'OK' if ok else err}")
        if ok:
            created += 1

    print(f"  → {created} salary recommendations seeded")
    return created


# ============================================================
# 3. UPDATE OFFER STATUSES
# ============================================================
def update_offer_statuses():
    print("\n" + "="*50)
    print(" Updating Offer Statuses")
    print("="*50)

    offers = query_items(f'TENANT#{TENANT_ID}', 'OFFER#')
    if not offers:
        print("  No offers found to update")
        return 0

    # Target statuses for variety (DRAFT is default, update some)
    target_statuses = [
        ('ACCEPTED', 'Candidate accepted. Start date confirmed.'),
        ('SENT', 'Offer letter sent via email. Awaiting response.'),
        ('PENDING_APPROVAL', 'Submitted for executive approval.'),
        ('DRAFT', None),  # Leave as draft
        ('SENT', 'Offer extended. Candidate reviewing terms.'),
        ('ACCEPTED', 'Accepted. Background check initiated.'),
        ('DRAFT', None),
        ('PENDING_APPROVAL', 'Salary above threshold — requires D4 approval.'),
    ]

    updated = 0
    for i, offer in enumerate(offers):
        if i >= len(target_statuses):
            break

        target_status, note = target_statuses[i]
        offer_id = offer['id']['S']
        job_title = offer.get('jobTitle', {}).get('S', 'Position')
        current_status = offer.get('status', {}).get('S', 'DRAFT')

        if current_status == target_status:
            print(f"  ─ {job_title:30s} already {current_status}")
            continue

        key = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'OFFER#{offer_id}'}
        }

        updates = {
            'status': {'S': target_status},
            'updatedAt': {'S': now_iso},
        }

        # Update GSI1 for status queries
        updates['GSI1PK'] = {'S': f'OFFER_STATUS#{target_status}'}

        if target_status == 'ACCEPTED':
            updates['acceptedAt'] = {'S': now_iso}
        elif target_status == 'SENT':
            updates['offerSentAt'] = {'S': iso(now - timedelta(days=1))}
        elif target_status == 'PENDING_APPROVAL':
            pass  # Just status change

        if note:
            updates['approvalNotes'] = {'S': note}

        ok, err = update_item(key, updates)
        icon = {'ACCEPTED': '🎉', 'SENT': '📧', 'PENDING_APPROVAL': '⏳', 'DRAFT': '📝'}[target_status]
        print(f"  {icon} {job_title:30s} {current_status:12s} → {target_status:18s} {'OK' if ok else err}")
        if ok:
            updated += 1

    print(f"  → {updated} offers updated")
    return updated


# ============================================================
# 4. TALENT POOL ENTRIES
# ============================================================
def seed_talent_pool_entries():
    print("\n" + "="*50)
    print(" Seeding Talent Pool Entries")
    print("="*50)

    # Get talent pool IDs
    pools = query_items(f'TENANT#{TENANT_ID}', 'TALENT_POOL#')
    if not pools:
        print("  No talent pools found")
        return 0

    # Filter out the "Test Pool"
    real_pools = [p for p in pools if p.get('poolName', {}).get('S', '') != 'Test Pool']
    if not real_pools:
        real_pools = pools[:2]

    # Get applicants
    applicants = query_items(f'TENANT#{TENANT_ID}', 'APPLICANT#')
    if not applicants:
        print("  No applicants found")
        return 0

    created = 0
    notes = [
        "Strong technical candidate. Excellent references from previous DFI role.",
        "Proactive talent pipeline addition. Skills match future vacancy projections.",
        "Internal referral. Currently under consideration for multiple roles.",
        "Top performer from recent recruitment drive. Retained for future openings.",
        "Specialist skillset. Added for strategic pipeline building.",
    ]

    for pi, pool in enumerate(real_pools[:2]):
        pool_id = pool['id']['S']
        pool_name = pool.get('poolName', {}).get('S', 'Pool')

        # Add 5 applicants to each pool, offset by pool index
        start_idx = pi * 5
        for j in range(5):
            ai = start_idx + j
            if ai >= len(applicants):
                break

            applicant = applicants[ai]
            applicant_id = applicant['id']['S']
            aname = f"{applicant.get('name',{}).get('S','')} {applicant.get('surname',{}).get('S','')}"

            eid = new_id(f"tpentry-{pi}-{j}")
            added_at = iso(now - timedelta(days=10 - j))

            item = {
                'PK': {'S': f'TENANT#{TENANT_ID}'},
                'SK': {'S': f'TALENT_POOL_ENTRY#{eid}'},
                'GSI1PK': {'S': f'TPENTRY_POOL#{TENANT_ID}#{pool_id}'},
                'GSI1SK': {'S': f'TALENT_POOL_ENTRY#{added_at}'},
                'GSI2PK': {'S': f'TPENTRY_APPLICANT#{TENANT_ID}#{applicant_id}'},
                'GSI2SK': {'S': f'TALENT_POOL_ENTRY#{eid}'},
                'GSI4PK': {'S': f'TPENTRY_UNIQUE#{TENANT_ID}#{pool_id}#{applicant_id}'},
                'GSI4SK': {'S': f'TALENT_POOL_ENTRY#{eid}'},
                'id': {'S': eid},
                'tenantId': {'S': TENANT_ID},
                'talentPoolId': {'S': pool_id},
                'applicantId': {'S': applicant_id},
                'sourceType': {'S': 'MANUAL'},
                'notes': {'S': notes[j % len(notes)]},
                'rating': {'N': str(4 + (j % 2))},
                'isAvailable': {'BOOL': True},
                'addedBy': {'S': ADMIN_ID},
                'addedAt': {'S': added_at},
            }

            ok, err = put_item(item)
            print(f"  {'✓' if ok else '✗'} {pool_name[:30]:30s} ← {aname:20s} {'OK' if ok else err}")
            if ok:
                created += 1

    print(f"  → {created} talent pool entries seeded")
    return created


# ============================================================
# 5. CLEANUP — Delete test requisition
# ============================================================
def cleanup_test_data():
    print("\n" + "="*50)
    print(" Cleanup")
    print("="*50)

    reqs = query_items(f'TENANT#{TENANT_ID}', 'REQUISITION#')
    for req in reqs:
        title = req.get('jobTitle', {}).get('S', '')
        if title == 'Test Req' or (not title and req.get('description', {}).get('S', '') == 'test'):
            req_id = req['id']['S']
            result = subprocess.run(
                ['aws', 'dynamodb', 'delete-item',
                 '--table-name', TABLE_NAME, '--region', REGION,
                 '--key', json.dumps({
                     'PK': {'S': f'TENANT#{TENANT_ID}'},
                     'SK': {'S': f'REQUISITION#{req_id}'}
                 })],
                capture_output=True, text=True,
                env={**os.environ, 'AWS_PROFILE': 'alusa-dev'})
            status = 'deleted' if result.returncode == 0 else 'failed'
            print(f"  🗑  Test requisition '{title or 'untitled'}' → {status}")


def fix_blank_requisition_titles():
    """Fix requisitions that have blank or null jobTitle values."""
    print("\n" + "="*50)
    print(" Fixing Blank Requisition Titles")
    print("="*50)

    reqs = query_items(f'TENANT#{TENANT_ID}', 'REQUISITION#')
    updated = 0
    for req in reqs:
        title = req.get('jobTitle', {}).get('S', '').strip()
        if not title:
            req_id = req['id']['S']
            dept = req.get('department', {}).get('S', 'General')
            # Derive a reasonable title from department or description
            desc = req.get('description', {}).get('S', '')
            fallback_title = f"{dept} Position" if dept else "Untitled Position"
            if desc and len(desc) > 5:
                # Use first ~40 chars of description as title
                fallback_title = desc[:40].strip().rstrip('.')

            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'REQUISITION#{req_id}'}}
            ok, err = update_item(key, {'jobTitle': {'S': fallback_title}})
            print(f"  {'OK' if ok else 'FAIL'} REQ {req_id[:8]}... → '{fallback_title}'  {err}")
            if ok:
                updated += 1

    print(f"  → {updated} requisitions fixed")
    return updated


# ============================================================
# 6. FIX JOB POSTING APPLICATION COUNTS
# ============================================================
def fix_job_posting_counts():
    """Update applicationsCount on JOB_POSTING records to match actual APPLICATION records."""
    print("\n" + "="*50)
    print(" Fixing Job Posting Application Counts")
    print("="*50)

    # Count applications per jobPostingId / requisitionId
    apps = query_items(f'TENANT#{TENANT_ID}', 'APPLICATION#')
    counts = {}
    for app in apps:
        # Applications may link via requisitionId or jobPostingId
        job_id = app.get('jobPostingId', {}).get('S', '') or app.get('requisitionId', {}).get('S', '')
        if job_id:
            counts[job_id] = counts.get(job_id, 0) + 1

    # Also build a count by jobTitle for fallback matching
    title_counts = {}
    for app in apps:
        title = app.get('jobTitle', {}).get('S', '')
        if title:
            title_counts[title] = title_counts.get(title, 0) + 1

    # Get all job postings / requisitions
    postings = query_items(f'TENANT#{TENANT_ID}', 'JOB_POSTING#')
    reqs = query_items(f'TENANT#{TENANT_ID}', 'REQUISITION#')

    updated = 0

    for posting in postings:
        pid = posting['id']['S']
        title = posting.get('jobTitle', {}).get('S', posting.get('title', {}).get('S', ''))
        current = int(posting.get('applicationsCount', {}).get('N', '0'))
        actual = counts.get(pid, title_counts.get(title, 0))

        if actual == 0 and current == 0:
            # Distribute minimum 1-4 apps to postings with no direct matches
            actual = max(1, hash(pid) % 5)

        if actual != current:
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'JOB_POSTING#{pid}'}}
            ok, err = update_item(key, {'applicationsCount': {'N': str(actual)}})
            print(f"  {'OK' if ok else 'FAIL'} {title[:40]:40s} {current} -> {actual}  {err}")
            if ok:
                updated += 1

    # Also update requisition records
    for req in reqs:
        rid = req['id']['S']
        title = req.get('jobTitle', {}).get('S', '')
        current = int(req.get('applicationsCount', {}).get('N', '0'))
        actual = counts.get(rid, title_counts.get(title, 0))

        if actual > 0 and actual != current:
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'REQUISITION#{rid}'}}
            ok, err = update_item(key, {'applicationsCount': {'N': str(actual)}})
            print(f"  {'OK' if ok else 'FAIL'} {title[:40]:40s} {current} -> {actual}  {err}")
            if ok:
                updated += 1

    print(f"  -> {updated} records updated")
    return updated


# ============================================================
# 7. FIX UNKNOWN CANDIDATES
# ============================================================
def fix_unknown_candidates():
    """Set candidateName on APPLICATION, OFFER, and INTERVIEW records."""
    print("\n" + "="*50)
    print(" Fixing Unknown Candidates")
    print("="*50)

    # Build applicant name map
    applicants = query_items(f'TENANT#{TENANT_ID}', 'APPLICANT#')
    applicant_map = {}
    applicant_list = []
    for a in applicants:
        aid = a['id']['S']
        name = f"{a.get('name', {}).get('S', '')} {a.get('surname', {}).get('S', '')}".strip()
        if name:
            applicant_map[aid] = name
            applicant_list.append(aid)

    if not applicant_map:
        print("  No applicants found")
        return 0

    updated = 0

    # Fix APPLICATION records
    apps = query_items(f'TENANT#{TENANT_ID}', 'APPLICATION#')
    app_applicant_map = {}  # applicationId -> applicantId (for offer/interview lookups)

    for i, app in enumerate(apps):
        app_id = app['id']['S']
        applicant_id = app.get('applicantId', {}).get('S', '')
        current_name = app.get('candidateName', {}).get('S', '')
        updates = {}

        if not applicant_id:
            # Assign an applicant round-robin
            applicant_id = applicant_list[i % len(applicant_list)]
            updates['applicantId'] = {'S': applicant_id}

        name = applicant_map.get(applicant_id, '')
        app_applicant_map[app_id] = applicant_id

        if name and name != current_name:
            updates['candidateName'] = {'S': name}

        # Ensure Thandi's application has correct pipeline stage
        if app_id == THANDI_APP_ID:
            if app.get('pipelineStage', {}).get('S', '') != 'INITIAL_SCREENING':
                updates['pipelineStage'] = {'S': 'INITIAL_SCREENING'}
            if app.get('status', {}).get('S', '') != 'SCREENING':
                updates['status'] = {'S': 'SCREENING'}
            if app.get('applicantId', {}).get('S', '') != THANDI_ID:
                updates['applicantId'] = {'S': THANDI_ID}
            if current_name != 'Thandi Molefe':
                updates['candidateName'] = {'S': 'Thandi Molefe'}

        if updates:
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'APPLICATION#{app_id}'}}
            ok, err = update_item(key, updates)
            assigned_name = updates.get('candidateName', {}).get('S', name)
            print(f"  {'OK' if ok else 'FAIL'} APP  {assigned_name[:25]:25s} {err}")
            if ok:
                updated += 1

    # Fix OFFER records
    offers = query_items(f'TENANT#{TENANT_ID}', 'OFFER#')
    for offer in offers:
        offer_id = offer['id']['S']
        current_name = offer.get('candidateName', {}).get('S', '')
        app_id = offer.get('applicationId', {}).get('S', '')
        applicant_id = app_applicant_map.get(app_id, offer.get('applicantId', {}).get('S', ''))
        name = applicant_map.get(applicant_id, '')

        if name and name != current_name:
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'OFFER#{offer_id}'}}
            ok, err = update_item(key, {'candidateName': {'S': name}})
            print(f"  {'OK' if ok else 'FAIL'} OFFR {name[:25]:25s} {err}")
            if ok:
                updated += 1

    # Fix INTERVIEW records
    interviews = query_items(f'TENANT#{TENANT_ID}', 'INTERVIEW#')
    for interview in interviews:
        iid = interview['id']['S']
        current_name = interview.get('candidateName', {}).get('S', '')
        app_id = interview.get('applicationId', {}).get('S', '')
        applicant_id = app_applicant_map.get(app_id, interview.get('applicantId', {}).get('S', ''))
        name = applicant_map.get(applicant_id, '')

        if name and name != current_name:
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'INTERVIEW#{iid}'}}
            ok, err = update_item(key, {'candidateName': {'S': name}})
            print(f"  {'OK' if ok else 'FAIL'} INTV {name[:25]:25s} {err}")
            if ok:
                updated += 1

    print(f"  -> {updated} records updated")
    return updated


# ============================================================
# 8. FIX DUPLICATE TALENT POOLS
# ============================================================
def fix_duplicate_talent_pools():
    """Remove duplicate talent pools, keeping the oldest of each name."""
    print("\n" + "="*50)
    print(" Fixing Duplicate Talent Pools")
    print("="*50)

    pools = query_items(f'TENANT#{TENANT_ID}', 'TALENT_POOL#')
    if not pools:
        print("  No talent pools found")
        return 0

    # Group by pool name
    by_name = {}
    for pool in pools:
        name = pool.get('poolName', {}).get('S', pool.get('name', {}).get('S', ''))
        if not name:
            continue
        by_name.setdefault(name, []).append(pool)

    deleted = 0
    surviving_pool_map = {}  # old_pool_id -> surviving_pool_id

    for name, group in by_name.items():
        if len(group) <= 1:
            surviving_pool_map[group[0]['id']['S']] = group[0]['id']['S']
            continue

        # Sort by createdAt ascending, keep the oldest
        group.sort(key=lambda p: p.get('createdAt', {}).get('S', ''))
        survivor = group[0]
        survivor_id = survivor['id']['S']

        for dup in group[1:]:
            dup_id = dup['id']['S']
            surviving_pool_map[dup_id] = survivor_id
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'TALENT_POOL#{dup_id}'}}
            ok, err = delete_item(key)
            print(f"  {'DEL' if ok else 'FAIL'} Duplicate: {name[:40]:40s} (keeping {survivor_id[:8]}...)  {err}")
            if ok:
                deleted += 1

    # Reassign TALENT_POOL_ENTRY records pointing to deleted pools
    entries = query_items(f'TENANT#{TENANT_ID}', 'TALENT_POOL_ENTRY#')
    reassigned = 0
    for entry in entries:
        pool_id = entry.get('talentPoolId', {}).get('S', '')
        if pool_id in surviving_pool_map and surviving_pool_map[pool_id] != pool_id:
            new_pool_id = surviving_pool_map[pool_id]
            eid = entry['id']['S']
            key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'TALENT_POOL_ENTRY#{eid}'}}
            updates = {
                'talentPoolId': {'S': new_pool_id},
                'GSI1PK': {'S': f'TPENTRY_POOL#{TENANT_ID}#{new_pool_id}'},
            }
            # Update uniqueness GSI if present
            applicant_id = entry.get('applicantId', {}).get('S', '')
            if applicant_id:
                updates['GSI4PK'] = {'S': f'TPENTRY_UNIQUE#{TENANT_ID}#{new_pool_id}#{applicant_id}'}
            ok, err = update_item(key, updates)
            if ok:
                reassigned += 1

    print(f"  -> {deleted} duplicates deleted, {reassigned} entries reassigned")
    return deleted


# ============================================================
# 9. SEED RECRUITMENT METRICS
# ============================================================
def seed_recruitment_metrics():
    """Seed pre-computed RECRUITMENT_METRICS records for analytics dashboard."""
    print("\n" + "="*50)
    print(" Seeding Recruitment Metrics")
    print("="*50)

    # Count actual data for accurate metrics
    apps = query_items(f'TENANT#{TENANT_ID}', 'APPLICATION#')
    interviews = query_items(f'TENANT#{TENANT_ID}', 'INTERVIEW#')
    offers = query_items(f'TENANT#{TENANT_ID}', 'OFFER#')

    total_apps = len(apps)
    total_interviews = len(interviews)
    total_offers = len(offers)
    accepted_offers = sum(1 for o in offers if o.get('status', {}).get('S') == 'ACCEPTED')

    # Pipeline stage counts
    stage_counts = {}
    for app in apps:
        stage = app.get('status', {}).get('S', app.get('pipelineStage', {}).get('S', 'APPLIED'))
        stage_counts[stage] = stage_counts.get(stage, 0) + 1

    offer_acceptance_rate = round((accepted_offers / total_offers * 100) if total_offers > 0 else 0)
    interview_conversion = round((total_interviews / total_apps * 100) if total_apps > 0 else 0)

    metrics_id = new_id("recruitment-metrics-current")
    month_key = now.strftime('%Y-%m')

    item = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'RECRUITMENT_METRICS#{metrics_id}'},
        'GSI1PK': {'S': f'METRICS_PERIOD#{TENANT_ID}'},
        'GSI1SK': {'S': f'RECRUITMENT_METRICS#{month_key}'},
        'id': {'S': metrics_id},
        'tenantId': {'S': TENANT_ID},
        'period': {'S': month_key},
        'periodType': {'S': 'MONTHLY'},
        'totalApplications': {'N': str(total_apps)},
        'interviewsConducted': {'N': str(total_interviews)},
        'offersMade': {'N': str(total_offers)},
        'offersAccepted': {'N': str(accepted_offers)},
        'offerAcceptanceRate': {'N': str(offer_acceptance_rate)},
        'interviewConversionRate': {'N': str(interview_conversion)},
        'avgTimeToFill': {'N': '32'},
        'avgTimeToHire': {'N': '18'},
        'totalActiveJobs': {'N': '20'},
        'trendDirection': {'S': 'UP'},
        'trendVariance': {'N': '12'},
        'previousTotalApplications': {'N': str(max(1, total_apps - 8))},
        'previousOfferAcceptanceRate': {'N': str(max(0, offer_acceptance_rate - 5))},
        'createdAt': {'S': now_iso},
        'updatedAt': {'S': now_iso},
    }

    # Add pipeline stage breakdown
    for stage, count in stage_counts.items():
        pct = round(count / total_apps * 100) if total_apps > 0 else 0
        safe_stage = stage.lower().replace(' ', '_')
        item[f'stage_{safe_stage}_count'] = {'N': str(count)}
        item[f'stage_{safe_stage}_pct'] = {'N': str(pct)}

    ok, err = put_item(item)
    print(f"  {'OK' if ok else err} Recruitment metrics: {total_apps} apps, {total_interviews} interviews, {total_offers} offers")

    # Also create a summary/latest record for quick lookups
    latest_id = new_id("recruitment-metrics-latest")
    latest = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'RECRUITMENT_METRICS#LATEST'},
        'GSI1PK': {'S': f'METRICS_LATEST#{TENANT_ID}'},
        'GSI1SK': {'S': f'RECRUITMENT_METRICS#LATEST'},
        'id': {'S': latest_id},
        'tenantId': {'S': TENANT_ID},
        'period': {'S': month_key},
        'periodType': {'S': 'LATEST'},
        'totalApplications': {'N': str(total_apps)},
        'interviewsConducted': {'N': str(total_interviews)},
        'offersMade': {'N': str(total_offers)},
        'offersAccepted': {'N': str(accepted_offers)},
        'offerAcceptanceRate': {'N': str(offer_acceptance_rate)},
        'interviewConversionRate': {'N': str(interview_conversion)},
        'avgTimeToFill': {'N': '32'},
        'avgTimeToHire': {'N': '18'},
        'totalActiveJobs': {'N': '20'},
        'trendDirection': {'S': 'UP'},
        'trendVariance': {'N': '12'},
        'createdAt': {'S': now_iso},
        'updatedAt': {'S': now_iso},
    }

    # LATEST record — upsert via update_item since put_item has condition
    key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'RECRUITMENT_METRICS#LATEST'}}
    ok2, err2 = update_item(key, {k: v for k, v in latest.items() if k not in ('PK', 'SK')})
    if not ok2:
        # If update fails (item doesn't exist), try put without condition
        ok2, err2 = put_item(latest)
    print(f"  {'OK' if ok2 else err2} Latest metrics record")

    created = (1 if ok else 0) + (1 if ok2 else 0)
    print(f"  -> {created} metrics records seeded")
    return created


# ============================================================
# 10. UPDATE TENANT SETTINGS (logoText + plan + modules)
# ============================================================
def update_tenant_settings():
    """Update IDC tenant record: logoText in branding, plan=ENTERPRISE, modules for module-based gating."""
    print("\n" + "="*50)
    print(" Updating Tenant Settings (logoText + plan + modules)")
    print("="*50)

    # Get current tenant record
    tenant_items = query_items(f'TENANT#{TENANT_ID}', f'TENANT#{TENANT_ID}')
    if not tenant_items:
        print("  No tenant record found")
        return 0

    tenant = tenant_items[0]
    current_settings = tenant.get('settings', {}).get('S', '{}')
    try:
        settings = json.loads(current_settings)
    except (json.JSONDecodeError, TypeError):
        settings = {}

    # Ensure branding section exists and add logoText
    if 'branding' not in settings:
        settings['branding'] = {}

    settings['branding']['logoText'] = 'Applicant Tracking System'

    # Ensure standard branding fields
    settings['branding'].setdefault('primaryColor', '#0072CE')
    settings['branding'].setdefault('secondaryColor', '#003B71')
    settings['branding'].setdefault('accentColor', '#FDB913')
    settings['branding'].setdefault('logoKey', 'uploads/idc-logo.png')

    key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'TENANT#{TENANT_ID}'}}
    updates = {
        'settings': {'S': json.dumps(settings)},
        'plan': {'S': 'ENTERPRISE'},
        'modules': {'S': 'RECRUITMENT,AI,ANALYTICS,ADMINISTRATION'},
    }
    ok, err = update_item(key, updates)
    print(f"  {'OK' if ok else 'FAIL'} logoText + plan=ENTERPRISE + modules=RECRUITMENT,AI,ANALYTICS,ADMINISTRATION  {err}")
    return 1 if ok else 0


# ============================================================
# 11. SEED PLATFORM MODULES + RECRUITMENT FEATURE
# ============================================================
PLATFORM_MODULES = [
    {
        'code': 'RECRUITMENT',
        'name': 'Recruitment',
        'description': 'Core recruitment and applicant tracking functionality',
        'featureCodes': 'RECRUITMENT,POPIA_COMPLIANCE',
    },
    {
        'code': 'AI',
        'name': 'AI Tools',
        'description': 'AI-powered automation and insights',
        'featureCodes': 'AI_ENABLED,AI_SEARCH,AI_EMAIL_DRAFTER,AI_JOB_DESCRIPTION,AI_SALARY_BENCHMARK',
    },
    {
        'code': 'ANALYTICS',
        'name': 'Analytics & Reporting',
        'description': 'Advanced analytics and report export',
        'featureCodes': 'ADVANCED_ANALYTICS,REPORT_EXPORT',
    },
    {
        'code': 'ADMINISTRATION',
        'name': 'Administration',
        'description': 'Custom branding and administration tools',
        'featureCodes': 'CUSTOM_BRANDING',
    },
    {
        'code': 'HR_CORE',
        'name': 'HR Management',
        'description': 'Leave, attendance, shifts, documents, and employee self-service',
        'featureCodes': 'LEAVE_MANAGEMENT,TIME_ATTENDANCE,SHIFT_SCHEDULING,EMPLOYEE_SELF_SERVICE,EMPLOYEE_DOCUMENTS,COMPANY_DOCUMENTS,DOCUMENT_RETENTION,GEOFENCING',
    },
    {
        'code': 'TALENT',
        'name': 'Talent & Performance',
        'description': 'Training, competency mapping, job templates, and internal mobility',
        'featureCodes': 'TRAINING_MANAGEMENT,COMPETENCY_MAPPING,JOB_TEMPLATES,INTERNAL_MOBILITY',
    },
    {
        'code': 'ENGAGEMENT',
        'name': 'Employee Engagement',
        'description': 'Surveys, recognition, rewards, and social feed',
        'featureCodes': 'EMPLOYEE_ENGAGEMENT,PULSE_SURVEYS,RECOGNITION_REWARDS,SOCIAL_FEED',
    },
    {
        'code': 'COMPLIANCE',
        'name': 'Compliance & Governance',
        'description': 'Labour relations, document templates, and POPIA compliance',
        'featureCodes': 'LABOUR_RELATIONS,DOCUMENT_TEMPLATES,POPIA_COMPLIANCE',
    },
    {
        'code': 'INTEGRATIONS',
        'name': 'System Integrations',
        'description': 'Sage, SSO, workflow, and agency management integrations',
        'featureCodes': 'SAGE_300_PEOPLE,AD_SSO,WORKFLOW_MANAGEMENT,AGENCY_MANAGEMENT',
    },
]

def seed_platform_modules():
    """Create PlatformModule records and seed RECRUITMENT PlatformFeature."""
    print("\n" + "="*50)
    print(" Seeding Platform Modules + RECRUITMENT Feature")
    print("="*50)

    created = 0

    # 1. Seed RECRUITMENT PlatformFeature record
    recruitment_feature_id = new_id("platform-feature-recruitment")
    recruitment_feature = {
        'PK':           {'S': 'PLATFORM'},
        'SK':           {'S': f'FEATURE#{recruitment_feature_id}'},
        'GSI1PK':       {'S': 'FEATURE_ACTIVE#true'},
        'GSI1SK':       {'S': 'FEATURE#RECRUITMENT'},
        'GSI3PK':       {'S': 'FEATURE_CATEGORY#RECRUITMENT'},
        'GSI3SK':       {'S': 'FEATURE#RECRUITMENT'},
        'GSI4PK':       {'S': 'FEATURE_CODE#RECRUITMENT'},
        'GSI4SK':       {'S': f'FEATURE#{recruitment_feature_id}'},
        'id':           {'S': recruitment_feature_id},
        'code':         {'S': 'RECRUITMENT'},
        'name':         {'S': 'Recruitment'},
        'description':  {'S': 'Core recruitment and applicant tracking features'},
        'category':     {'S': 'RECRUITMENT'},
        'includedPlans': {'S': 'Starter,Standard,Enterprise'},
        'isActive':     {'BOOL': True},
        'createdAt':    {'S': now_iso},
        'updatedAt':    {'S': now_iso},
    }
    ok, err = put_item(recruitment_feature)
    print(f"  {'OK' if ok else 'FAIL'} FEATURE: RECRUITMENT (Starter,Standard,Enterprise)  {err}")
    if ok:
        created += 1

    # 2. Seed MODULE records
    for mod in PLATFORM_MODULES:
        mid = new_id(f"platform-module-{mod['code']}")
        item = {
            'PK':           {'S': 'PLATFORM'},
            'SK':           {'S': f'MODULE#{mid}'},
            'GSI1PK':       {'S': 'MODULE_ACTIVE#true'},
            'GSI1SK':       {'S': f'MODULE#{mod["code"]}'},
            'GSI4PK':       {'S': f'MODULE_CODE#{mod["code"]}'},
            'GSI4SK':       {'S': f'MODULE#{mid}'},
            'id':           {'S': mid},
            'code':         {'S': mod['code']},
            'name':         {'S': mod['name']},
            'description':  {'S': mod['description']},
            'featureCodes': {'S': mod['featureCodes']},
            'isActive':     {'BOOL': True},
            'createdAt':    {'S': now_iso},
            'updatedAt':    {'S': now_iso},
        }
        ok, err = put_item(item)
        print(f"  {'OK' if ok else 'FAIL'} MODULE: {mod['code']:20s} -> {mod['featureCodes'][:50]}  {err}")
        if ok:
            created += 1

    # 3. Clean up old ATS_ENTERPRISE plan references from features
    features = query_items('PLATFORM', 'FEATURE#')
    cleaned = 0
    for feature in features:
        fid = feature['id']['S']
        code = feature.get('code', {}).get('S', '')
        included = feature.get('includedPlans', {}).get('S', '')
        if 'ATS_ENTERPRISE' in included:
            plans_list = [p.strip() for p in included.split(',') if p.strip() != 'ATS_ENTERPRISE']
            new_plans = ','.join(plans_list)
            key = {'PK': {'S': 'PLATFORM'}, 'SK': {'S': f'FEATURE#{fid}'}}
            ok, err = update_item(key, {'includedPlans': {'S': new_plans}})
            if ok:
                cleaned += 1
                print(f"  CLEAN {code:30s} removed ATS_ENTERPRISE -> {new_plans}")

    print(f"  -> {created} records seeded, {cleaned} ATS_ENTERPRISE refs cleaned")
    return created


# ============================================================
# 11b. FIX ADMIN USER COGNITO DISPLAY NAME
# ============================================================

def fix_admin_cognito_name():
    """Update the Admin user's Cognito given_name/family_name to show 'System Admin'
    instead of a personal name like 'Yolanda' in the navbar."""
    print("\n" + "="*50)
    print(" Fixing Admin User Cognito Display Name")
    print("="*50)

    env = {**os.environ, 'AWS_PROFILE': 'alusa-dev'}

    # Look up the admin user by sub (Cognito UUID)
    result = subprocess.run(
        ['aws', 'cognito-idp', 'list-users',
         '--user-pool-id', COGNITO_USER_POOL_ID,
         '--filter', f'sub = "{ADMIN_ID}"',
         '--region', REGION],
        capture_output=True, text=True, env=env)

    if result.returncode != 0:
        print(f"  ✗ Failed to look up admin user: {result.stderr.strip()[:120]}")
        return 0

    users = json.loads(result.stdout).get('Users', [])
    if not users:
        print(f"  ✗ No user found with sub={ADMIN_ID}")
        return 0

    admin_username = users[0]['Username']
    print(f"  Found admin user: {admin_username}")

    # Update display name attributes
    update = subprocess.run(
        ['aws', 'cognito-idp', 'admin-update-user-attributes',
         '--user-pool-id', COGNITO_USER_POOL_ID,
         '--username', admin_username,
         '--user-attributes',
         'Name=given_name,Value=System',
         'Name=family_name,Value=Admin',
         '--region', REGION],
        capture_output=True, text=True, env=env)

    if update.returncode == 0:
        print("  ✓ Updated admin display name to 'System Admin'")
        return 1
    else:
        print(f"  ✗ Failed to update attributes: {update.stderr.strip()[:120]}")
        return 0


# ============================================================
# 12. CREATE YOLANDA NKOSI — TA Specialist user in Cognito
# ============================================================
COGNITO_USER_POOL_ID = "af-south-1_P5xpdGVds"
YOLANDA_EMAIL = "yolanda.gaba@idc.shumelahire.co.za"
YOLANDA_PASSWORD = "IdcDemo-2026"

def create_yolanda_cognito_user():
    """Create Yolanda Gaba as a HIRING_MANAGER user in Cognito for IDC tenant."""
    print("\n" + "="*50)
    print(" Creating Yolanda Gaba (Cognito — TA Specialist)")
    print("="*50)

    env = {**os.environ, 'AWS_PROFILE': 'alusa-dev'}

    # Check if user already exists
    check = subprocess.run(
        ['aws', 'cognito-idp', 'admin-get-user',
         '--user-pool-id', COGNITO_USER_POOL_ID,
         '--username', YOLANDA_EMAIL,
         '--region', REGION],
        capture_output=True, text=True, env=env)

    if check.returncode == 0:
        print(f"  ✓ User already exists: {YOLANDA_EMAIL}")
        # Ensure correct group membership
        subprocess.run(
            ['aws', 'cognito-idp', 'admin-add-user-to-group',
             '--user-pool-id', COGNITO_USER_POOL_ID,
             '--username', YOLANDA_EMAIL,
             '--group-name', 'HIRING_MANAGER',
             '--region', REGION],
            capture_output=True, text=True, env=env)
        print(f"  ✓ Ensured HIRING_MANAGER group membership")
        return 1

    # Create user
    result = subprocess.run(
        ['aws', 'cognito-idp', 'admin-create-user',
         '--user-pool-id', COGNITO_USER_POOL_ID,
         '--username', YOLANDA_EMAIL,
         '--user-attributes',
         'Name=email,Value=' + YOLANDA_EMAIL,
         'Name=given_name,Value=Yolanda',
         'Name=family_name,Value=Gaba',
         'Name=email_verified,Value=true',
         'Name=custom:tenant_id,Value=idc',
         '--message-action', 'SUPPRESS',
         '--region', REGION],
        capture_output=True, text=True, env=env)

    if result.returncode != 0:
        print(f"  ✗ Failed to create user: {result.stderr.strip()[:120]}")
        return 0

    print(f"  ✓ Created user: {YOLANDA_EMAIL}")

    # Set password
    pwd_result = subprocess.run(
        ['aws', 'cognito-idp', 'admin-set-user-password',
         '--user-pool-id', COGNITO_USER_POOL_ID,
         '--username', YOLANDA_EMAIL,
         '--password', YOLANDA_PASSWORD,
         '--permanent',
         '--region', REGION],
        capture_output=True, text=True, env=env)

    if pwd_result.returncode == 0:
        print(f"  ✓ Set password")
    else:
        print(f"  ✗ Failed to set password: {pwd_result.stderr.strip()[:120]}")

    # Add to HIRING_MANAGER group
    grp_result = subprocess.run(
        ['aws', 'cognito-idp', 'admin-add-user-to-group',
         '--user-pool-id', COGNITO_USER_POOL_ID,
         '--username', YOLANDA_EMAIL,
         '--group-name', 'HIRING_MANAGER',
         '--region', REGION],
        capture_output=True, text=True, env=env)

    if grp_result.returncode == 0:
        print(f"  ✓ Added to HIRING_MANAGER group")
    else:
        print(f"  ✗ Failed to add to group: {grp_result.stderr.strip()[:120]}")

    return 1


# ============================================================
# 13. REFRESH INTERVIEWS — delete stale and re-seed with fresh dates
# ============================================================
def refresh_interviews():
    """Delete existing seeded interviews and re-seed with fresh future dates."""
    print("\n" + "="*50)
    print(" Refreshing Interview Dates")
    print("="*50)

    # Delete existing seeded interviews (they have stale dates)
    interviews = query_items(f'TENANT#{TENANT_ID}', 'INTERVIEW#')
    deleted = 0
    for interview in interviews:
        iid = interview['id']['S']
        key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'INTERVIEW#{iid}'}}
        ok, err = delete_item(key)
        if ok:
            deleted += 1
    print(f"  Deleted {deleted} stale interviews")

    # Re-seed with fresh dates via seed_interviews + Thandi's interview
    created = seed_interviews()

    # Seed a specific interview for Thandi Molefe
    thandi_interview_id = new_id("interview-thandi")
    sched_dt = now + timedelta(days=1, hours=10 - now.hour)
    sched = iso(sched_dt)

    thandi_interview = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'INTERVIEW#{thandi_interview_id}'},
        'GSI1PK': {'S': f'INTERVIEW_STATUS#SCHEDULED'},
        'GSI1SK': {'S': f'INTERVIEW#{sched}'},
        'GSI2PK': {'S': f'INTERVIEW_APP#{THANDI_APP_ID}'},
        'GSI2SK': {'S': f'INTERVIEW#{sched}'},
        'GSI5PK': {'S': f'INTERVIEW_INTERVIEWER#{ADMIN_ID}'},
        'GSI5SK': {'S': f'INTERVIEW#{sched}'},
        'GSI6PK': {'S': f'INTERVIEW_DATE#{TENANT_ID}'},
        'GSI6SK': {'S': sched},
        'id': {'S': thandi_interview_id},
        'tenantId': {'S': TENANT_ID},
        'applicationId': {'S': THANDI_APP_ID},
        'title': {'S': 'Panel Interview — Senior Investment Analyst'},
        'type': {'S': 'PANEL'},
        'round': {'S': 'FIRST_ROUND'},
        'status': {'S': 'SCHEDULED'},
        'scheduledAt': {'S': sched},
        'durationMinutes': {'N': '60'},
        'location': {'S': 'IDC Boardroom A, 19 Fredman Drive, Sandton'},
        'interviewerId': {'S': ADMIN_ID},
        'interviewerName': {'S': 'Yolanda Gaba'},
        'candidateName': {'S': 'Thandi Molefe'},
        'createdBy': {'S': ADMIN_ID},
        'createdAt': {'S': iso(now - timedelta(days=2))},
        'updatedAt': {'S': now_iso},
    }

    ok, err = put_item(thandi_interview)
    day = sched_dt.strftime('%a %d %b')
    time_str = sched_dt.strftime('%H:%M')
    print(f"  📅 {day} {time_str} — PANEL    FIRST_ROUND     Thandi Molefe        {'OK' if ok else 'FAIL'} {err}")
    if ok:
        created += 1

    # Also update Thandi's application status to INTERVIEW_SCHEDULED
    key = {'PK': {'S': f'TENANT#{TENANT_ID}'}, 'SK': {'S': f'APPLICATION#{THANDI_APP_ID}'}}
    update_item(key, {
        'status': {'S': 'INTERVIEW_SCHEDULED'},
        'pipelineStage': {'S': 'FIRST_INTERVIEW'},
        'updatedAt': {'S': now_iso},
    })
    print(f"  ✓ Thandi's application → INTERVIEW_SCHEDULED")

    print(f"  → {created} interviews seeded (fresh dates)")
    return created


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 50)
    print(" IDC Screenshot Data Seeder (DynamoDB Direct)")
    print("=" * 50)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print(f" Region: {REGION}")

    thandi = seed_thandi_molefe()
    fresh_interviews = refresh_interviews()
    salary_recs = seed_salary_recommendations()
    offer_updates = update_offer_statuses()
    pool_entries = seed_talent_pool_entries()
    cleanup_test_data()

    # Data fixes for screenshot issues
    req_titles = fix_blank_requisition_titles()
    posting_counts = fix_job_posting_counts()
    candidate_fixes = fix_unknown_candidates()
    pool_dedup = fix_duplicate_talent_pools()
    metrics = seed_recruitment_metrics()
    tenant_settings = update_tenant_settings()
    modules = seed_platform_modules()
    admin_name = fix_admin_cognito_name()
    yolanda = create_yolanda_cognito_user()

    print("\n" + "=" * 50)
    print(" Summary")
    print("=" * 50)
    print(f"  Thandi Molefe:        {thandi}")
    print(f"  Interviews (fresh):   {fresh_interviews}")
    print(f"  Salary recs:          {salary_recs}")
    print(f"  Offer updates:        {offer_updates}")
    print(f"  Pool entries:         {pool_entries}")
    print(f"  Requisition titles:   {req_titles}")
    print(f"  Job posting counts:   {posting_counts}")
    print(f"  Candidate name fixes: {candidate_fixes}")
    print(f"  Pool dedup:           {pool_dedup}")
    print(f"  Recruitment metrics:  {metrics}")
    print(f"  Tenant settings:      {tenant_settings}")
    print(f"  Platform modules:     {modules}")
    print(f"  Admin name fix:       {admin_name}")
    print(f"  Yolanda (Cognito):    {yolanda}")
    print()
    print("  Next: node capture_idc_screens.js")
    print()


if __name__ == '__main__':
    main()
