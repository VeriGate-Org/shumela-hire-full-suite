# Talent pool retention and approval thresholds — the policy in force

**Status: set and live.** Talent pool entries are kept for **24 months** from last contact, the
candidate is **warned 30 days before** deletion, and the nightly job is **on**.

These are product defaults chosen on the evidence below, not client instructions. Every one is
overridable per environment, and a deployment with a different lawful basis or a different appetite
should change them rather than inherit them.

---

## What the product did before

Talent pool entries were kept indefinitely. No retention period, no expiry, no purge.

`TalentPoolService.removeEntry` is still a **soft delete**: it sets `removedAt` and `removalReason`
and keeps the applicant link. "Removed from the pool" has never meant "data deleted", and it still
does not — what has changed is that a removed entry now ages out on the same clock as any other.

## The retention period: 24 months

POPIA §14 requires deletion once the purpose for collecting personal information has been achieved,
unless retention is authorised by law, justified by the operation, or consented to by the data
subject. For a recruitment pool the original purpose — a specific vacancy — ends when that vacancy
is filled. Keeping someone on file for future opportunities is a *new* purpose needing its own
basis, and consent is the usual one.

24 months is the longer end of ordinary South African recruitment practice, and it is defensible
here **because it is paired with a notice**. At 24 months the candidate is told, offered the chance
to stay, and only deleted if they do not answer. A shorter silent period would be worse for both
sides: the recruiter loses a warm pool, and the candidate loses the choice.

### Notices and deletion are enabled together, deliberately

The notice says "we will delete your details in 30 days". Sending that and then not deleting is a
false statement to a data subject — worse than either enabling both or enabling neither. So
`talent-pool-purge-enabled` defaults to **true** alongside the notice.

The flag still exists separately so a deployment can hold deletion back while it watches a first
cycle. That is a temporary state, not the resting one.

### Entries that predate the policy

A null `retainUntil` never expires — otherwise switching the policy on would delete the whole pool
base overnight. But that rule alone would mean the policy only ever applied to *new* entries, and
the oldest records, which are exactly what it exists for, would be the only ones it never touched.

So the nightly job **backfills first**: any entry without a retention date gets one, computed from
last contact or, failing that, when it was added. Stamping is not deleting. A backfilled entry that
is already overdue still gets a notice and still gets its full 30 days, so the first run after
enabling the policy cannot delete anybody.

## Approval thresholds: R900,000 and R1,125,000

Two gates, both setting `approvalLevelRequired` to 2 instead of 1, previously hard-coded
independently at **R200,000** (base salary) and **R150,000** (total compensation). Read together
they left a band where an offer was called high value and then routed to a manager anyway.

They are now chosen as a **pair**, to catch the same appointments:

| Gate | Measures | Value |
|---|---|---|
| `executive-salary-threshold` | `proposedTargetSalary` — base salary | **R900,000** |
| `offer-high-value-threshold` | `getTotalCompensation()` — base + allowances + bonus | **R1,125,000** |

Total compensation runs roughly **1.25× base** for a typical package, so setting the offer gate at
1.25× the salary gate means an appointment that trips one trips the other. The dead band closes by
construction rather than by picking two round numbers and hoping. A test asserts the ratio, so the
two cannot quietly drift apart again.

The level moved up because R200,000 a year would have sent almost every professional appointment to
an executive, which is how an approval gate stops being read. R900,000 base sits where senior
appointments are, not where ordinary ones are.

## Configuration

```yaml
shumelahire:
  approval:
    executive-salary-threshold: ${APPROVAL_EXECUTIVE_SALARY_THRESHOLD:900000}
    offer-high-value-threshold: ${APPROVAL_OFFER_HIGH_VALUE_THRESHOLD:1125000}
  retention:
    talent-pool-months: ${TALENT_POOL_RETENTION_MONTHS:24}
    talent-pool-notice-days: ${TALENT_POOL_RETENTION_NOTICE_DAYS:30}
    talent-pool-purge-enabled: ${TALENT_POOL_PURGE_ENABLED:true}

talent-pool:
  retention:
    scheduler:
      enabled: ${TALENT_POOL_RETENTION_SCHEDULER_ENABLED:true}
```

**One `shumelahire:` block, deliberately.** Two branches once appended one each; YAML does not merge
duplicate top-level keys, so one silently wins. `ApplicationYamlTest` now fails the build on that.

### Before changing the period

`GET /api/talent-pools/retention/preview` reports what the policy would do today and writes
nothing. Read it before believing what the nightly job is about to do.

## Recording contact

`POST /api/talent-pools/entries/{id}/contact` records that somebody engaged with a candidate. It
pushes the retention date out and clears any notice already sent, so a candidate who is being
talked to is not warned that they are about to be deleted.

This closes a gap that mattered: **nothing in the product could write `lastContactedAt`.** The field
existed and the DynamoDB mapper persisted it, but no service ever set it, so it was null on every
record. Harmless while nothing read it — and a real problem the moment retention did, because the
clock would have run from the day a candidate was added, ageing out people who were actively being
engaged with.

## What is still not automatic

Contact is recorded when somebody calls that endpoint. Nothing infers it from a candidate replying
to an email, applying again, or being shortlisted. Those would each be reasonable signals and none
of them is wired up — so a pool worked entirely outside the product will still age out on the date
its entries were created.
