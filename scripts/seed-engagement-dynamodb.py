#!/usr/bin/env python3
"""
Direct DynamoDB engagement data seeder.

Creates a pulse survey with partial responses, recognition entries,
and attrition risk scores for the engagement dashboard.
"""
import json, os, sys, uuid, subprocess, random
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', 'uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')
random.seed(42)  # deterministic for idempotent seeding


def new_id(): return str(uuid.uuid4())
def iso(dt): return dt.strftime('%Y-%m-%dT%H:%M:%S')
def days_ago(n): return now - timedelta(days=n)


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


def resolve_employees():
    result = subprocess.run(
        ['aws', 'dynamodb', 'query',
         '--table-name', TABLE_NAME, '--region', REGION,
         '--key-condition-expression', 'PK = :pk AND begins_with(SK, :sk)',
         '--expression-attribute-values', json.dumps({
             ':pk': {'S': f'TENANT#{TENANT_ID}'}, ':sk': {'S': 'EMPLOYEE#'}
         }),
         '--projection-expression', 'id,firstName,lastName,department',
         '--output', 'json'], capture_output=True, text=True)
    items = json.loads(result.stdout).get('Items', [])
    return [{
        'id': i['id']['S'],
        'firstName': i.get('firstName', {}).get('S', ''),
        'lastName': i.get('lastName', {}).get('S', ''),
        'department': i.get('department', {}).get('S', ''),
    } for i in items]


# ============================================================
# Pulse Survey
# ============================================================
QUESTIONS = [
    {"text": "I feel valued and recognised for my contributions at uThukela Water.", "type": "RATING"},
    {"text": "My manager provides clear direction and regular feedback.", "type": "RATING"},
    {"text": "I have the tools and resources I need to do my job effectively.", "type": "RATING"},
    {"text": "I would recommend uThukela Water as a great place to work.", "type": "RATING"},
    {"text": "Communication from leadership about organisational changes is transparent.", "type": "RATING"},
    {"text": "I feel safe reporting health and safety concerns without fear of reprisal.", "type": "RATING"},
    {"text": "My workload is manageable and I maintain a healthy work-life balance.", "type": "RATING"},
    {"text": "What one thing could uThukela Water do to improve your experience?", "type": "TEXT"},
]

# Employee response profiles: (responded?, ratings_for_q1-q7, text_for_q8)
RESPONSE_PROFILES = [
    # Sipho — responded, generally positive (manager)
    (True, [4, 4, 5, 5, 4, 5, 3], "More budget for infrastructure maintenance tools."),
    # Nomvula — responded, positive
    (True, [5, 5, 4, 5, 4, 5, 4], "Continue investing in training and development programmes."),
    # Thabo — responded, very positive
    (True, [5, 4, 5, 5, 5, 5, 4], "The new SCADA training was excellent — more of that please."),
    # Pieter — responded, mixed
    (True, [3, 3, 4, 4, 3, 4, 2], "Improve communication between finance and operations teams."),
    # Lindiwe — responded, positive
    (True, [4, 5, 3, 4, 4, 5, 3], "Better equipment at Estcourt treatment works would help a lot."),
    # Bongani — NOT responded
    (False, None, None),
    # Ayanda — responded, positive
    (True, [5, 4, 4, 5, 3, 4, 4], "Community engagement budget could be increased for outreach."),
    # Johan — responded, mixed-positive
    (True, [4, 3, 4, 4, 3, 5, 3], "Succession planning needs more attention — several senior staff retiring soon."),
    # Zanele — NOT responded
    (False, None, None),
    # Mandla — NOT responded
    (False, None, None),
]


def seed_survey(employees):
    print("Seeding pulse survey...")
    nomvula = next((e for e in employees if e['firstName'] == 'Nomvula'), employees[0] if employees else {'id': ''})
    survey_id = new_id()
    created = iso(days_ago(14))

    item = {
        'PK': {'S': f'TENANT#{TENANT_ID}'},
        'SK': {'S': f'SURVEY#{survey_id}'},
        'GSI1PK': {'S': f'SURVEY_STATUS#{TENANT_ID}#ACTIVE'},
        'GSI1SK': {'S': f'SURVEY#{created}'},
        'id': {'S': survey_id},
        'tenantId': {'S': TENANT_ID},
        'title': {'S': 'Q3 2025/26 Employee Pulse Survey'},
        'description': {'S': 'Quarterly pulse check on employee engagement, satisfaction, and wellbeing across uThukela Water. Your anonymous feedback helps us improve the workplace for everyone.'},
        'status': {'S': 'ACTIVE'},
        'isAnonymous': {'BOOL': True},
        'startDate': {'S': days_ago(14).strftime('%Y-%m-%d')},
        'endDate': {'S': days_ago(-7).strftime('%Y-%m-%d')},
        'createdBy': {'S': nomvula['id']},
        'createdAt': {'S': created},
        'updatedAt': {'S': now_iso},
    }
    ok, _ = put_item(item)
    print(f"  {'OK' if ok else 'SKIP'}  Q3 Pulse Survey (ACTIVE, {len(QUESTIONS)} questions)")
    return survey_id


def seed_questions(survey_id):
    print("\nSeeding survey questions...")
    q_ids = []
    for i, q in enumerate(QUESTIONS):
        qid = new_id()
        padded = str(i + 1).zfill(6)
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'SURVEY_Q#{qid}'},
            'GSI1PK': {'S': f'SURVQ_SURV#{TENANT_ID}#{survey_id}'},
            'GSI1SK': {'S': f'SURVEY_Q#{padded}#{qid}'},
            'id': {'S': qid},
            'tenantId': {'S': TENANT_ID},
            'surveyId': {'S': survey_id},
            'questionText': {'S': q['text']},
            'questionType': {'S': q['type']},
            'displayOrder': {'N': str(i)},
            'isRequired': {'BOOL': True},
            'createdAt': {'S': iso(days_ago(14))},
        }
        if q['type'] == 'RATING':
            item['options'] = {'S': json.dumps(["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"])}
        put_item(item)
        q_ids.append(qid)
    print(f"  OK  {len(q_ids)} questions created")
    return q_ids


def seed_responses(survey_id, q_ids, employees):
    print("\nSeeding survey responses...")
    responded = 0
    pending = 0

    for i, emp in enumerate(employees):
        if i >= len(RESPONSE_PROFILES):
            break
        did_respond, ratings, text_answer = RESPONSE_PROFILES[i]
        name = f"{emp['firstName']} {emp['lastName']}"

        if not did_respond:
            pending += 1
            print(f"  [ ] {name:25s} not responded")
            continue

        # Create responses for each question
        for j, qid in enumerate(q_ids):
            rid = new_id()
            resp_time = iso(days_ago(random.randint(1, 12)))
            item = {
                'PK': {'S': f'TENANT#{TENANT_ID}'},
                'SK': {'S': f'SURVEY_R#{rid}'},
                'GSI1PK': {'S': f'SURVR_SURV#{TENANT_ID}#{survey_id}'},
                'GSI1SK': {'S': f'SURVEY_R#{resp_time}'},
                'id': {'S': rid},
                'tenantId': {'S': TENANT_ID},
                'surveyId': {'S': survey_id},
                'questionId': {'S': qid},
                'employeeId': {'S': emp['id']},
                'createdAt': {'S': resp_time},
            }
            if j < len(ratings):
                item['rating'] = {'N': str(ratings[j])}
            elif text_answer:
                item['textResponse'] = {'S': text_answer}
            put_item(item)

        avg = sum(ratings) / len(ratings) if ratings else 0
        responded += 1
        print(f"  [v] {name:25s} avg rating: {avg:.1f}/5")

    print(f"\n  Response rate: {responded}/{responded + pending} ({100 * responded // (responded + pending)}%)")
    return responded


def seed_recognitions(employees):
    print("\nSeeding peer recognitions...")
    by_name = {e['firstName']: e for e in employees}

    recognitions = [
        ("Nomvula", "Sipho",   "LEADERSHIP",      50, "Outstanding leadership during the Newcastle water crisis — kept the team focused and the community informed throughout."),
        ("Sipho",   "Thabo",   "INNOVATION",       40, "Brilliant solution for the membrane filtration upgrade. The new process saves 30% on chemical costs."),
        ("Thabo",   "Lindiwe", "GOING_ABOVE",      35, "Lindiwe worked through the weekend to ensure water quality compliance during the Estcourt plant maintenance shutdown."),
        ("Nomvula", "Ayanda",  "CUSTOMER_SERVICE",  30, "Exceptional community engagement at the Ladysmith water conservation event. Positive feedback from all ward councillors."),
        ("Sipho",   "Johan",   "TEAMWORK",          25, "Johan's mentoring of the junior maintenance crew has significantly improved team capability and morale."),
        ("Pieter",  "Zanele",  "TEAMWORK",          20, "Great job on the quarterly SCM report — thorough and submitted ahead of deadline."),
        ("Ayanda",  "Nomvula", "LEADERSHIP",        45, "Nomvula's new onboarding programme has made a real difference — new hires are settling in much faster."),
        ("Thabo",   "Mandla",  "INNOVATION",        15, "Good initiative on the automated water quality sampling schedule. Shows real promise."),
        ("Johan",   "Bongani", "GOING_ABOVE",       20, "Fixed the network outage at Newcastle office on a Saturday — prevented data loss for the entire week's readings."),
        ("Lindiwe", "Sipho",   "LEADERSHIP",        40, "Sipho's calm leadership during the January drought was instrumental in managing water rationing."),
    ]

    created = 0
    for from_name, to_name, category, points, message in recognitions:
        from_emp = by_name.get(from_name)
        to_emp = by_name.get(to_name)
        if not from_emp or not to_emp:
            continue
        rid = new_id()
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'RECOGNITION#{rid}'},
            'GSI1PK': {'S': f'RECOG_TO#{TENANT_ID}#{to_emp["id"]}'},
            'GSI1SK': {'S': f'RECOGNITION#{iso(days_ago(random.randint(1, 30)))}'},
            'id': {'S': rid},
            'tenantId': {'S': TENANT_ID},
            'fromEmployeeId': {'S': from_emp['id']},
            'toEmployeeId': {'S': to_emp['id']},
            'category': {'S': category},
            'message': {'S': message},
            'points': {'N': str(points)},
            'isPublic': {'BOOL': True},
            'createdAt': {'S': iso(days_ago(random.randint(1, 30)))},
        }
        ok, _ = put_item(item)
        if ok:
            created += 1
    print(f"  OK  {created} recognitions created")
    return created


def seed_attrition_risk(employees):
    print("\nSeeding attrition risk scores...")
    # (risk_score, risk_level, key_factors)
    profiles = [
        ("0.15", "LOW",      '{"tenure":"7 years","engagement":"high","recentPromotion":true,"leavePattern":"normal"}'),
        ("0.10", "LOW",      '{"tenure":"6 years","engagement":"high","recentTraining":true,"leavePattern":"normal"}'),
        ("0.08", "LOW",      '{"tenure":"8 years","engagement":"very high","recentPromotion":true,"leavePattern":"normal"}'),
        ("0.45", "MEDIUM",   '{"tenure":"5 years","engagement":"moderate","noRecentPromotion":true,"workloadConcerns":true}'),
        ("0.22", "LOW",      '{"tenure":"7 years","engagement":"high","healthConcerns":true,"leavePattern":"elevated sick leave"}'),
        ("0.55", "MEDIUM",   '{"tenure":"2 years","engagement":"moderate","limitedGrowth":true,"skillsGap":true}'),
        ("0.12", "LOW",      '{"tenure":"6 years","engagement":"high","communityTies":true,"leavePattern":"normal"}'),
        ("0.35", "MEDIUM",   '{"tenure":"9 years","engagement":"moderate","retirementApproaching":true,"noSuccessor":true}'),
        ("0.60", "HIGH",     '{"tenure":"3 years","engagement":"low","noRecentTraining":true,"pendingLeaveRequests":true,"lowSurveyResponse":true}'),
        ("0.52", "MEDIUM",   '{"tenure":"2 years","engagement":"moderate","earlyCareer":true,"limitedMentoring":true}'),
    ]

    created = 0
    for i, emp in enumerate(employees):
        if i >= len(profiles):
            break
        score, level, factors = profiles[i]
        rid = new_id()
        calc_time = iso(days_ago(1))
        item = {
            'PK': {'S': f'TENANT#{TENANT_ID}'},
            'SK': {'S': f'ATTRITION_RISK#{rid}'},
            'GSI1PK': {'S': f'ATTR_EMP#{TENANT_ID}#{emp["id"]}'},
            'GSI1SK': {'S': f'ATTRITION_RISK#{calc_time}'},
            'id': {'S': rid},
            'tenantId': {'S': TENANT_ID},
            'employeeId': {'S': emp['id']},
            'riskScore': {'S': score},
            'riskLevel': {'S': level},
            'factors': {'S': factors},
            'calculatedAt': {'S': calc_time},
            'createdAt': {'S': calc_time},
        }
        ok, _ = put_item(item)
        if ok:
            created += 1
        icon = {'LOW': '.', 'MEDIUM': '!', 'HIGH': 'X', 'CRITICAL': '!!'}[level]
        name = f"{emp['firstName']} {emp['lastName']}"
        print(f"  [{icon}] {name:25s} {level:8s} ({score})")

    return created


def main():
    resolve_table()
    print("=" * 60)
    print(" uThukela Water — Engagement & Survey Seeder (DynamoDB)")
    print("=" * 60)
    print(f" Table:  {TABLE_NAME}")
    print(f" Tenant: {TENANT_ID}")
    print("=" * 60)
    print()

    employees = resolve_employees()
    if not employees:
        print("ERROR: No employees found", file=sys.stderr)
        sys.exit(1)
    print(f"Found {len(employees)} employees")

    survey_id = seed_survey(employees)
    q_ids = seed_questions(survey_id)
    resp_count = seed_responses(survey_id, q_ids, employees)
    recog_count = seed_recognitions(employees)
    risk_count = seed_attrition_risk(employees)

    print()
    print(f"Done: 1 survey ({len(QUESTIONS)} questions, {resp_count} respondents), {recog_count} recognitions, {risk_count} risk scores")


if __name__ == '__main__':
    main()
