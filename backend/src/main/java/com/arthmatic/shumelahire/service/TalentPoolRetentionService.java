package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.TalentPoolEntry;
import com.arthmatic.shumelahire.repository.TalentPoolEntryDataRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * How long a candidate stays in a talent pool, and what happens when that runs out.
 *
 * <p>Entries are kept for <b>24 months from last contact</b>, the candidate is warned 30 days
 * before deletion, and the nightly job runs. Rationale for each figure is in
 * {@code docs/TALENT-POOL-RETENTION-DECISION.md}; every one is overridable per environment, and
 * setting {@code talent-pool-months} to zero makes this class inert again.
 *
 * <p>POPIA §14 requires deletion once the purpose for collecting personal information is achieved.
 * For a recruitment pool the original purpose ends when the vacancy is filled; keeping someone on
 * file for future opportunities is a new purpose that needs its own basis, usually consent. The
 * notice is what asks for it.
 *
 * <p>Five rules, each of which is a way this could destroy data it should not:
 *
 * <ol>
 *   <li><b>A null {@code retainUntil} never expires.</b> Every entry written before a period was
 *       configured carries null. Reading that as "due" would delete the whole pool base on the
 *       first run — which is why {@link #backfillRetentionDates} stamps rather than deletes.</li>
 *   <li><b>Nothing is deleted without notice.</b> An entry with no {@code retentionNoticeSentAt} is
 *       warned, not purged, however far past its date it is.</li>
 *   <li><b>The grace period is measured from the notice, not from the expiry date.</b> A candidate
 *       warned yesterday about a date that passed a year ago still gets their full window.</li>
 *   <li><b>Engagement is not correspondence.</b> {@link #recordEngagement} fires on what a
 *       candidate does — applying, being shortlisted, being interviewed, being made an offer. It
 *       must never fire on a message we send them, because the retention notice is one: that would
 *       push its own deadline out nightly and nothing would ever be deleted, while every log line
 *       claimed the policy was working.</li>
 *   <li><b>Purging is separately switched on.</b> Deletion can be held back for a first cycle,
 *       though not indefinitely — the notice promises it.</li>
 * </ol>
 */
@Service
public class TalentPoolRetentionService {

    private static final Logger logger = LoggerFactory.getLogger(TalentPoolRetentionService.class);

    /**
     * Months a candidate is kept after last contact. <b>24.</b>
     *
     * <p>The longer end of ordinary South African recruitment practice, which is defensible here
     * because it is paired with a notice: at 24 months the candidate is told, offered the chance to
     * stay, and only deleted if they do not answer. A shorter silent period would be worse for both
     * sides — the recruiter loses a warm pool, the candidate loses the choice.
     *
     * <p>Zero or negative is treated as unset rather than as "delete immediately". A misconfigured
     * value must fail safe, and the failure mode of the alternative is unrecoverable.
     */
    @Value("${shumelahire.retention.talent-pool-months:24}")
    private int retentionMonths = 24;

    /** Days between warning a candidate and deleting their entry. */
    @Value("${shumelahire.retention.talent-pool-notice-days:30}")
    private int noticeDays = 30;

    /**
     * Whether the purge may actually delete.
     *
     * <p><b>On, and deliberately tied to the notice rather than left off.</b> Sending a candidate a
     * message saying their details will be deleted in 30 days and then not deleting them is a false
     * statement to a data subject — worse than either enabling both or enabling neither. The flag
     * remains separate so a deployment can hold deletion back while it watches a first cycle, but
     * that is a temporary state, not the resting one.
     */
    @Value("${shumelahire.retention.talent-pool-purge-enabled:true}")
    private boolean purgeEnabled = true;

    private final TalentPoolEntryDataRepository entryRepository;
    private final NotificationService notificationService;

    public TalentPoolRetentionService(TalentPoolEntryDataRepository entryRepository,
                                      NotificationService notificationService) {
        this.entryRepository = entryRepository;
        this.notificationService = notificationService;
    }

    /** Whether a retention period has been configured at all. */
    public boolean isConfigured() {
        return retentionMonths > 0;
    }

    /**
     * The date an entry should be retained until, or null if no period is configured.
     *
     * <p>Measured from {@code lastContactedAt}, falling back to {@code addedAt}.
     *
     * <p>{@code lastContactedAt} is written by {@link #recordEngagement}, which fires when a
     * candidate applies, is shortlisted, is booked for an interview or is made an offer, and by the
     * contact endpoint a recruiter can call directly. An entry nobody has engaged with since it was
     * created therefore ages from {@code addedAt}, which is the intended behaviour rather than a
     * gap.
     */
    public LocalDate retainUntilFor(TalentPoolEntry entry) {
        if (!isConfigured() || entry == null) {
            return null;
        }
        LocalDateTime from = entry.getLastContactedAt() != null
                ? entry.getLastContactedAt()
                : entry.getAddedAt();
        if (from == null) {
            // An entry with no dates at all cannot be aged. Returning null leaves it retained, which
            // is the safe direction: a missing timestamp is a data fault, not a licence to delete.
            return null;
        }
        return from.toLocalDate().plusMonths(retentionMonths);
    }

    /** Stamp the retention date onto an entry. Applied when an entry is created. */
    public void applyRetention(TalentPoolEntry entry) {
        entry.setRetainUntil(retainUntilFor(entry));
    }

    /**
     * Push an entry's retention date out because somebody made contact.
     *
     * <p>The other half of the notice: a candidate who responds stays. Also clears any notice
     * already sent, so a later expiry warns them again rather than deleting silently on the
     * strength of a warning they answered.
     */
    @Transactional
    public TalentPoolEntry recordContact(String entryId) {
        TalentPoolEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Talent pool entry not found: " + entryId));
        entry.setLastContactedAt(LocalDateTime.now());
        entry.setRetainUntil(retainUntilFor(entry));
        entry.setRetentionNoticeSentAt(null);
        return entryRepository.save(entry);
    }

    /**
     * Stamp a retention date onto entries that have none.
     *
     * <p>Without this the policy would only ever apply to entries created after it was switched on.
     * Everything already in the pool carries a null {@code retainUntil}, and a null never expires —
     * so the oldest records, which are exactly the ones the policy exists for, would be the only
     * ones it never touched.
     *
     * <p>Safe to run every night because <b>stamping is not deleting</b>. A backfilled entry that is
     * already past its date still gets a notice and still gets its full grace period before
     * anything happens to it, so the first run of a newly enabled policy cannot delete anyone.
     *
     * @return how many entries were given a retention date
     */
    @Transactional
    public int backfillRetentionDates() {
        if (!isConfigured()) {
            return 0;
        }
        int stamped = 0;
        for (TalentPoolEntry entry : entryRepository.findAll()) {
            if (entry.getRetainUntil() != null) {
                continue;
            }
            LocalDate retainUntil = retainUntilFor(entry);
            if (retainUntil == null) {
                // No addedAt and no contact date. Left alone rather than given an invented date.
                continue;
            }
            entry.setRetainUntil(retainUntil);
            entryRepository.save(entry);
            stamped++;
        }
        if (stamped > 0) {
            logger.info("Stamped a retention date on {} talent pool entries that had none", stamped);
        }
        return stamped;
    }

    /**
     * Record that a candidate engaged with us, against every pool they are in.
     *
     * <p>Retention was only ever extended by a recruiter explicitly calling the contact endpoint.
     * Everything else the candidate did — reapplying, being shortlisted, being interviewed, being
     * made an offer — left the clock running from the day they were added, so someone the
     * organisation was actively hiring could be warned that their details were about to be deleted.
     *
     * <p><b>What counts is engagement, not correspondence.</b> This is the distinction that makes
     * the feature work at all: if "we sent them an email" counted, the retention notice itself would
     * be contact, it would push its own deadline out on every run, and nothing would ever be
     * deleted. The notice deliberately does not call this, and a test holds that line.
     *
     * <p>Never throws. Contact inference is a side effect of a candidate doing something real, and a
     * failure to extend a retention date must not fail the application they were submitting.
     *
     * @return how many pool entries were extended
     */
    @Transactional
    public int recordEngagement(String applicantId, String reason) {
        if (!isConfigured() || applicantId == null || applicantId.isBlank()) {
            return 0;
        }
        try {
            List<TalentPoolEntry> entries = entryRepository.findByApplicantId(applicantId);
            int extended = 0;
            for (TalentPoolEntry entry : entries) {
                // A removed entry is left alone. Its clock still runs — a soft delete is still
                // retained data — but re-engaging elsewhere should not silently resurrect the
                // retention of a pool somebody deliberately took them out of.
                if (entry.getRemovedAt() != null) {
                    continue;
                }
                entry.setLastContactedAt(LocalDateTime.now());
                entry.setRetainUntil(retainUntilFor(entry));
                entry.setRetentionNoticeSentAt(null);
                entryRepository.save(entry);
                extended++;
            }
            if (extended > 0) {
                logger.info("Extended retention on {} talent pool entries for applicant {}: {}",
                        extended, applicantId, reason);
            }
            return extended;
        } catch (Exception e) {
            logger.error("Could not record engagement for applicant {} ({}): {}",
                    applicantId, reason, e.getMessage());
            return 0;
        }
    }

    /** Entries past their retention date that have not yet been warned. */
    public List<TalentPoolEntry> entriesDueNotice(LocalDate today) {
        if (!isConfigured()) {
            return List.of();
        }
        return entryRepository.findAll().stream()
                .filter(e -> e.getRetainUntil() != null)
                .filter(e -> !e.getRetainUntil().isAfter(today))
                .filter(e -> e.getRetentionNoticeSentAt() == null)
                .toList();
    }

    /** Entries warned long enough ago that the grace period has run out. */
    public List<TalentPoolEntry> entriesDuePurge(LocalDate today) {
        if (!isConfigured()) {
            return List.of();
        }
        return entryRepository.findAll().stream()
                .filter(e -> e.getRetainUntil() != null)
                .filter(e -> e.getRetentionNoticeSentAt() != null)
                // Measured from the notice, not the expiry date: a candidate warned yesterday about
                // a date that passed a year ago still gets their full window to answer.
                .filter(e -> !e.getRetentionNoticeSentAt().toLocalDate().plusDays(noticeDays).isAfter(today))
                .toList();
    }

    /**
     * What the policy would do today, without doing any of it.
     *
     * <p>Mirrors {@code DocumentRetentionService.previewRetention}. This is the thing to run first
     * after setting a period: it reports the counts and never writes.
     */
    public Map<String, Object> previewRetention(LocalDate today) {
        Map<String, Object> preview = new LinkedHashMap<>();
        preview.put("configured", isConfigured());
        preview.put("retentionMonths", retentionMonths);
        preview.put("noticeDays", noticeDays);
        preview.put("purgeEnabled", purgeEnabled);
        preview.put("wouldNotify", entriesDueNotice(today).size());
        preview.put("wouldDelete", entriesDuePurge(today).size());
        preview.put("totalEntries", entryRepository.findAll().size());
        // Named explicitly so an operator reading the output cannot mistake a preview for a run.
        preview.put("note", "Preview only. Nothing was changed.");
        return preview;
    }

    /**
     * Warn every candidate whose entry has reached its retention date.
     *
     * @return how many notices were sent
     */
    @Transactional
    public int sendRetentionNotices(LocalDate today) {
        if (!isConfigured()) {
            return 0;
        }

        int sent = 0;
        for (TalentPoolEntry entry : entriesDueNotice(today)) {
            try {
                notificationService.notifyTalentPoolRetentionExpiring(entry, noticeDays);
                entry.setRetentionNoticeSentAt(LocalDateTime.now());
                entryRepository.save(entry);
                sent++;
            } catch (Exception e) {
                // The stamp is only written after the notification succeeds, so a failure here
                // leaves the entry due a notice on the next run rather than starting its deletion
                // clock on a warning nobody received.
                logger.error("Could not send retention notice for talent pool entry {}: {}",
                        entry.getId(), e.getMessage());
            }
        }
        return sent;
    }

    /**
     * Delete entries whose notice period has run out.
     *
     * @return how many entries were deleted
     */
    @Transactional
    public int purgeExpiredEntries(LocalDate today) {
        if (!isConfigured()) {
            return 0;
        }
        if (!purgeEnabled) {
            List<TalentPoolEntry> due = entriesDuePurge(today);
            if (!due.isEmpty()) {
                // Said out loud every run. A policy that is silently not deleting looks identical to
                // one with nothing to delete, and only one of those needs somebody's attention.
                logger.warn("{} talent pool entries are past their notice period but purging is "
                        + "disabled (shumelahire.retention.talent-pool-purge-enabled)", due.size());
            }
            return 0;
        }

        List<String> deleted = new ArrayList<>();
        for (TalentPoolEntry entry : entriesDuePurge(today)) {
            try {
                entryRepository.deleteById(entry.getId());
                deleted.add(entry.getId());
            } catch (Exception e) {
                logger.error("Could not delete expired talent pool entry {}: {}",
                        entry.getId(), e.getMessage());
            }
        }
        if (!deleted.isEmpty()) {
            logger.info("Deleted {} talent pool entries past their retention period", deleted.size());
        }
        return deleted.size();
    }
}
