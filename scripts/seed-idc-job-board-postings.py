#!/usr/bin/env python3
"""
Makes the IDC tenant's board postings and application provenance agree.

Two things were inconsistent. A posting published during a demonstration is
seconds old, so it reports 0 views / 0 clicks / 0 apps and shows nothing of the
sync-and-track capability. And no application carried PNET, LINKEDIN or
CAREER_JUNCTION as its source, so a board row claiming thirteen applications
had nothing behind it — the source breakdown on the recruiter dashboard showed
no board at all.

This script fixes both together, because fixing either alone re-opens the gap:

  1. Attribution — applications sitting in an unattributed bucket (CAREERS_PAGE,
     EXTERNAL, JOB_BOARD, OTHER) are re-sourced to the board that brought them.
     REFERRAL, INTERNAL, AGENCY and RECRUITER name their channel already and are
     never touched.
  2. Postings   — each advert's figures are then generated so its
     applicationCount EQUALS the number of applications attributed to it.

The relationship is inverted deliberately. Engagement is a function of how long
an advert has been live (see SimulatedJobBoardConnector.applyModelledEngagement),
so rather than pick a duration and accept whatever application count falls out,
this solves for the duration that produces the count we can actually evidence.
That keeps two invariants at once:

  - a board never claims more applications than exist, and
  - pressing Sync recomputes to the figure already on screen, because the
    figure was produced by the same formula from the same posted-at.

Usage:
    python3 seed-idc-job-board-postings.py            # dry run, prints only
    python3 seed-idc-job-board-postings.py --apply    # writes to DynamoDB
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

TENANT_ID = "idc"
TABLE_NAME = "shumelahire-data"
REGION = "af-south-1"
AWS_PROFILE = os.environ.get("AWS_PROFILE", "alusa-dev")

POSTING_LIFETIME_DAYS = 30

# Mirrors SimulatedJobBoardConnector.
VIEWS_PER_HOUR = 7.5
CLICK_RATE = 1.0 / 12.0
APPLICATION_RATE = 1.0 / 6.0

# Mirrors ApplicationSource.UNATTRIBUTED — sources that record that an
# application came from outside without saying from where. Only these are
# re-attributed; a referral or an internal move names its channel already.
UNATTRIBUTED = ["JOB_BOARD", "EXTERNAL", "CAREERS_PAGE", "OTHER"]

# (job posting id, title, board type, applications this advert brought in)
#
# The target is what must be evidenced, so it cannot exceed the vacancy's
# unattributed pool — check_coherence enforces that before anything is written.
# Project Manager has 38 unattributed of 42; the rest have 2 each, which is why
# their adverts carry small numbers rather than a tidy-looking week of history.
VACANCIES = [
    ("049060c2-0fdb-49f2-8070-49870104b87e", "Project Manager", "PNET", 13),
    ("049060c2-0fdb-49f2-8070-49870104b87e", "Project Manager", "CAREER_JUNCTION", 8),
    ("049060c2-0fdb-49f2-8070-49870104b87e", "Project Manager", "LINKEDIN", 6),
    ("326f4286-3437-4c7e-8c3d-a0ebae5c5a8f", "Senior Investment Analyst", "PNET", 2),
    ("02e0cec8-8fc3-4671-8641-fcb82095457b", "Data Analyst", "CAREER_JUNCTION", 2),
    ("6bbe64fc-6340-4faa-af93-fe6b9a1e86e7", "Financial Accountant", "PNET", 2),
    ("454071c0-870c-4d16-85af-5b838f353eec", "HR Business Partner", "LINKEDIN", 2),
]

# Must match SimulatedJobBoardConnector.externalReference, so a row seeded here
# and one published live during the demonstration look the same.
#
# No externalUrl is written, for the same reason the connector stopped setting
# one: a sandbox posting has no advert on the board, so any URL built for it
# resolves to that board's not-found page — a dead link into a third party's
# site, rendered as a "View" button beside a green Published badge.
BOARD_PREFIX = {"PNET": "PNET", "CAREER_JUNCTION": "CJ", "LINKEDIN": "LI"}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
now = datetime.now(timezone.utc)


# ── helpers ─────────────────────────────────────────────────────────────────

def deterministic_id(seed_key):
    """Same shape as seed-idc-dynamo.py, so re-running is idempotent."""
    return str(uuid.UUID(hashlib.sha256(f"{TENANT_ID}:{seed_key}".encode()).hexdigest()[:32]))


def java_hash_code(s):
    """Java's String.hashCode, including 32-bit signed overflow.

    The connector derives each posting's engagement rate from this, so the
    seeded figures only match what Sync recomputes if it is reproduced exactly.
    """
    h = 0
    for ch in s:
        h = (31 * h + ord(ch)) & 0xFFFFFFFF
    if h >= 0x80000000:
        h -= 0x100000000
    return h


def java_abs(n):
    """Math.abs, including the Integer.MIN_VALUE case that stays negative."""
    return n if n == -(2 ** 31) else abs(n)


def engagement_at(posting_id, hours_live):
    """Byte-for-byte the connector's applyModelledEngagement, for a given age."""
    if hours_live <= 0:
        return 0, 0, 0
    variation = 0.75 + (java_abs(java_hash_code(posting_id)) % 50) / 100.0
    views = round(hours_live * VIEWS_PER_HOUR * variation)
    clicks = round(views * CLICK_RATE)
    applications = round(clicks * APPLICATION_RATE)
    return views, clicks, applications


def hours_for_applications(posting_id, target_applications):
    """Age at which this posting's model yields exactly the target count.

    Returns the MIDPOINT of the qualifying range rather than its first hour, so
    an hour of clock drift between seeding and the demonstration does not tip
    the advert into reporting a different number than the applications behind it.
    """
    qualifying = [
        hours for hours in range(1, POSTING_LIFETIME_DAYS * 24)
        if engagement_at(posting_id, hours)[2] == target_applications
    ]
    if not qualifying:
        return None
    return qualifying[len(qualifying) // 2]


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def aws_json(args):
    result = subprocess.run(
        ["aws"] + args + ["--output", "json"],
        capture_output=True, text=True,
        env={**os.environ, "AWS_PROFILE": AWS_PROFILE})
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip()[:300])
    return json.loads(result.stdout) if result.stdout.strip() else {}


# ── reading current state ───────────────────────────────────────────────────

def fetch_applications():
    data = aws_json([
        "dynamodb", "query", "--table-name", TABLE_NAME, "--region", REGION,
        "--key-condition-expression", "PK = :pk AND begins_with(SK, :sk)",
        "--expression-attribute-values",
        json.dumps({":pk": {"S": f"TENANT#{TENANT_ID}"}, ":sk": {"S": "APPLICATION#"}}),
    ])
    applications = []
    for it in data.get("Items", []):
        # Most applications key the vacancy on jobPostingId; a few carry both.
        job_id = it.get("jobAdId", {}).get("S") or it.get("jobPostingId", {}).get("S")
        applications.append({
            "pk": it["PK"]["S"],
            "sk": it["SK"]["S"],
            "job_id": job_id,
            "source": it.get("applicationSource", {}).get("S"),
        })
    return applications


# ── phase 1: attribution ────────────────────────────────────────────────────

def boards_for(job_posting_id):
    """The board types this vacancy's adverts are credited to."""
    return [board for job, _title, board, _target in VACANCIES if job == job_posting_id]


def reclaimable(app):
    """Whether this application's source may be reassigned.

    Unattributed sources, plus any board this vacancy already advertises on —
    the latter is what makes a re-run work. After one pass those applications
    carry PNET rather than CAREERS_PAGE, and treating them as spent made the
    script refuse its own output and blame the targets for it.

    REFERRAL, INTERNAL, AGENCY and RECRUITER are never reclaimable: they name a
    channel that genuinely happened and no advert may take credit for them.
    """
    return app["source"] in UNATTRIBUTED or app["source"] in boards_for(app["job_id"])


def plan_attribution(applications):
    """Choose which applications each board gets credit for.

    Deterministic and re-runnable: an application already on the board it would
    be assigned to is matched to that board first and produces no change, so a
    second run writes nothing.

    Ordering spends the vaguest bucket first — a JOB_BOARD application is more
    obviously a named board's than a CAREERS_PAGE one.
    """
    pool = defaultdict(list)
    for app in applications:
        if app["job_id"] and reclaimable(app):
            pool[app["job_id"]].append(app)

    def spend_order(app):
        already_named = app["source"] not in UNATTRIBUTED
        rank = UNATTRIBUTED.index(app["source"]) if not already_named else -1
        return (already_named, rank, app["sk"])

    changes = []
    for job_posting_id, title, board_type, target in VACANCIES:
        available = pool.get(job_posting_id, [])

        # Keep applications already credited to this board, up to the target.
        keeping = [a for a in available if a["source"] == board_type][:target]
        for app in keeping:
            available.remove(app)

        # Make up the difference from whatever else is reclaimable.
        remaining = sorted(
            (a for a in available if a["source"] != board_type), key=spend_order)
        for app in remaining[:target - len(keeping)]:
            available.remove(app)
            changes.append({
                "pk": app["pk"], "sk": app["sk"],
                "title": title, "from": app["source"], "to": board_type,
            })
    return changes


def check_coherence(applications):
    """A board cannot be credited with more applications than exist to credit.

    The two numbers appear on adjacent screens — a PNet row reporting thirteen
    applications against a vacancy that only ever received six it could
    attribute is the kind of detail that gets noticed and cannot be explained
    away.
    """
    pool = defaultdict(int)
    totals = defaultdict(int)
    for app in applications:
        if app["job_id"]:
            totals[app["job_id"]] += 1
            if reclaimable(app):
                pool[app["job_id"]] += 1

    wanted = defaultdict(int)
    titles = {}
    for job_posting_id, title, _board, target in VACANCIES:
        wanted[job_posting_id] += target
        titles[job_posting_id] = title

    problems = []
    for job_id, target in wanted.items():
        if totals.get(job_id, 0) == 0:
            problems.append(f"{titles[job_id]}: no applications found for {job_id}")
        elif target > pool.get(job_id, 0):
            problems.append(
                f"{titles[job_id]}: boards would claim {target} applications, but only "
                f"{pool.get(job_id, 0)} of its {totals[job_id]} can be attributed to a "
                f"board. Lower the targets for this vacancy.")
    return problems, pool, totals


# ── phase 2: postings ───────────────────────────────────────────────────────

def build_postings():
    rows = []
    for job_posting_id, title, board_type, target in VACANCIES:
        posting_id = deterministic_id(f"jbp:{job_posting_id}:{board_type}")
        hours = hours_for_applications(posting_id, target)
        if hours is None:
            raise RuntimeError(
                f"No advert age yields exactly {target} applications for {title} "
                f"on {board_type}. Choose a different target.")

        posted_at = now - timedelta(hours=hours)
        expires_at = posted_at + timedelta(days=POSTING_LIFETIME_DAYS)
        views, clicks, applications = engagement_at(posting_id, hours)

        token = posting_id.replace("-", "")[:8].upper()
        external_id = f"{BOARD_PREFIX[board_type]}-{token}"

        rows.append({
            "job_posting_id": job_posting_id,
            "meta": {
                "title": title, "board": board_type, "hours": hours,
                "views": views, "clicks": clicks, "applications": applications,
                "external_id": external_id,
            },
            "item": {
                "PK": {"S": f"TENANT#{TENANT_ID}"},
                "SK": {"S": f"JOB_BOARD_POSTING#{posting_id}"},
                "GSI1PK": {"S": "JBP_STATUS#POSTED"},
                "GSI1SK": {"S": f"JOB_BOARD_POSTING#{iso(posted_at)}"},
                "GSI2PK": {"S": f"JBP_JOBPOSTING#{job_posting_id}"},
                "GSI2SK": {"S": f"JOB_BOARD_POSTING#{posting_id}"},
                "id": {"S": posting_id},
                "tenantId": {"S": TENANT_ID},
                "jobPostingId": {"S": job_posting_id},
                "boardType": {"S": board_type},
                "status": {"S": "POSTED"},
                "externalPostId": {"S": external_id},
                "postedAt": {"S": iso(posted_at)},
                "expiresAt": {"S": iso(expires_at)},
                "viewCount": {"N": str(views)},
                "clickCount": {"N": str(clicks)},
                "applicationCount": {"N": str(applications)},
                "createdAt": {"S": iso(posted_at)},
                "updatedAt": {"S": iso(now)},
            },
        })
    return rows


# ── writing ─────────────────────────────────────────────────────────────────

def back_up(applications, label):
    """Records the current state of everything about to change.

    Written before any mutation, next to the other _backup-*.json files this
    tenant's seeding has accumulated.
    """
    path = os.path.join(SCRIPT_DIR, f"_backup-{label}.json")
    with open(path, "w") as handle:
        json.dump(applications, handle, indent=2)
    return path


def update_source(pk, sk, source):
    result = subprocess.run(
        ["aws", "dynamodb", "update-item",
         "--table-name", TABLE_NAME, "--region", REGION,
         "--key", json.dumps({"PK": {"S": pk}, "SK": {"S": sk}}),
         "--update-expression", "SET #s = :v",
         "--expression-attribute-names", json.dumps({"#s": "applicationSource"}),
         "--expression-attribute-values", json.dumps({":v": {"S": source}}),
         "--condition-expression", "attribute_exists(PK)"],
        capture_output=True, text=True,
        env={**os.environ, "AWS_PROFILE": AWS_PROFILE})
    return (result.returncode == 0), (result.stderr or "").strip()[:160]


def put_posting(item):
    # Unconditional: a posting's figures are derived from its target, so a
    # re-run must be able to correct one that has drifted. The id is
    # deterministic, so this replaces rather than duplicates.
    result = subprocess.run(
        ["aws", "dynamodb", "put-item",
         "--table-name", TABLE_NAME, "--region", REGION,
         "--item", json.dumps(item)],
        capture_output=True, text=True,
        env={**os.environ, "AWS_PROFILE": AWS_PROFILE})
    return (result.returncode == 0), (result.stderr or "").strip()[:160]


# ── main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="write to DynamoDB (default is a dry run)")
    args = parser.parse_args()

    print(f"{'APPLY' if args.apply else 'DRY RUN'} — tenant {TENANT_ID}, table {TABLE_NAME}\n")

    applications = fetch_applications()
    problems, pool, totals = check_coherence(applications)

    print("Applications available to attribute to a board, per vacancy:")
    seen = set()
    for job_posting_id, title, _board, _target in VACANCIES:
        if job_posting_id in seen:
            continue
        seen.add(job_posting_id)
        wanted = sum(t for j, _n, _b, t in VACANCIES if j == job_posting_id)
        print(f"  {title:<28}need {wanted:>3}   available {pool.get(job_posting_id, 0):>3}"
              f"   of {totals.get(job_posting_id, 0):>3} total")

    if problems:
        print("\nINCOHERENT — nothing written:")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    changes = plan_attribution(applications)
    postings = build_postings()

    if changes:
        print(f"\nPhase 1 — re-attribute {len(changes)} applications:")
        moves = defaultdict(int)
        for change in changes:
            moves[(change["title"], change["from"], change["to"])] += 1
        for (title, src, dst), count in sorted(moves.items()):
            print(f"  {title:<28}{src:<14} -> {dst:<18}{count:>3}")
    else:
        print("\nPhase 1 — nothing to re-attribute; every advert is already evidenced.")

    print("\nPhase 2 — adverts, aged to match what they brought in:")
    header = f"  {'VACANCY':<28}{'BOARD':<18}{'LIVE':>7}{'VIEWS':>8}{'CLICKS':>8}{'APPS':>7}"
    print(header)
    print("  " + "-" * (len(header) - 2))
    for row in postings:
        m = row["meta"]
        days = m["hours"] / 24
        print(f"  {m['title']:<28}{m['board']:<18}{days:>6.1f}d"
              f"{m['views']:>8}{m['clicks']:>8}{m['applications']:>7}")

    # The whole point: these two must be equal, per board.
    mismatched = [
        r["meta"] for r, (_j, _t, _b, target) in zip(postings, VACANCIES)
        if r["meta"]["applications"] != target
    ]
    if mismatched:
        print("\nAdvert figures do not match their attribution — nothing written:")
        for m in mismatched:
            print(f"  - {m['title']} / {m['board']}: advert says {m['applications']}")
        return 1
    print("\n  Every advert's application count equals the applications attributed to it.")

    if not args.apply:
        print("\nCoherent. Nothing written — re-run with --apply.")
        return 0

    backup = back_up(applications, "applications-before-source-attribution")
    print(f"\nBacked up {len(applications)} applications to {os.path.basename(backup)}")

    failures = 0
    print("\nWriting attributions:")
    for change in changes:
        ok, note = update_source(change["pk"], change["sk"], change["to"])
        if not ok:
            failures += 1
            print(f"  FAIL {change['sk']} {note}")
    print(f"  {len(changes) - failures}/{len(changes)} applications re-attributed.")

    print("\nWriting adverts:")
    for row in postings:
        ok, note = put_posting(row["item"])
        status = "OK" if ok else "FAIL"
        print(f"  {status:<5}{row['meta']['title']:<28}{row['meta']['board']:<18}{note}")
        if not ok:
            failures += 1

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
