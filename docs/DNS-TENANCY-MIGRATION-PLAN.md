# ShumelaHire — DNS, Tenancy & Marketing Separation Plan

**Status:** Approved decisions captured; execution pending.
**Decisions locked:** Marketing → AWS S3 + CloudFront · Email → stays on Xneelo (replicated) · Tenant routing → **wildcard `*.shumelahire.co.za`**.

---

## 1. Current state (grounded in code + live DNS)

| Layer | Reality |
|---|---|
| DNS authority | **Xneelo** (NS: `host-h.net`, `dns-h.com`) |
| Apex + `www` | `41.203.18.12` (Xneelo shared hosting = marketing) |
| `idc` | Do not resolve (not yet provisioned) |
| Email | `MX 10 mail.shumelahire.co.za` + `mail/smtp/imap/pop → 41.203.18.12` (Xneelo); SPF only — **no DKIM/DMARC** |
| App stack | Next.js static export → S3 + CloudFront; Spring Boot Lambda + API GW; DynamoDB; Cognito; **CDK (C#)** in **af-south-1** |
| Tenancy | Subdomain → org slug; `getTenantSubdomain()` (`src/lib/tenant-utils.ts:10`), resolve via `/api/public/tenants/resolve/{subdomain}` (`src/contexts/TenantContext.tsx:49`); `X-Tenant-Id` injected by CloudFront Function (`infra/cdk/ShumelaHireFrontendStack.cs:105`) |
| Marketing vs app | **Same** static export, one distribution: `src/app/(marketing)/` vs `src/app/(app)/`; no host-based split today |

## 2. Target architecture

| Hostname | Role | Backed by |
|---|---|---|
| `www.shumelahire.co.za` | Marketing | **New** marketing S3 + CloudFront |
| `shumelahire.co.za` (apex) | 301 → `www` | S3 redirect bucket / CloudFront |
| `*.shumelahire.co.za` (wildcard) | All tenants (idc, future clients) | App CloudFront (existing) |
| `idc.shumelahire.co.za` | IDC tenant (prod) | App CloudFront + provisioned org |
| Email (`MX`,`mail`,`smtp`,`imap`,`pop`,SPF) | Mailboxes | Xneelo (unchanged, replicated in R53) |
| DNS authority | — | **Route 53** |

Wildcard pairing: one `*` record + one wildcard ACM cert + a wildcard CloudFront alternate-domain-name ⇒ **zero-touch client onboarding** (just provision the org; the app already returns a graceful "Organization Not Found" for unknown subdomains).

## 3. Workstreams

### W1 — Route 53 migration (email-safe)
1. Export the **full** Xneelo zone (konsoleH) — every record, not just dig output.
2. Create Route 53 **public hosted zone** for `shumelahire.co.za` (same AWS account as CDK, so `HostedZone.FromLookup` works — `ShumelaHireFrontendStack.cs:242`).
3. Replicate **all** records, especially email (zero change): `MX 10 mail`, `mail/smtp/imap/pop A → 41.203.18.12`, `TXT v=spf1 mx a include:spf.host-h.net ?all`.
4. Lower TTLs on Xneelo to 300s a few days before cutover.
5. Validate the R53 zone by querying its NS directly **before** switching.
6. Switch nameservers at the **registrar** (confirm registrar = Xneelo) to the 4 Route 53 NS.
7. Monitor 24–48h; keep Xneelo zone intact for rollback.
8. Decommission Xneelo DNS only once stable (keep Xneelo **hosting/email**).

### W2 — Wildcard tenancy + cert + CloudFront
- **ACM cert must be in `us-east-1`** for CloudFront (NOT af-south-1 — the distribution is global). Issue/validate `*.shumelahire.co.za` (+ apex `shumelahire.co.za`) in **us-east-1**, DNS-validated via Route 53. *(API/ALB cert can stay in af-south-1.)*
- App CloudFront distribution: ensure alternate-domain-names include `*.shumelahire.co.za` and the wildcard cert is attached. CDK already models the wildcard record (`ShumelaHireFrontendStack.cs:204-217`) — verify/point at prod.
- Confirm the CloudFront Function still injects `X-Tenant-Id` for any tenant host.

### W3 — Marketing separation (the one genuinely new build)
The app currently serves marketing + app from one distribution. To put marketing on its own `www` distribution:
1. **Conditional static export:** build a marketing-only export (the `(marketing)` route group) separate from the app export. Options: a `MARKETING_ONLY` build flag in `next.config.ts`, or a small standalone marketing build.
2. **CDK:** add a marketing S3 bucket + CloudFront distribution + cert; Route 53 `www` ALIAS → marketing distribution; apex → redirect-to-`www`.
3. **App distribution:** keep serving tenant subdomains; ensure a tenant-subdomain root routes to that org's **login**, not the marketing landing (host-aware default route).
4. Update `.github/workflows/deploy.yml` to build/deploy marketing + app separately.

### W4 — Tenant provisioning + seeding (prod)
- Mechanism: create the **DynamoDB tenant record** (`TENANT#idc`), create **Cognito users** with `cognito:groups` + `custom:tenant_id`, then run a seed script (jobs, candidates, dashboards).
- Create a prod seed script for the `idc` tenant with prod Cognito pool + API base.
- Seed realistic IDC-aligned data so screenshots/demo look strong.

### W5 — Email hardening (while in Route 53)
- Add **DKIM** (from Xneelo mail) + **DMARC** (`_dmarc TXT v=DMARC1; p=quarantine; rua=...`), tighten SPF `?all` → `~all`, optional CAA. Currently all absent.

## 4. Sequencing — two tracks

**Track A — bid-critical (do now, no Route 53 dependency):** provision the `idc` tenant on the live app (DynamoDB org + Cognito users + seed), add `idc` CNAME → app CloudFront on **current Xneelo DNS**, ensure wildcard cert + CloudFront alt-domain cover it → log in → **capture Schedule 3 screenshots** → also serves the Section G live demo.

**Track B — strategic (parallel / after submission):** W1 (Route 53) → W2 (wildcard cert/CF) → W3 (marketing split) → W5 (email hardening). Lower urgency; the bid does not depend on it.

## 5. Risks & rollback
- **Email outage** = top risk. Mitigation: replicate MX/mail/SPF exactly; low TTL; keep Xneelo zone for instant NS rollback.
- **CloudFront cert region:** must be **us-east-1** or the distribution won't accept the cert.
- **`FromLookup` needs the zone in-account** before CDK deploy of the prod frontend stack.
- **Registrar access** required for the NS switch — confirm where the domain is registered.

## 6. Ground truth — verified in AWS (profile `alusa-dev`, account 379992419891, af-south-1)

- **There is NO prod environment.** Only `shumelahire-dev-*` CloudFormation stacks exist (foundation, serverless, api, frontend, analytics). Cognito = `shumelahire-dev-users` only; DynamoDB = `shumelahire-dev-data` only. **Everything live runs on dev.**
- **The live tenant subdomains all point to the DEV CloudFront distribution** `E1F793UOD2ZFB4` (`d1ioqyk4bgk3a.cloudfront.net`, origin `shumelahire-dev-frontend` S3). Current aliases: `dev`, `uthukela`. (`idc` is NOT yet an alias; `idc-demo`, `uthukela-demo`, `demo` were deleted.)
- **Route 53 already has a `shumelahire.co.za` hosted zone** (`Z10090221GJE31NDRDQD2`) **but it is non-authoritative and nearly empty** — only NS (`ns-…awsdns…`), SOA, and a `dev.shumelahire.co.za` delegation. **No email, apex, or www records.** Switching NS to it today would break email + marketing. A separate authoritative `dev.shumelahire.co.za` zone exists (`Z04775962DCOFLOI6075Z`).
- **The `*.shumelahire.co.za` wildcard cert already exists and is ISSUED in us-east-1** (`…cc463aab…`) and is **already attached to the dev distribution** — wildcard tenancy cert work is effectively done.
- **Only one tenant org is provisioned in dev:** `uThukela Water` (`subdomain=uthukela`, `TENANT#97282820-uthukela`). The `idc` org is **not** provisioned (hence "Organization Not Found"). Dev table has ~984 items.

### Implication — a real decision
The vision of "idc & demo linked to **prod**" requires either:
- **(Recommended) Stand up a real `prod` environment** — `cdk deploy` the `shumelahire-prod-*` stacks (the CDK already supports `EnvironmentName=prod`), populate the Route 53 zone (email + marketing + wildcard→prod CloudFront), then cut over NS. Gives proper isolation for a governance-grade IDC tenant.
- **(Stopgap) Keep serving from `dev`** — provision tenants on dev and point subdomains at the dev distribution. Fine for the bid/screenshots; not appropriate as the long-term home for a live IDC client.

### Still to confirm
- Registrar for `shumelahire.co.za` (for the eventual NS switch) — DNS is on Xneelo; confirm the domain is *registered* there too.
- Whether to deploy a real prod env now or after the bid.
