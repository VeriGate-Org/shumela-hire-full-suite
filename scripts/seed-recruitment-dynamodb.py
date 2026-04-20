#!/usr/bin/env python3
"""
Direct DynamoDB recruitment pipeline seeder.

Creates one open job posting with 8 applicants at various pipeline stages:
  - 2 NEW (just submitted)
  - 2 SCREENED (under review)
  - 2 INTERVIEWED (completed interviews with feedback)
  - 2 SHORTLISTED (reference check / offer pending)
"""
import json, os, sys, uuid, base64, subprocess, hashlib
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')
now_epoch = int(now.timestamp())

_id_counter = 0

def new_id(unique_key=None):
    """Generate a deterministic UUID so re-runs produce the same IDs."""
    global _id_counter
    if unique_key is None:
        _id_counter += 1
        unique_key = f"recruit-{_id_counter}"
    seed = f"{TENANT_ID}:{unique_key}"
    return str(uuid.UUID(hashlib.sha256(seed.encode()).hexdigest()[:32]))

def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')

def date_str(dt):
    return dt.strftime('%Y-%m-%d')

def days_ago(n):
    return now - timedelta(days=n)


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


def get_encryption_key():
    result = subprocess.run(
        ['aws', 'secretsmanager', 'get-secret-value',
         '--secret-id', 'shumelahire/dev/encryption-key',
         '--region', REGION, '--query', 'SecretString', '--output', 'text'],
        capture_output=True, text=True)
    key_b64 = result.stdout.strip()
    if not key_b64:
        return None
    return base64.b64decode(key_b64)


def encrypt_pii(plaintext, key_bytes):
    if not plaintext or not key_bytes:
        return plaintext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = os.urandom(12)
    ct = AESGCM(key_bytes).encrypt(iv, plaintext.encode('utf-8'), None)
    return base64.b64encode(iv + ct).decode('utf-8')


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
    items = json.loads(result.stdout).get('Items', [])
    return {i.get('firstName', {}).get('S', ''): i['id']['S'] for i in items}


# ============================================================
# Data
# ============================================================

APPLICANTS = [
    {"name": "Themba", "surname": "Nkosi", "email": "themba.nkosi@gmail.com", "phone": "+27 82 100 2001", "idNum": "9405125123091", "location": "Durban, KwaZulu-Natal", "education": "B.Eng Civil Engineering (UKZN), GCC Mines & Works", "experience": "6 years at Umgeni Water as Process Controller, 2 years at DWS regional office", "skills": "Water treatment, SCADA, SANS 241, pipeline design, AutoCAD", "source": "LinkedIn"},
    {"name": "Precious", "surname": "Mabaso", "email": "precious.mabaso@outlook.com", "phone": "+27 83 200 3002", "idNum": "9108200234092", "location": "Pietermaritzburg, KwaZulu-Natal", "education": "BTech Chemical Engineering (DUT), Blue Drop certification", "experience": "5 years at eThekwini Municipality Water & Sanitation, 3 years at Rand Water", "skills": "Water quality testing, process optimisation, MFMA, project management", "source": "Indeed"},
    {"name": "Sifiso", "surname": "Mthethwa", "email": "sifiso.mthethwa@yahoo.com", "phone": "+27 84 300 4003", "idNum": "8807155123093", "location": "Richards Bay, KwaZulu-Natal", "education": "B.Eng Chemical Engineering (Wits), MSc Water Resource Management (Stellenbosch)", "experience": "10 years at uMhlathuze Water, lead engineer on R45M treatment plant upgrade", "skills": "Treatment plant design, membrane filtration, project management, budgeting", "source": "Company Website"},
    {"name": "Naledi", "surname": "Mokoena", "email": "naledi.mokoena@gmail.com", "phone": "+27 82 400 5004", "idNum": "9502200234094", "location": "Johannesburg, Gauteng", "education": "BSc Hons Environmental Science (Wits), Water Treatment Certificate", "experience": "4 years at Joburg Water, 1 year at Aurecon (consulting)", "skills": "Environmental compliance, GIS, water quality monitoring, SANS 241", "source": "Referral"},
    {"name": "Lungile", "surname": "Hadebe", "email": "lungile.hadebe@gmail.com", "phone": "+27 83 500 6005", "idNum": "9003155123095", "location": "Newcastle, KwaZulu-Natal", "education": "National Diploma Water Care (Mangosuthu TUT), Process Controller Class 1", "experience": "7 years local municipal water treatment, acting shift supervisor 2 years", "skills": "Water treatment operations, SCADA, preventive maintenance, OHS compliance", "source": "Walk-in"},
    {"name": "Andile", "surname": "Sithole", "email": "andile.sithole@hotmail.com", "phone": "+27 84 600 7006", "idNum": "9207155123096", "location": "Ladysmith, KwaZulu-Natal", "education": "B.Eng Mechanical Engineering (UKZN)", "experience": "5 years at Sappi (process engineering), 1 year at consulting firm", "skills": "Mechanical design, pump systems, pipeline maintenance, AutoCAD", "source": "LinkedIn"},
    {"name": "Zanele", "surname": "Buthelezi", "email": "zanele.buthelezi@gmail.com", "phone": "+27 82 700 8007", "idNum": "9309200234097", "location": "Empangeni, KwaZulu-Natal", "education": "BSc Chemistry (UNIZULU), Postgrad Diploma Water Utilities Management", "experience": "4 years KZN DWS lab technician, 2 years municipal water quality officer", "skills": "Water quality testing, laboratory management, SANS 241, regulatory reporting", "source": "Indeed"},
    {"name": "Buhle", "surname": "Ngubane", "email": "buhle.ngubane@outlook.com", "phone": "+27 83 800 9008", "idNum": "8811200234098", "location": "Dundee, KwaZulu-Natal", "education": "BTech Civil Engineering (DUT), Project Management Professional (PMP)", "experience": "8 years at Endumeni Municipality infrastructure, 3 years water reticulation", "skills": "Infrastructure planning, project management, GIS, community engagement, isiZulu", "source": "Company Website"},
]


def seed_job_posting(emp_ids):
    print("Seeding job posting...")
    posting_id = new_id()
    slug = "senior-water-process-engineer-newcastle"
    created = iso(days_ago(21))
    published = iso(days_ago(18))
    deadline = iso(now + timedelta(days=14))
    sipho_id = emp_ids.get('Sipho', '')
    nomvula_id = emp_ids.get('Nomvula', '')

    item = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'JOB_POSTING#{posting_id}'},
        'GSI1PK': {'S': 'POSTING_STATUS#PUBLISHED'},
        'GSI1SK': {'S': f'JOB_POSTING#{created}'},
        'GSI2PK': {'S': f'POSTING_CREATOR#{nomvula_id}'},
        'GSI2SK': {'S': f'JOB_POSTING#{created}'},
        'GSI3PK': {'S': 'POSTING_DEPT#Water Services'},
        'GSI3SK': {'S': f'JOB_POSTING#{created}'},
        'GSI4PK': {'S': f'POSTING_SLUG#{TENANT_ID}#{slug}'},
        'GSI4SK': {'S': f'JOB_POSTING#{posting_id}'},
        'GSI6PK': {'S': f'POSTING_CREATED#{TENANT_ID}'},
        'GSI6SK': {'S': f'JOB_POSTING#{created}'},
        'id': {'S': posting_id},
        'tenantId': {'S': TENANT_ID},
        'title': {'S': 'Senior Water Process Engineer'},
        'department': {'S': 'Water Services'},
        'location': {'S': 'Newcastle Head Office'},
        'employmentType': {'S': 'FULL_TIME'},
        'experienceLevel': {'S': 'SENIOR'},
        'description': {'S': 'uThukela Water seeks a Senior Water Process Engineer to lead the design, optimisation, and operation of water treatment processes across the district. The successful candidate will oversee water quality compliance (SANS 241), manage capital projects, and mentor junior process controllers.'},
        'requirements': {'S': 'B.Eng/BTech in Chemical, Civil, or Process Engineering. Minimum 5 years in water treatment. Process Controller Class 1 or equivalent. Valid driver\'s licence. GCC advantageous.'},
        'responsibilities': {'S': 'Lead water treatment plant operations and optimisation. Ensure SANS 241 compliance across all treatment works. Manage capital upgrade projects (budget R5M–R50M). Mentor and develop process controllers. Liaise with DWS and Blue Drop assessors.'},
        'qualifications': {'S': 'B.Eng/BTech Chemical, Civil, or Process Engineering. Process Controller Class 1. GCC Mines & Works (advantageous). PMP (advantageous).'},
        'benefits': {'S': 'Competitive salary (R650,000 – R850,000 CTC). Medical aid contribution. Pension fund. Housing subsidy. 21 days annual leave. Study assistance programme.'},
        'salaryMin': {'S': '650000'},
        'salaryMax': {'S': '850000'},
        'salaryCurrency': {'S': 'ZAR'},
        'remoteWorkAllowed': {'BOOL': False},
        'travelRequired': {'BOOL': True},
        'applicationDeadline': {'S': deadline},
        'positionsAvailable': {'N': '1'},
        'status': {'S': 'PUBLISHED'},
        'createdBy': {'S': nomvula_id},
        'approvedBy': {'S': sipho_id},
        'publishedBy': {'S': nomvula_id},
        'slug': {'S': slug},
        'featured': {'BOOL': True},
        'urgent': {'BOOL': False},
        'viewsCount': {'N': '247'},
        'applicationsCount': {'N': '8'},
        'createdAt': {'S': created},
        'updatedAt': {'S': published},
        'approvedAt': {'S': iso(days_ago(19))},
        'publishedAt': {'S': published},
    }
    ok, err = put_item(item)
    print(f"  {'OK' if ok else 'FAIL'}  {item['title']['S']}" + (f" — {err}" if err else ""))

    # Job Ad
    ad_id = new_id()
    ad_item = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'JOB_AD#{ad_id}'},
        'GSI1PK': {'S': 'JOBAD_STATUS#PUBLISHED'},
        'GSI1SK': {'S': f'JOB_AD#{published}'},
        'GSI2PK': {'S': f'JOBAD_POSTING#{posting_id}'},
        'GSI2SK': {'S': f'JOB_AD#{ad_id}'},
        'GSI4PK': {'S': f'JOBAD_SLUG#{TENANT_ID}#{slug}'},
        'GSI4SK': {'S': f'JOB_AD#{ad_id}'},
        'GSI6PK': {'S': f'JOBAD_CREATED#{TENANT_ID}'},
        'GSI6SK': {'S': f'JOB_AD#{published}'},
        'id': {'S': ad_id},
        'tenantId': {'S': TENANT_ID},
        'jobPostingId': {'S': posting_id},
        'title': {'S': 'Senior Water Process Engineer'},
        'status': {'S': 'PUBLISHED'},
        'channelInternal': {'BOOL': True},
        'channelExternal': {'BOOL': True},
        'closingDate': {'S': date_str(now + timedelta(days=14))},
        'slug': {'S': slug},
        'createdBy': {'S': nomvula_id},
        'createdAt': {'S': published},
        'updatedAt': {'S': published},
        'department': {'S': 'Water Services'},
        'location': {'S': 'Newcastle Head Office'},
        'employmentType': {'S': 'FULL_TIME'},
        'salaryRangeMin': {'S': '650000'},
        'salaryRangeMax': {'S': '850000'},
        'salaryCurrency': {'S': 'ZAR'},
    }
    ok, _ = put_item(ad_item)
    print(f"  {'OK' if ok else 'FAIL'}  Job Ad (PUBLISHED)")

    return posting_id


def seed_applicants_and_applications(posting_id, emp_ids, key_bytes):
    print("\nSeeding applicants and applications...")
    sipho_id = emp_ids.get('Sipho', '')
    nomvula_id = emp_ids.get('Nomvula', '')
    thabo_id = emp_ids.get('Thabo', '')

    # Pipeline stage assignments:
    # [0-1] SUBMITTED (new), [2-3] SCREENING, [4-5] INTERVIEW_COMPLETED, [6-7] REFERENCE_CHECK (shortlisted)
    stages = [
        {"status": "SUBMITTED",            "daysAgo": 2,  "label": "NEW"},
        {"status": "SUBMITTED",            "daysAgo": 1,  "label": "NEW"},
        {"status": "SCREENING",            "daysAgo": 10, "label": "SCREENED",     "screeningNotes": "Strong technical background. 8 years experience exceeds requirements. Process Controller Class 1 verified. Recommend for interview."},
        {"status": "SCREENING",            "daysAgo": 8,  "label": "SCREENED",     "screeningNotes": "Good qualifications. BSc Hons relevant. 5 years combined experience meets minimum. Check Aurecon reference. Recommend for interview."},
        {"status": "INTERVIEW_COMPLETED",  "daysAgo": 14, "label": "INTERVIEWED",  "screeningNotes": "Excellent candidate. MSc + 10 years. Led R45M project. Fast-track.", "interviewFeedback": "Outstanding technical depth. Led major projects. Strong leadership. Top candidate.", "rating": "5"},
        {"status": "INTERVIEW_COMPLETED",  "daysAgo": 12, "label": "INTERVIEWED",  "screeningNotes": "7 years local experience. Process Controller Class 1. Knows the area.", "interviewFeedback": "Good practical knowledge. Familiar with local infrastructure. Communication skills need development.", "rating": "3"},
        {"status": "REFERENCE_CHECK",      "daysAgo": 18, "label": "SHORTLISTED",  "screeningNotes": "Top candidate — 8 years experience, PMP certified, strong community engagement skills.", "interviewFeedback": "Exceptional. Deep infrastructure knowledge, project management, and community rapport. Highly recommended.", "rating": "5"},
        {"status": "REFERENCE_CHECK",      "daysAgo": 16, "label": "SHORTLISTED",  "screeningNotes": "Strong chemistry background. 6 years in water quality. Good regulatory knowledge.", "interviewFeedback": "Very strong on water quality and regulatory compliance. Good cultural fit. Recommended for shortlist.", "rating": "4"},
    ]

    app_ids = []
    for i, applicant in enumerate(APPLICANTS):
        stage = stages[i]
        # Create applicant
        appl_id = new_id()
        submitted = iso(days_ago(stage['daysAgo']))
        appl_item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'APPLICANT#{appl_id}'},
            'GSI1PK': {'S': f'APPLICANT_CREATED#{TENANT_ID}'},
            'GSI1SK': {'S': f'APPLICANT#{submitted}'},
            'GSI4PK': {'S': f'APPLICANT_EMAIL#{TENANT_ID}#{applicant["email"]}'},
            'GSI4SK': {'S': f'APPLICANT#{appl_id}'},
            'id': {'S': appl_id},
            'tenantId': {'S': TENANT_ID},
            'name': {'S': applicant['name']},
            'surname': {'S': applicant['surname']},
            'email': {'S': applicant['email']},
            'location': {'S': applicant['location']},
            'education': {'S': applicant['education']},
            'experience': {'S': applicant['experience']},
            'skills': {'S': applicant['skills']},
            'source': {'S': applicant['source']},
            'gender': {'S': 'Male' if i % 2 == 0 else 'Female'},
            'race': {'S': 'African'},
            'citizenshipStatus': {'S': 'South African'},
            'demographicsConsent': {'BOOL': True},
            'demographicsConsentDate': {'S': submitted},
            'createdAt': {'S': submitted},
            'updatedAt': {'S': now_iso},
        }
        if key_bytes:
            appl_item['phone'] = {'S': encrypt_pii(applicant['phone'], key_bytes)}
            appl_item['idPassportNumber'] = {'S': encrypt_pii(applicant['idNum'], key_bytes)}
            appl_item['address'] = {'S': encrypt_pii(applicant['location'], key_bytes)}
        else:
            appl_item['phone'] = {'S': applicant['phone']}

        ok, err = put_item(appl_item)

        # Create application
        app_id = new_id()
        app_item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'APPLICATION#{app_id}'},
            'GSI1PK': {'S': f'APP_STATUS#{stage["status"]}'},
            'GSI1SK': {'S': f'APP#{submitted}'},
            'GSI2PK': {'S': f'APP_JOB_POSTING#{posting_id}'},
            'GSI2SK': {'S': f'APP#{app_id}'},
            'GSI3PK': {'S': 'APP_DEPT#Water Services'},
            'GSI3SK': {'S': f'APP#{submitted}'},
            'GSI4PK': {'S': f'APP_APPLICANT#{appl_id}'},
            'GSI4SK': {'S': f'APP#{app_id}'},
            'GSI6PK': {'S': f'APP_CREATED#{TENANT_ID}'},
            'GSI6SK': {'S': f'APP#{submitted}'},
            'id': {'S': app_id},
            'tenantId': {'S': TENANT_ID},
            'applicantId': {'S': appl_id},
            'jobPostingId': {'S': posting_id},
            'jobTitle': {'S': 'Senior Water Process Engineer'},
            'department': {'S': 'Water Services'},
            'status': {'S': stage['status']},
            'pipelineStage': {'S': stage['status']},
            'pipelineStageEnteredAt': {'S': now_iso},
            'applicationSource': {'S': applicant['source']},
            'submittedAt': {'S': submitted},
            'createdAt': {'S': submitted},
            'updatedAt': {'S': now_iso},
        }
        if stage.get('screeningNotes'):
            app_item['screeningNotes'] = {'S': stage['screeningNotes']}
        if stage.get('interviewFeedback'):
            app_item['interviewFeedback'] = {'S': stage['interviewFeedback']}
            app_item['interviewedAt'] = {'S': iso(days_ago(stage['daysAgo'] - 3))}
        if stage.get('rating'):
            app_item['rating'] = {'S': stage['rating']}

        ok2, err2 = put_item(app_item)
        app_ids.append((app_id, appl_id, i))

        icon = {'NEW': '📥', 'SCREENED': '🔍', 'INTERVIEWED': '🎤', 'SHORTLISTED': '⭐'}[stage['label']]
        name = f"{applicant['name']} {applicant['surname']}"
        print(f"  {icon} {name:25s} {stage['label']:12s} ({stage['status']})")

    return app_ids


def seed_interviews(app_ids, emp_ids):
    print("\nSeeding interviews...")
    sipho_id = emp_ids.get('Sipho', '')
    thabo_id = emp_ids.get('Thabo', '')
    created = 0

    # Only create interviews for INTERVIEW_COMPLETED and REFERENCE_CHECK stages (indices 4-7)
    interview_data = [
        # index 4: Sifiso — outstanding
        (4, "COMPLETED", "TECHNICAL", "IN_PERSON", sipho_id, "Sipho Ndlovu", 5, "STRONG_HIRE",
         "Exceptional candidate. Deep understanding of treatment plant operations. Led R45M upgrade at uMhlathuze. Excellent problem-solving demonstrated in case study. Strongly recommend."),
        # index 5: Lungile — decent
        (5, "COMPLETED", "FIRST_ROUND", "IN_PERSON", sipho_id, "Sipho Ndlovu", 3, "CONSIDER",
         "Solid practical knowledge of local water infrastructure. 7 years hands-on. Communication could be stronger for senior role. Consider for second round."),
        # index 6: Buhle — excellent (shortlisted)
        (6, "COMPLETED", "TECHNICAL", "PANEL", thabo_id, "Thabo Khumalo", 5, "STRONG_HIRE",
         "Outstanding candidate. PMP certified, 8 years infrastructure experience. Excellent community engagement skills — critical for this role. Panel unanimous: highly recommend."),
        (6, "COMPLETED", "SECOND_ROUND", "IN_PERSON", sipho_id, "Sipho Ndlovu", 5, "HIRE",
         "Confirmed strong impression from panel. Detailed discussion on capital project management. Understands municipal processes. Top choice."),
        # index 7: Zanele — strong (shortlisted)
        (7, "COMPLETED", "FIRST_ROUND", "VIDEO", sipho_id, "Sipho Ndlovu", 4, "HIRE",
         "Very strong water quality expertise. 6 years laboratory + field experience. SANS 241 knowledge excellent. Good cultural fit. Recommend for shortlist."),
    ]

    for idx, status, round_name, int_type, interviewer_id, interviewer_name, rating, rec, feedback in interview_data:
        app_id, appl_id, _ = app_ids[idx]
        iid = new_id()
        sched = iso(days_ago(14 - idx))

        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'INTERVIEW#{iid}'},
            'GSI1PK': {'S': f'INTERVIEW_STATUS#{status}'},
            'GSI1SK': {'S': f'INTERVIEW#{sched}'},
            'GSI2PK': {'S': f'INTERVIEW_APP#{app_id}'},
            'GSI2SK': {'S': f'INTERVIEW#{sched}'},
            'GSI5PK': {'S': f'INTERVIEW_INTERVIEWER#{interviewer_id}'},
            'GSI5SK': {'S': f'INTERVIEW#{sched}'},
            'GSI6PK': {'S': f'INTERVIEW_DATE#{TENANT_ID}'},
            'GSI6SK': {'S': sched},
            'id': {'S': iid},
            'tenantId': {'S': TENANT_ID},
            'applicationId': {'S': app_id},
            'title': {'S': f'{round_name.replace("_", " ").title()} Interview — Senior Water Process Engineer'},
            'type': {'S': int_type},
            'round': {'S': round_name},
            'status': {'S': status},
            'scheduledAt': {'S': sched},
            'durationMinutes': {'N': '60'},
            'location': {'S': 'Newcastle Head Office, Boardroom 2'},
            'interviewerId': {'S': interviewer_id},
            'interviewerName': {'S': interviewer_name},
            'feedback': {'S': feedback},
            'rating': {'N': str(rating)},
            'recommendation': {'S': rec},
            'overallImpression': {'S': feedback[:100]},
            'completedAt': {'S': sched},
            'createdBy': {'S': interviewer_id},
            'createdAt': {'S': iso(days_ago(16))},
            'updatedAt': {'S': sched},
        }
        ok, err = put_item(item)
        if ok:
            created += 1
        else:
            print(f"  FAIL interview: {err}", file=sys.stderr)

    print(f"  OK  {created} interviews created")
    return created


def main():
    resolve_table()
    print("=" * 58)
    print(" uThukela Water — Recruitment Pipeline Seeder (DynamoDB)")
    print("=" * 58)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print("=" * 58)
    print()

    emp_ids = resolve_employees()
    if not emp_ids:
        print("ERROR: No employees found", file=sys.stderr)
        sys.exit(1)
    print(f"Found {len(emp_ids)} employees")

    key_bytes = get_encryption_key()

    posting_id = seed_job_posting(emp_ids)
    app_ids = seed_applicants_and_applications(posting_id, emp_ids, key_bytes)
    interview_count = seed_interviews(app_ids, emp_ids)

    print()
    print(f"Done: 1 job posting, 1 job ad, {len(APPLICANTS)} applicants, {len(app_ids)} applications, {interview_count} interviews")


if __name__ == '__main__':
    main()
