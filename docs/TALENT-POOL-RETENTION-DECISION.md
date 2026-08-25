# Talent pool retention — the decision IDC has to make

**Status: awaiting a decision. Nothing in the product deletes talent pool entries today, and
nothing will until the period below is set.**

This document exists because the engineering was the easy part and the wrong part to start with.
A purge job running on a period nobody agreed would destroy candidate history on an invented
schedule, and deletion is the one thing that cannot be undone.

---

## What the product does now

Talent pool entries are kept indefinitely. There is no retention period, no expiry, and no purge.

`TalentPoolService.removeEntry` is a **soft delete**: it sets `removedAt` and `removalReason` and
saves the record. The entry keeps its link to the applicant, so "removed from the pool" does not
mean "data deleted". A candidate removed two years ago is still on file, fully identifiable.

## Why that is a problem

POPIA §14 requires a responsible party to delete personal information once the purpose for
collecting it has been achieved, unless retention is authorised by law, justified by the operation,
or **consented to by the data subject**.

Recruitment pools are the awkward case. The original purpose — a specific vacancy — is achieved the
moment that vacancy is filled. Keeping the candidate on file afterwards is a *new* purpose (future
opportunities), and that needs its own basis. Consent is the usual one.

The immediate exposure is not that data is held too long. It is that:

- **Nobody can say for how long.** There is no period to state in a privacy notice or a PAIA manual.
- **Nobody can answer a candidate who asks to be removed** with anything other than a soft delete
  that keeps their record.

Both are answerable with a decision, not with code.

---

## The decision

**How long should a candidate stay in a talent pool after their last meaningful contact?**

Common South African recruitment practice is **12 to 24 months**. Shorter is more defensible;
longer is more useful to the recruiter. IDC must pick a number and record it in their privacy
notice and PAIA manual.

Secondary decisions that follow from it:

| Question | Default this implementation assumes |
|---|---|
| Warn the candidate before deleting? | Yes — a notice is sent, then a grace period runs before deletion |
| How long is the grace period? | 30 days, configurable |
| Does a candidate who responds stay? | Yes — recording contact extends the retention date |
| Do soft-deleted (`removedAt`) entries expire too? | Yes, on the same clock. A removed entry is still retained data |

## What is built, and what it does until the decision is made

The code is in place and **inert by default**:

- `TalentPoolEntry.retainUntil` — the date this entry becomes eligible for deletion, stored per
  record so retention is auditable rather than implied by a cron expression.
- `TalentPoolEntry.retentionNoticeSentAt` — when the candidate was warned.
- `TalentPoolRetentionService` — computes eligibility, sends notices, and purges. It also has a
  **preview** that reports what *would* be deleted without deleting anything, mirroring
  `DocumentRetentionService.previewRetention`.
- `TalentPoolRetentionScheduler` — `@ConditionalOnProperty(matchIfMissing = false)`, so it does not
  run unless switched on. This follows `DocumentRetentionScheduler`, which is also off by default.

**With no retention period configured, `retainUntil` is never set, nothing is ever eligible, and no
entry is ever deleted.** A null `retainUntil` is treated as "no expiry", never as "expired" — the
same rule as agency contract expiry, and for the same reason: reading "not recorded" as "due" would
delete the entire pool base on the first run.

## To switch it on

```yaml
shumelahire:
  retention:
    talent-pool-months: 24        # unset by default; nothing expires until this is set
    talent-pool-notice-days: 30   # warning period before deletion
    talent-pool-purge-enabled: false
talent-pool:
  retention:
    scheduler:
      enabled: false              # the scheduler itself, off by default
```

Recommended sequence:

1. Set `talent-pool-months`. Entries created from then on get a `retainUntil`.
2. Backfill `retainUntil` on existing entries — **this is a deliberate manual step**, because it is
   the point at which a real date is written against real people's records.
3. Run the preview. Read what it says. It deletes nothing.
4. Enable the scheduler with `talent-pool-purge-enabled: false` so notices go out but nothing is
   deleted, and let a full notice period elapse.
5. Only then set `talent-pool-purge-enabled: true`.

---

## Known gap: nothing records contact

Retention is meant to run from **last meaningful contact**, and `TalentPoolEntry.lastContactedAt`
exists for exactly that. **No service ever writes it.** The only code touching the field is the
DynamoDB mapper, persisting a value that nothing sets, so it is null on every record.

The implementation reads `lastContactedAt` and falls back to `addedAt`, so it becomes correct the
day something records contact. Until then retention effectively runs from when the candidate was
added, which is **more aggressive** than intended — a candidate actively engaged with for a year
still ages out on the clock that started when they were added.

Recording contact is a product gap, not a retention one, but it should be closed before the purge
is enabled or the policy will delete people it was designed to keep.
