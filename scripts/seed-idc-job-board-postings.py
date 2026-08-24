#!/usr/bin/env python3
"""
Seeds PNet and CareerJunction board postings for the IDC tenant.

Why this exists: a posting published during a demonstration is seconds old, so
it reports 0 views / 0 clicks / 0 apps — correct, but it shows nothing of the
sync-and-track capability. These rows give the tenant adverts that have been
live for a few days.

The engagement figures are produced by the SAME formula as
SimulatedJobBoardConnector.applyModelledEngagement, keyed off the same posting
id, so pressing Sync on a seeded row recomputes to the value already on screen
(plus whatever hours have since elapsed) instead of visibly rewriting it.
If that formula changes, change it here too.

Only PNET and CAREER_JUNCTION are seeded, because only they are configured for
simulated mode. INTERNAL_PORTAL and PUBLIC_WEBSITE publish instantly and for
real, so they are better shown live than seeded.

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

# (job posting id, title, board type, days the advert has been live)
#
# Days-live is the only dial here, and it is what keeps the board figures
# coherent with the ATS. A board cannot credibly report more applications than
# the vacancy has actually received, so a long-running advert on a vacancy with
# six applications reads as broken. The Project Manager vacancy carries 42
# applications and can support two adverts running the better part of a week;
# the rest carry five or six and cannot. check_coherence() enforces this rather
# than trusting the numbers below to stay right.
VACANCIES = [
    # The vacancy the demonstration follows end to end.
    ("049060c2-0fdb-49f2-8070-49870104b87e", "Project Manager", "PNET", 5),
    ("049060c2-0fdb-49f2-8070-49870104b87e", "Project Manager", "CAREER_JUNCTION", 4),
    # Others, so the capability does not look like one hand-made row.
    ("326f4286-3437-4c7e-8c3d-a0ebae5c5a8f", "Senior Investment Analyst", "PNET", 2),
    ("02e0cec8-8fc3-4671-8641-fcb82095457b", "Data Analyst", "CAREER_JUNCTION", 1),
    ("6bbe64fc-6340-4faa-af93-fe6b9a1e86e7", "Financial Accountant", "PNET", 1),
]

BOARD_PREFIX = {"PNET": "PNET", "CAREER_JUNCTION": "CJ"}
BOARD_URL = {
    "PNET": "https://www.pnet.co.za/jobs/",
    "CAREER_JUNCTION": "https://www.careerjunction.co.za/jobs/",
}

now = datetime.now(timezone.utc)


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


def modelled_engagement(posting_id, posted_at, expires_at):
    """Byte-for-byte the connector's applyModelledEngagement."""
    accrue_until = min(now, expires_at)
    hours_live = int((accrue_until - posted_at).total_seconds() // 3600)
    if hours_live <= 0:
        return 0, 0, 0

    variation = 0.75 + (java_abs(java_hash_code(posting_id)) % 50) / 100.0
    views = round(hours_live * VIEWS_PER_HOUR * variation)
    clicks = round(views * CLICK_RATE)
    applications = round(clicks * APPLICATION_RATE)
    return views, clicks, applications


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def build_items():
    items = []
    for job_posting_id, title, board_type, days_live in VACANCIES:
        posting_id = deterministic_id(f"jbp:{job_posting_id}:{board_type}")
        posted_at = now - timedelta(days=days_live)
        expires_at = posted_at + timedelta(days=POSTING_LIFETIME_DAYS)

        # External reference is derived from the posting id rather than random,
        # so a re-run does not mint a second reference for the same advert.
        token = posting_id.replace("-", "")[:8].upper()
        external_id = f"{BOARD_PREFIX[board_type]}-{token}"

        views, clicks, applications = modelled_engagement(posting_id, posted_at, expires_at)

        items.append({
            "job_posting_id": job_posting_id,
            "meta": {
                "title": title,
                "board": board_type,
                "days_live": days_live,
                "views": views,
                "clicks": clicks,
                "applications": applications,
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
                "externalUrl": {"S": BOARD_URL[board_type] + external_id},
                "postedAt": {"S": iso(posted_at)},
                "expiresAt": {"S": iso(expires_at)},
                "viewCount": {"N": str(views)},
                "clickCount": {"N": str(clicks)},
                "applicationCount": {"N": str(applications)},
                "createdAt": {"S": iso(posted_at)},
                "updatedAt": {"S": iso(now)},
            },
        })
    return items


def ats_application_counts():
    """Applications actually recorded in the ATS, per job posting.

    Read live rather than hardcoded, so the coherence check below cannot go
    stale against a re-seeded tenant.
    """
    result = subprocess.run(
        ["aws", "dynamodb", "query",
         "--table-name", TABLE_NAME, "--region", REGION,
         "--key-condition-expression", "PK = :pk AND begins_with(SK, :sk)",
         "--expression-attribute-values",
         json.dumps({":pk": {"S": f"TENANT#{TENANT_ID}"}, ":sk": {"S": "APPLICATION#"}}),
         "--output", "json"],
        capture_output=True, text=True,
        env={**os.environ, "AWS_PROFILE": AWS_PROFILE})
    if result.returncode != 0:
        return None

    counts = {}
    for it in json.loads(result.stdout).get("Items", []):
        job_id = (it.get("jobAdId", {}).get("S")
                  or it.get("jobPostingId", {}).get("S"))
        if job_id:
            counts[job_id] = counts.get(job_id, 0) + 1
    return counts


def check_coherence(rows, ats_counts):
    """A board must not claim more applications than the vacancy has received.

    Not a style preference: the two numbers appear on adjacent screens, and a
    PNet advert reporting 27 applications against a vacancy showing 6 is the
    kind of detail that gets noticed and cannot be explained away.
    """
    board_totals = {}
    for row in rows:
        job_id = row["job_posting_id"]
        board_totals[job_id] = board_totals.get(job_id, 0) + row["meta"]["applications"]

    problems = []
    for job_id, board_total in board_totals.items():
        ats_total = ats_counts.get(job_id)
        title = next(r["meta"]["title"] for r in rows if r["job_posting_id"] == job_id)
        if ats_total is None:
            problems.append(f"{title}: no applications found in the ATS for {job_id}")
        elif board_total > ats_total:
            problems.append(
                f"{title}: boards would report {board_total} applications, "
                f"but the ATS has {ats_total}. Reduce days-live for this vacancy.")
    return problems


def put_item(item):
    result = subprocess.run(
        ["aws", "dynamodb", "put-item",
         "--table-name", TABLE_NAME, "--region", REGION,
         "--condition-expression", "attribute_not_exists(PK)",
         "--item", json.dumps(item)],
        capture_output=True, text=True,
        env={**os.environ, "AWS_PROFILE": AWS_PROFILE})
    stderr = result.stderr or ""
    if "ConditionalCheckFailedException" in stderr:
        return True, "exists"
    if result.returncode != 0:
        return False, stderr.strip()[:200]
    return True, "written"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="write to DynamoDB (default is a dry run)")
    args = parser.parse_args()

    rows = build_items()

    print(f"{'APPLY' if args.apply else 'DRY RUN'} — tenant {TENANT_ID}, table {TABLE_NAME}\n")
    header = f"{'VACANCY':<28}{'BOARD':<18}{'LIVE':>6}{'VIEWS':>8}{'CLICKS':>8}{'APPS':>7}  REFERENCE"
    print(header)
    print("-" * len(header))

    for row in rows:
        m = row["meta"]
        print(f"{m['title']:<28}{m['board']:<18}{str(m['days_live']) + 'd':>6}"
              f"{m['views']:>8}{m['clicks']:>8}{m['applications']:>7}  {m['external_id']}")

    ats_counts = ats_application_counts()
    if ats_counts is None:
        print("\nCould not read ATS application counts — refusing to write "
              "figures that cannot be checked against them.")
        return 1

    print("\nBoard-reported applications vs the ATS:")
    seen = set()
    for row in rows:
        job_id = row["job_posting_id"]
        if job_id in seen:
            continue
        seen.add(job_id)
        board_total = sum(r["meta"]["applications"] for r in rows if r["job_posting_id"] == job_id)
        print(f"  {row['meta']['title']:<28}boards {board_total:>3}   ATS {ats_counts.get(job_id, 0):>3}")

    problems = check_coherence(rows, ats_counts)
    if problems:
        print("\nINCOHERENT — nothing written:")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    if not args.apply:
        print("\nCoherent. Nothing written — re-run with --apply.")
        return 0

    print()
    failures = 0
    for row in rows:
        ok, note = put_item(row["item"])
        status = "OK" if ok else "FAIL"
        print(f"  {status:<5}{row['meta']['title']:<28}{row['meta']['board']:<18}{note}")
        if not ok:
            failures += 1

    print(f"\n{len(rows) - failures}/{len(rows)} written.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
