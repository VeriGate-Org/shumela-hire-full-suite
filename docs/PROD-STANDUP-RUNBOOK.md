# ShumelaHire — Production Stand-up Runbook

**Goal:** Stand up the `prod` environment with **IDC** and **uThukela** as the two prod tenants; full DNS cutover Xneelo → Route 53.
**Account:** 379992419891 · **Region:** af-south-1 (CloudFront/ACM-for-CF: us-east-1).
**Deploy trigger:** push a **`v*` git tag** → `deploy-prod.yml` → CI → `deploy.yml` (environment `prod`, domain `shumelahire.co.za`).

## Certificates (ACM)

| Purpose | Region | ARN | Status |
|---|---|---|---|
| Wildcard `*.shumelahire.co.za` (CloudFront tenants) | us-east-1 | `…/cc463aab-7205-4d29-b582-c858010b2f1a` | ISSUED ✅ |
| Apex `shumelahire.co.za` (CloudFront) | us-east-1 | `…/675c8640-b608-477c-8088-d6b47a0c93e6` | PENDING_VALIDATION |
| `api.shumelahire.co.za` | af-south-1 | `…/dd7e853a-8c1a-4563-aca7-e8be61374dcb` | PENDING_VALIDATION |

### Validation CNAMEs to ADD AT XNEELO now (so the two pending certs validate)
```
_3abb9b82b9b160f82f3ab118490546e3.shumelahire.co.za.   CNAME  _b1a1141b63b010e51c60e38085841241.jkddzztszm.acm-validations.aws.
_c8e0905b9ad2ce7cabef27e9ccb82b7d.api.shumelahire.co.za. CNAME _a1c0719d67542edac42bd5a3cde04ed6.jkddzztszm.acm-validations.aws.
```
(Same DNS-validation method that issued the wildcard. ACM auto-issues once these resolve.)

## Prod GitHub environment secrets (currently only `AWS_ROLE_ARN` is set)
Set on the `prod` environment of `VeriGate-Org/shumela-hire-full-suite`:

| Secret | Value |
|---|---|
| `WILDCARD_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:379992419891:certificate/cc463aab-7205-4d29-b582-c858010b2f1a` |
| `CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:379992419891:certificate/675c8640-b608-477c-8088-d6b47a0c93e6` |
| `API_CERTIFICATE_ARN` | `arn:aws:acm:af-south-1:379992419891:certificate/dd7e853a-8c1a-4563-aca7-e8be61374dcb` |
| `LINKEDIN_CLIENT_ID` | **needed from you** (or copy from dev env) |
| `LINKEDIN_CLIENT_SECRET` | **needed from you** |
| `CLAUDE_API_KEY` | **needed from you** |

## Email records to replicate into the Route 53 zone (before NS cutover)
```
MX     shumelahire.co.za.        10 mail.shumelahire.co.za.
A      mail.shumelahire.co.za.   41.203.18.12
A      smtp/imap/pop             41.203.18.12   (or CNAME -> mail)
TXT    shumelahire.co.za.        "v=spf1 mx a include:spf.host-h.net ?all"
```
Plus hardening (new): DKIM (from Xneelo) + `_dmarc TXT "v=DMARC1; p=quarantine; rua=mailto:…"`.

## Sequenced execution — CUTOVER-FIRST (no Xneelo zone edits; validate from Route 53)

- ✅ **DONE** — prod GH secrets set: `WILDCARD_CERTIFICATE_ARN`, `CERTIFICATE_ARN`, `API_CERTIFICATE_ARN` (LinkedIn/Claude skipped per decision — LinkedIn sign-in + AI features inactive in prod for now).
- ✅ **DONE** — Route 53 zone pre-staged: email (MX/SPF/`mail`/`smtp`/`imap`/`pop`) + both ACM validation CNAMEs.
1. **[USER]** Provide the **full Xneelo zone export** (konsoleH → DNS) so every record is replicated before cutover — avoids breaking any record (other subdomains, Google/M365 verification TXT, etc.). I'll add anything missing (incl. temp apex/`www` → 41.203.18.12 so marketing survives the window).
2. **[USER/registrar]** **Switch nameservers** Xneelo → the 4 Route 53 NS (the only registrar action). Email continues (replicated). ACM apex + api certs then validate from Route 53 → ISSUED.
3. **[me, confirmed]** Push a `v*` tag → prod deploy (prod S3/CloudFront, API GW+Lambda, DynamoDB `shumelahire-prod-data`, Cognito `shumelahire-prod-users`; Frontend stack writes apex + wildcard A → prod CloudFront, overwriting the temp apex).
4. **[me]** Provision **IDC** + **uThukela** tenants fresh in prod (DynamoDB + Cognito prod pool) + seed; add DKIM/DMARC.
5. Capture IDC screenshots from prod (also serves the live demo). Marketing → own S3+CloudFront (W3) as a follow-up.

## Remaining blockers needing you
- **Full Xneelo zone export** (so replication is complete before cutover).
- **Nameserver switch** at the registrar (email-affecting; do once I confirm the zone is fully replicated).

## Bid-timeline note
Prod stand-up has external dependencies (Xneelo DNS, secret values, NS propagation) and may not complete before the 23 June bid close. **Recommended safeguard:** capture the Schedule 3 screenshots from the **dev** IDC tenant in parallel (the login automation just needs the React-controlled-input fix) so the bid isn't gated on the prod cutover.
