#!/usr/bin/env python3
"""
Direct DynamoDB feed seeder — posts, comments, and reactions for uThukela Water.
"""
import json, os, sys, uuid, subprocess, hashlib, random
from datetime import datetime, timezone, timedelta

TENANT_ID = os.environ.get('TENANT_ID', '97282820-uthukela')
REGION = os.environ.get('AWS_REGION', 'af-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', '')

now = datetime.now(timezone.utc)
now_iso = now.strftime('%Y-%m-%dT%H:%M:%S')

_counter = 0

def new_id(unique_key):
    seed = f"{TENANT_ID}:FEED:{unique_key}"
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


# Employee lookup
EMPLOYEES = {
    'UTH-001': {'name': 'Sipho Ndlovu', 'dept': 'Operations'},
    'UTH-002': {'name': 'Nomvula Dlamini', 'dept': 'Corporate Services'},
    'UTH-003': {'name': 'Thabo Khumalo', 'dept': 'Technical Services'},
    'UTH-004': {'name': 'Pieter van der Merwe', 'dept': 'Finance'},
    'UTH-005': {'name': 'Lindiwe Ngcobo', 'dept': 'Water Services'},
    'UTH-006': {'name': 'Bongani Zulu', 'dept': 'Corporate Services'},
    'UTH-007': {'name': 'Ayanda Mkhize', 'dept': 'Community Services'},
    'UTH-008': {'name': 'Johan Pretorius', 'dept': 'Operations'},
    'UTH-009': {'name': 'Zanele Mthembu', 'dept': 'Finance'},
    'UTH-010': {'name': 'Mandla Shabalala', 'dept': 'Water Services'},
}


def ts(days_ago):
    return (now - timedelta(days=days_ago)).strftime('%Y-%m-%dT%H:%M:%S')


# ── Posts ──────────────────────────────────────────────────────────
POSTS = [
    {"key": "post-1", "author": "UTH-001", "category": "ANNOUNCEMENT", "pinned": True,
     "title": "Water Conservation Week — 21-25 April 2026",
     "content": "uThukela Water is proud to support National Water Conservation Week. All staff are encouraged to participate in community outreach events. Schedule available on the intranet. Let's lead by example in responsible water use!",
     "days_ago": 2},
    {"key": "post-2", "author": "UTH-002", "category": "ANNOUNCEMENT", "pinned": False,
     "title": "Updated Leave Policy — Effective 1 May 2026",
     "content": "Please note the updated leave policy effective from 1 May 2026. Key changes include: increased study leave for SAQA-accredited qualifications, new parental leave provisions aligned with the latest BCEA amendments. Full policy document available in the HR portal.",
     "days_ago": 5},
    {"key": "post-3", "author": "UTH-003", "category": "KUDOS", "pinned": False,
     "title": "Outstanding work by the Estcourt Treatment Works team!",
     "content": "Huge congratulations to the Estcourt team for achieving a 99.2% compliance rate in the latest Blue Drop assessment. Special mention to Lindiwe Ngcobo and Mandla Shabalala for their exceptional dedication to water quality standards.",
     "days_ago": 7},
    {"key": "post-4", "author": "UTH-002", "category": "EVENT", "pinned": False,
     "title": "Workplace Wellness Day — Friday 2 May",
     "content": "Join us for our quarterly Wellness Day at Newcastle Head Office. Activities include: free health screenings, stress management workshops, and a healthy lunch. Partners from Discovery Health will be on site. RSVP by 28 April.",
     "days_ago": 10},
    {"key": "post-5", "author": "UTH-001", "category": "POLICY_UPDATE", "pinned": False,
     "title": "OHS Policy Update: PPE Requirements for Field Staff",
     "content": "Effective immediately, all field staff must wear high-visibility vests and hard hats when visiting treatment works and pump stations. Updated PPE requirements are aligned with the amended OHS Act regulations. Speak to your line manager for kit allocation.",
     "days_ago": 14},
    {"key": "post-6", "author": "UTH-007", "category": "DISCUSSION", "pinned": False,
     "title": "Community feedback on Ladysmith water supply",
     "content": "Following the recent community meeting in Ladysmith Ward 12, we received positive feedback on improved water pressure. However, some residents raised concerns about taste in certain areas. The Water Quality team is investigating. Any colleagues with relevant info, please comment below.",
     "days_ago": 3},
    {"key": "post-7", "author": "UTH-006", "category": "DISCUSSION", "pinned": False,
     "title": "IT System Maintenance — Weekend of 26-27 April",
     "content": "The HR system will undergo scheduled maintenance this weekend (26-27 April). Expected downtime: Saturday 22:00 to Sunday 06:00. All leave requests and approvals should be submitted before Friday 17:00. Emergency IT support available at ext 2001.",
     "days_ago": 1},
    {"key": "post-8", "author": "UTH-004", "category": "GENERAL", "pinned": False,
     "title": "Q3 Financial Results Summary",
     "content": "The finance team has released the Q3 financial summary for all departmental heads. Revenue collection improved by 8% compared to the same quarter last year. Operating costs remain within budget. Full report available in the Finance SharePoint folder.",
     "days_ago": 18},
]


def seed_posts():
    print("Seeding feed posts...")
    post_ids = {}
    ok = fail = 0
    for p in POSTS:
        pid = new_id(p['key'])
        post_ids[p['key']] = pid
        author_id = emp_id(p['author'])
        author_name = EMPLOYEES[p['author']]['name']
        created_at = ts(p['days_ago'])

        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'FEED_POST#{pid}'},
            'GSI1PK':    {'S': f'FEED_POST_CAT#{TENANT_ID}#{p["category"]}'},
            'GSI1SK':    {'S': f'FEED_POST#{created_at}'},
            'id':        {'S': pid},
            'tenantId':  {'S': TENANT_ID},
            'authorId':  {'S': author_id},
            'authorName': {'S': author_name},
            'title':     {'S': p['title']},
            'content':   {'S': p['content']},
            'category':  {'S': p['category']},
            'pinned':    {'BOOL': p.get('pinned', False)},
            'publishedAt': {'S': created_at},
            'status':    {'S': 'PUBLISHED'},
            'commentCount': {'N': '0'},
            'reactionCount': {'N': '0'},
            'createdAt': {'S': created_at},
            'updatedAt': {'S': created_at},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Post: {p['title'][:50]}...")
            ok += 1
        else:
            print(f"  FAIL Post {p['key']}: {err}", file=sys.stderr)
            fail += 1
    return post_ids, ok, fail


# ── Comments ───────────────────────────────────────────────────────
COMMENTS = [
    {"key": "cmt-1", "post": "post-1", "author": "UTH-005", "content": "Looking forward to the community outreach events! Our team at Estcourt is ready to participate.", "days_ago": 1.5},
    {"key": "cmt-2", "post": "post-1", "author": "UTH-010", "content": "Great initiative. Water conservation education is so important in our region.", "days_ago": 1.2},
    {"key": "cmt-3", "post": "post-1", "author": "UTH-007", "content": "The Ladysmith community centres are booked for the awareness sessions on Thursday.", "days_ago": 0.8},
    {"key": "cmt-4", "post": "post-2", "author": "UTH-009", "content": "Thanks for the heads up Nomvula. Will the new study leave policy apply retroactively for this year?", "days_ago": 4.5},
    {"key": "cmt-5", "post": "post-2", "author": "UTH-002", "content": "Good question Zanele — yes, the increased study leave is effective immediately for the current cycle.", "days_ago": 4.0},
    {"key": "cmt-6", "post": "post-3", "author": "UTH-005", "content": "Thank you for the recognition! The whole team worked incredibly hard for this. Proud moment for Estcourt.", "days_ago": 6.5},
    {"key": "cmt-7", "post": "post-3", "author": "UTH-010", "content": "It was a team effort. The new SCADA monitoring really helped us catch issues early.", "days_ago": 6.2},
    {"key": "cmt-8", "post": "post-3", "author": "UTH-001", "content": "Well deserved! This sets the benchmark for all our treatment works.", "days_ago": 6.0},
    {"key": "cmt-9", "post": "post-4", "author": "UTH-008", "content": "Will there be an option for Estcourt and Ladysmith staff to participate remotely?", "days_ago": 9.5},
    {"key": "cmt-10", "post": "post-4", "author": "UTH-002", "content": "Johan — yes, we're arranging a video link for satellite offices. Details to follow.", "days_ago": 9.0},
    {"key": "cmt-11", "post": "post-6", "author": "UTH-005", "content": "We've collected samples from the affected areas. Lab results expected by Friday.", "days_ago": 2.5},
    {"key": "cmt-12", "post": "post-6", "author": "UTH-010", "content": "Could be related to the seasonal algal bloom. We saw similar readings at the intake.", "days_ago": 2.0},
    {"key": "cmt-13", "post": "post-6", "author": "UTH-003", "content": "Let's schedule a cross-functional meeting to review the findings. I'll coordinate with Water Services.", "days_ago": 1.5},
    {"key": "cmt-14", "post": "post-7", "author": "UTH-008", "content": "Thanks for the notice. Will the payroll system also be affected?", "days_ago": 0.5},
    {"key": "cmt-15", "post": "post-7", "author": "UTH-006", "content": "No, payroll runs on a separate infrastructure. Only the HR portal will be down.", "days_ago": 0.3},
]


def seed_comments(post_ids):
    print("Seeding feed comments...")
    ok = fail = 0
    for c in COMMENTS:
        cid = new_id(c['key'])
        post_id = post_ids.get(c['post'], '')
        author_id = emp_id(c['author'])
        author_name = EMPLOYEES[c['author']]['name']
        created_at = (now - timedelta(days=c['days_ago'])).strftime('%Y-%m-%dT%H:%M:%S')

        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'FEED_COMMENT#{cid}'},
            'GSI1PK':    {'S': f'FEED_COMMENT_POST#{TENANT_ID}#{post_id}'},
            'GSI1SK':    {'S': f'FEED_COMMENT#{created_at}'},
            'id':        {'S': cid},
            'tenantId':  {'S': TENANT_ID},
            'postId':    {'S': post_id},
            'authorId':  {'S': author_id},
            'authorName': {'S': author_name},
            'content':   {'S': c['content']},
            'createdAt': {'S': created_at},
        }
        success, err = put_item(item)
        if success:
            print(f"  OK  Comment: {c['key']}")
            ok += 1
        else:
            print(f"  FAIL Comment {c['key']}: {err}", file=sys.stderr)
            fail += 1
    return ok, fail


# ── Reactions ──────────────────────────────────────────────────────
def seed_reactions(post_ids):
    print("Seeding feed reactions...")
    # Distribute reactions across posts
    reaction_defs = [
        # post-1 (pinned announcement) — lots of engagement
        ("post-1", "UTH-002", "thumbsup"), ("post-1", "UTH-003", "thumbsup"),
        ("post-1", "UTH-005", "heart"), ("post-1", "UTH-007", "thumbsup"),
        ("post-1", "UTH-009", "clap"), ("post-1", "UTH-010", "heart"),
        # post-3 (kudos) — celebratory
        ("post-3", "UTH-001", "clap"), ("post-3", "UTH-002", "clap"),
        ("post-3", "UTH-004", "thumbsup"), ("post-3", "UTH-006", "clap"),
        ("post-3", "UTH-007", "heart"), ("post-3", "UTH-008", "thumbsup"),
        ("post-3", "UTH-009", "clap"),
        # post-2 (policy update)
        ("post-2", "UTH-003", "thumbsup"), ("post-2", "UTH-005", "thumbsup"),
        ("post-2", "UTH-009", "thumbsup"),
        # post-4 (event)
        ("post-4", "UTH-001", "heart"), ("post-4", "UTH-005", "thumbsup"),
        ("post-4", "UTH-008", "thumbsup"),
        # post-6 (discussion)
        ("post-6", "UTH-001", "thumbsup"), ("post-6", "UTH-003", "thumbsup"),
        ("post-6", "UTH-005", "thumbsup"),
        # post-7 (IT maintenance)
        ("post-7", "UTH-004", "thumbsup"),
        # post-8 (finance)
        ("post-8", "UTH-001", "thumbsup"), ("post-8", "UTH-002", "thumbsup"),
    ]

    ok = fail = 0
    for i, (post_key, emp_num, reaction_type) in enumerate(reaction_defs):
        rid = new_id(f"reaction-{i}")
        post_id = post_ids.get(post_key, '')
        user_id = emp_id(emp_num)
        created_at = ts(random.Random(i).randint(0, 10))

        item = {
            'PK':        {'S': f'TENANT#{TENANT_ID}'},
            'SK':        {'S': f'FEED_REACTION#{rid}'},
            'GSI1PK':    {'S': f'FEED_REACTION_POST#{TENANT_ID}#{post_id}'},
            'GSI1SK':    {'S': f'FEED_REACTION#{created_at}'},
            'id':        {'S': rid},
            'tenantId':  {'S': TENANT_ID},
            'postId':    {'S': post_id},
            'userId':    {'S': user_id},
            'reactionType': {'S': reaction_type},
            'createdAt': {'S': created_at},
        }
        success, err = put_item(item)
        if success:
            ok += 1
        else:
            print(f"  FAIL Reaction {i}: {err}", file=sys.stderr)
            fail += 1
    print(f"  OK  {ok} reactions seeded")
    return ok, fail


def main():
    resolve_table()
    print(f"Table:  {TABLE_NAME}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Region: {REGION}")
    print()

    total_ok = total_fail = 0

    post_ids, ok, fail = seed_posts()
    total_ok += ok; total_fail += fail

    ok, fail = seed_comments(post_ids)
    total_ok += ok; total_fail += fail

    ok, fail = seed_reactions(post_ids)
    total_ok += ok; total_fail += fail

    print(f"\nDone: {total_ok} created, {total_fail} failed")
    sys.exit(1 if total_fail > 0 else 0)


if __name__ == '__main__':
    main()
