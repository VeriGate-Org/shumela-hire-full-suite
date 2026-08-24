package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * A sandbox provider for a job board, for environments that have no
 * credentials for the real one.
 *
 * The API connectors ({@link PNetConnector}, {@link CareerJunctionConnector},
 * {@link IndeedConnector}, {@link LinkedInConnector}) each require a key. With
 * no key the board falls through to {@link ManualJobBoardConnector}, which
 * records that someone intends to post and links out to the employer portal —
 * correct, but it exercises none of the publish, sync or takedown path.
 *
 * A board in {@code simulated} mode runs that whole path against an in-process
 * stand-in: it mints an external reference, holds a posting URL, ages towards
 * expiry, and reports engagement on sync. It is selected per board, per
 * environment, by {@code job-boards.<board>.mode=simulated} — the same shape as
 * a payment provider's test mode, and off by default.
 *
 * <p><b>Engagement figures are modelled, not measured.</b> They are a
 * deterministic function of how long the posting has been live and of the
 * posting's own id, so they move as time passes, never move backwards, and
 * reproduce exactly on a re-run. They are not a claim about real traffic and
 * must not be reported to anyone as such.
 */
public class SimulatedJobBoardConnector implements JobBoardConnector {

    private static final Logger logger = LoggerFactory.getLogger(SimulatedJobBoardConnector.class);

    private static final int POSTING_LIFETIME_DAYS = 30;

    /** Views accrued per hour live, before the per-posting variation below. */
    private static final double VIEWS_PER_HOUR = 7.5;

    /** Roughly one in twelve viewers opens the advert. */
    private static final double CLICK_RATE = 1.0 / 12.0;

    /** Roughly one in six who open it go on to apply. */
    private static final double APPLICATION_RATE = 1.0 / 6.0;

    private final JobBoardType boardType;
    private final JobBoardPostingDataRepository repository;
    private final AuditLogService auditLogService;
    private final Set<String> simulatedTenants;

    public SimulatedJobBoardConnector(JobBoardType boardType,
                                      JobBoardPostingDataRepository repository,
                                      AuditLogService auditLogService,
                                      Set<String> simulatedTenants) {
        this.boardType = boardType;
        this.repository = repository;
        this.auditLogService = auditLogService;
        this.simulatedTenants = simulatedTenants;
    }

    @Override
    public JobBoardType getSupportedType() {
        return boardType;
    }

    /**
     * Enabled only for the tenants named in {@code job-boards.simulated-tenants}.
     *
     * A deployment is shared: turning simulation on for one tenant's benefit
     * must not hand a different, paying tenant a posting that claims to be live
     * and is not. For every other tenant this returns false, the registry finds
     * no connector, and the board falls through to a manual posting exactly as
     * it did before. An empty allow-list simulates for nobody.
     */
    @Override
    public boolean isEnabled() {
        String tenantId = TenantContext.getCurrentTenant();
        return tenantId != null && simulatedTenants.contains(tenantId);
    }

    @Override
    public JobBoardPosting post(String jobPostingId, String boardConfig) {
        JobBoardPosting posting = new JobBoardPosting();
        posting.setJobPostingId(jobPostingId);
        posting.setBoardType(boardType);
        posting.setBoardConfig(boardConfig);

        String externalId = externalReference(jobPostingId);
        posting.setExternalPostId(externalId);
        // Deliberately no externalUrl. A sandbox posting has no advert on the
        // board, so any URL built for it resolves to that board's own
        // not-found page — a dead link into a third party's site, rendered as
        // a "View" button next to a green Published badge. The UI only shows
        // that button when a URL is present, so leaving it null removes the
        // affordance rather than offering one that cannot work.
        posting.setExternalUrl(null);
        posting.setStatus(PostingStatus.POSTED);
        posting.setPostedAt(LocalDateTime.now());
        posting.setExpiresAt(LocalDateTime.now().plusDays(POSTING_LIFETIME_DAYS));
        posting.setViewCount(0);
        posting.setClickCount(0);
        posting.setApplicationCount(0);

        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "POST_TO_BOARD", "JOB_BOARD_POSTING", saved.getId(),
                "Simulated posting: job " + jobPostingId + " to " + boardType.getDisplayName()
                        + " (" + externalId + ")");
        logger.info("Simulated posting of job {} to {} as {}",
                jobPostingId, boardType.getDisplayName(), externalId);
        return saved;
    }

    @Override
    public JobBoardPosting remove(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new IllegalArgumentException("Posting not found: " + postingId));

        posting.setStatus(PostingStatus.REMOVED);
        JobBoardPosting saved = repository.save(posting);
        auditLogService.saveLog("SYSTEM", "REMOVE_POSTING", "JOB_BOARD_POSTING", postingId,
                "Removed simulated " + boardType.getDisplayName() + " posting");
        logger.info("Removed simulated {} posting {}", boardType.getDisplayName(), postingId);
        return saved;
    }

    @Override
    public JobBoardPosting sync(String postingId) {
        JobBoardPosting posting = repository.findById(postingId)
                .orElseThrow(() -> new IllegalArgumentException("Posting not found: " + postingId));

        if (posting.getStatus() == PostingStatus.REMOVED) {
            return posting;
        }

        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(LocalDateTime.now())) {
            posting.setStatus(PostingStatus.EXPIRED);
        }

        applyModelledEngagement(posting);
        return repository.save(posting);
    }

    /**
     * Sets view, click and application counts from how long the posting has
     * been live. Engagement stops accruing once the posting expires, so an
     * expired advert does not keep gathering views.
     */
    void applyModelledEngagement(JobBoardPosting posting) {
        LocalDateTime postedAt = posting.getPostedAt();
        if (postedAt == null) {
            return;
        }

        LocalDateTime accrueUntil = LocalDateTime.now();
        if (posting.getExpiresAt() != null && posting.getExpiresAt().isBefore(accrueUntil)) {
            accrueUntil = posting.getExpiresAt();
        }

        long hoursLive = Duration.between(postedAt, accrueUntil).toHours();
        if (hoursLive <= 0) {
            posting.setViewCount(0);
            posting.setClickCount(0);
            posting.setApplicationCount(0);
            return;
        }

        // Each posting gets its own steady rate so two adverts published
        // together do not report identical figures. Derived from the id, so it
        // is the same on every sync rather than drifting run to run.
        double variation = 0.75 + (Math.abs(stableSeed(posting)) % 50) / 100.0;

        int views = (int) Math.round(hoursLive * VIEWS_PER_HOUR * variation);
        int clicks = (int) Math.round(views * CLICK_RATE);
        int applications = (int) Math.round(clicks * APPLICATION_RATE);

        posting.setViewCount(views);
        posting.setClickCount(clicks);
        posting.setApplicationCount(applications);
    }

    private int stableSeed(JobBoardPosting posting) {
        String basis = posting.getId() != null ? posting.getId() : posting.getJobPostingId();
        return basis != null ? basis.hashCode() : 0;
    }

    /**
     * An external reference in the shape each board actually uses, so the value
     * on screen is recognisable to someone who works with that board.
     */
    private String externalReference(String jobPostingId) {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return switch (boardType) {
            case PNET -> "PNET-" + token;
            case CAREER_JUNCTION -> "CJ-" + token;
            case INDEED -> "IND-" + token;
            case LINKEDIN -> "LI-" + token;
            default -> boardType.name() + "-" + token;
        };
    }

}
