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
 * <p><b>Nothing here deletes anything until IDC sets a retention period.</b> That decision is not
 * an engineering one — see {@code docs/TALENT-POOL-RETENTION-DECISION.md} — and a purge running on a
 * period nobody agreed would destroy candidate history on an invented schedule. With
 * {@code talent-pool-months} unset, {@link #retainUntilFor} returns null, nothing is ever eligible,
 * and {@link #purgeExpiredEntries} does nothing on every run.
 *
 * <p>POPIA §14 requires deletion once the purpose for collecting personal information is achieved.
 * For a recruitment pool the original purpose ends when the vacancy is filled; keeping someone on
 * file for future opportunities is a new purpose that needs its own basis, usually consent. The
 * notice below is what asks for it.
 *
 * <p>Four rules, each of which is a way this could destroy data it should not:
 *
 * <ol>
 *   <li><b>A null {@code retainUntil} never expires.</b> Every entry written before a period was
 *       configured carries null. Reading that as "due" would delete the whole pool base on the
 *       first run.</li>
 *   <li><b>Nothing is deleted without notice.</b> An entry with no {@code retentionNoticeSentAt} is
 *       warned, not purged, however far past its date it is.</li>
 *   <li><b>The grace period is measured from the notice, not from the expiry date.</b> A candidate
 *       warned yesterday about a date that passed a year ago still gets their full window.</li>
 *   <li><b>Purging is separately switched on.</b> Notices can run for a full cycle with deletion
 *       still off, which is the only way to see what the policy does before it does it.</li>
 * </ol>
 */
@Service
public class TalentPoolRetentionService {

    private static final Logger logger = LoggerFactory.getLogger(TalentPoolRetentionService.class);

    /**
     * Months a candidate is kept after last contact. <b>Unset by default.</b>
     *
     * <p>Zero or negative is treated as unset rather than as "delete immediately". A misconfigured
     * value must fail safe, and the failure mode of the alternative is unrecoverable.
     */
    @Value("${shumelahire.retention.talent-pool-months:0}")
    private int retentionMonths;

    /** Days between warning a candidate and deleting their entry. */
    @Value("${shumelahire.retention.talent-pool-notice-days:30}")
    private int noticeDays = 30;

    /**
     * Whether the purge may actually delete. Notices are sent regardless.
     *
     * <p>Separate from the scheduler's own switch so a deployment can run notices for a full cycle
     * and read what the policy is about to do, before anything is destroyed.
     */
    @Value("${shumelahire.retention.talent-pool-purge-enabled:false}")
    private boolean purgeEnabled;

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
     * <p><b>Note that nothing in the product currently writes {@code lastContactedAt}</b> — only the
     * DynamoDB mapper touches it, persisting a value no service sets. So in practice this runs from
     * when the candidate was added, which is more aggressive than intended: someone actively engaged
     * with for a year still ages out on the clock that started the day they were added. Reading the
     * field anyway means this becomes correct the day contact is recorded, rather than needing to be
     * found and changed then.
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
