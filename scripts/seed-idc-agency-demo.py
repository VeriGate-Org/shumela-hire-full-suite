#!/usr/bin/env python3
"""
Seeds one demo recruitment agency + one candidate submission on the live
`idc` production tenant, via the real ShumelaHire HTTP API (not raw DynamoDB
writes) — so the records go through normal validation and GSI population,
exactly like a real IDC staff action would, and show up correctly in the
Agencies UI.

Fills the gap flagged in the 21 Aug 2026 IDC T31-06-26 demo readiness review:
Scene 3.2 (Agency Portal) of the demo script had zero AGENCY data to show.

The submission is attached to the existing "Senior Investment Analyst"
(Strategic Business Unit) posting, since that's the vacancy the whole
"Life of a Vacancy" demo script is already built around.

Runs as hr.manager@idc.shumelahire.co.za (HR_MANAGER group), not
admin@idc.shumelahire.co.za: as of 21 Aug 2026 the admin password shown on
the live login screen (IdcLoginCredentials.tsx, set 26 Jul) no longer
authenticates — Cognito shows the account was last modified 31 Jul, five
days later, so it was evidently changed again without the displayed value
being updated. That's a separate bug worth fixing on its own; this script
doesn't touch admin@idc. hr.manager@idc existed but had never been logged
into, so its password was set fresh for this run (also documented in the
strategy doc's Persona Map).

Usage:
    IDC_ACTOR_PASSWORD='...' AWS_PROFILE=default python3 scripts/seed-idc-agency-demo.py

The password is intentionally not hardcoded here — read it from the Persona
Map in IDC-T31-Demo-Strategy.html and pass it via environment variable so it
never lands in git history.
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

REGION = "af-south-1"
COGNITO_CLIENT_ID = "50a4a7pg4j0ooq6n024sf9m3ct"  # shumelahire-web app client
API_BASE = "https://idc.shumelahire.co.za/api"

ACTOR_EMAIL = "hr.manager@idc.shumelahire.co.za"
ACTOR_PASSWORD = os.environ.get("IDC_ACTOR_PASSWORD")

# "Senior Investment Analyst" / Strategic Business Unit — the vacancy the
# demo script's "Life of a Vacancy" narrative is already anchored on.
JOB_POSTING_ID = "326f4286-3437-4c7e-8c3d-a0ebae5c5a8f"

AGENCY = {
    "agencyName": "Talent Bridge Recruitment",
    "registrationNumber": "2019/384021/07",
    "contactPerson": "Nomsa Radebe",
    "contactEmail": "nomsa.radebe@talentbridge.co.za",
    "contactPhone": "+27 11 483 2210",
    "specializations": "Finance, Investment Analysis, Executive Search",
    "beeLevel": 2,
}

CANDIDATE_SUBMISSION = {
    "candidateName": "Karabo Sithole",
    "candidateEmail": "karabo.sithole@example.com",
    "candidatePhone": "+27 82 445 1198",
    "coverNote": (
        "Submitted by Talent Bridge Recruitment on behalf of Karabo Sithole "
        "for the Senior Investment Analyst role. 6 years' private equity "
        "and infrastructure finance experience; CFA Level II candidate."
    ),
    "jobPosting": {"id": JOB_POSTING_ID},
}


def get_id_token() -> str:
    if not ACTOR_PASSWORD:
        sys.exit(
            "Set IDC_ACTOR_PASSWORD in the environment before running this "
            "script (see the Persona Map in IDC-T31-Demo-Strategy.html)."
        )
    result = subprocess.run(
        [
            "aws", "cognito-idp", "initiate-auth",
            "--region", REGION,
            "--client-id", COGNITO_CLIENT_ID,
            "--auth-flow", "USER_PASSWORD_AUTH",
            "--auth-parameters", f"USERNAME={ACTOR_EMAIL},PASSWORD={ACTOR_PASSWORD}",
            "--query", "AuthenticationResult.IdToken",
            "--output", "text",
        ],
        capture_output=True, text=True,
        env={**os.environ, "AWS_PROFILE": os.environ.get("AWS_PROFILE", "default")},
    )
    token = result.stdout.strip()
    if result.returncode != 0 or not token:
        sys.exit(f"Failed to authenticate as {ACTOR_EMAIL}: {result.stderr.strip()}")
    return token


def api(method: str, path: str, token: str, body=None):
    req = urllib.request.Request(
        f"{API_BASE}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def find_agency_by_email(token: str, contact_email: str):
    status, agencies = api("GET", "/agencies", token)
    if status != 200:
        sys.exit(f"Could not list agencies ({status}): {agencies}")
    return next((a for a in agencies if a.get("contactEmail") == contact_email), None)


def main() -> None:
    token = get_id_token()

    # Idempotent: reuse the agency if a previous run already created it,
    # instead of registering a duplicate (registerAgency doesn't itself
    # dedupe on contact email the way the public self-registration path does).
    existing = find_agency_by_email(token, AGENCY["contactEmail"])
    if existing:
        agency_id, agency = existing["id"], existing
        print(f"Reusing existing agency {agency_id} — {agency['agencyName']} (status: {agency['status']})")
    else:
        status, agency = api("POST", "/agencies/register", token, AGENCY)
        if status not in (200, 201):
            sys.exit(f"Agency registration failed ({status}): {agency}")
        agency_id = agency.get("id")
        if not agency_id:
            # Known bug (same root cause as #142/#173): DynamoRepository.save()
            # doesn't propagate the generated id back onto the entity for
            # AgencyProfile, so the create response has id: null even though
            # the item is persisted correctly. Recover it by re-listing.
            recovered = find_agency_by_email(token, AGENCY["contactEmail"])
            agency_id = recovered["id"] if recovered else sys.exit(
                f"Created agency not found when re-listing (contactEmail={AGENCY['contactEmail']})"
            )
        print(f"Created agency {agency_id} — {agency['agencyName']} (status: {agency['status']})")

    if agency.get("status") == "APPROVED":
        print(f"Agency {agency_id} already approved")
    else:
        status, approved = api("POST", f"/agencies/{agency_id}/approve", token)
        if status != 200:
            sys.exit(f"Agency approval failed ({status}): {approved}")
        print(f"Approved agency {agency_id} (status: {approved['status']})")

    status, dashboard = api("GET", f"/agencies/{agency_id}/dashboard", token)
    if status == 200 and dashboard.get("totalSubmissions", 0) > 0:
        print(f"Agency {agency_id} already has {dashboard['totalSubmissions']} submission(s) — skipping create")
    else:
        status, submission = api("POST", f"/agencies/{agency_id}/submissions", token, CANDIDATE_SUBMISSION)
        if status not in (200, 201):
            sys.exit(f"Candidate submission failed ({status}): {submission}")
        print(
            f"Submitted candidate {submission['candidateName']} "
            f"(submission {submission.get('id')}, status: {submission['status']})"
        )

    print("\nDone. Verify in-app: Admin/Recruiter -> Agencies -> Talent Bridge Recruitment.")


if __name__ == "__main__":
    main()
