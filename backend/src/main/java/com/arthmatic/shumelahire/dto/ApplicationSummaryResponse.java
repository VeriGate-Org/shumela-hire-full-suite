package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * Counts for the whole application set, not for whichever page happens to be loaded.
 *
 * <p>The applications list computes its tabs and three of its four tiles with
 * {@code applications.filter(...)} over the twenty rows in hand, so "Screening: 38" means
 * thirty-eight <em>on this page</em>. This is the endpoint that makes those figures mean what they
 * appear to mean — the same job {@code RequisitionSummaryResponse} does for requisitions, and
 * deliberately the same shape.
 *
 * <p><b>Status counts are returned raw, all thirteen of them.</b> The five-bucket funnel on the
 * screen is a presentation choice and folding the statuses here would bake it into the API, where
 * the next caller would inherit a grouping it never asked for.
 *
 * <p><b>Departments and sources come from the data.</b> The page currently filters against a
 * hardcoded {@code DEPARTMENT_OPTIONS} list — Engineering, Marketing, Sales, HR, Finance,
 * Operations, Legal, Product — which has no overlap at all with this tenant's actual departments,
 * so choosing any of them empties the list and reads as "no applications" rather than "wrong
 * filter". A filter whose options are derived cannot drift out of step with what it filters.
 */
public class ApplicationSummaryResponse {

    /** Statuses where the candidacy has ended, one way or another. */
    public static final List<ApplicationStatus> CLOSED = List.of(
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.OFFER_DECLINED);

    private Map<String, Long> countsByStatus = new LinkedHashMap<>();
    private long total;

    /** Everything that has not ended — the set the funnel describes. */
    private long live;

    /** Submitted and never looked at. The headline: this is the work nobody has started. */
    private long unscreened;

    /** How long the longest-waiting unscreened application has been waiting, or null if none are. */
    private Long oldestUnscreenedDays;

    /** That application's id, so the caller can link straight to it rather than hunting for it. */
    private String oldestUnscreenedId;

    /**
     * Where the unscreened work is concentrated, worst first.
     *
     * <p>"64 unscreened" is a number. "41 of the 64 are on two adverts" is a decision about what to
     * do this morning, and it is the sentence the design leads with.
     */
    private List<AdvertBacklog> unscreenedByAdvert = new ArrayList<>();

    /** Departments that actually appear on applications, sorted, for the filter to offer. */
    private List<String> departments = new ArrayList<>();

    /** Sources that actually appear, likewise. */
    private List<String> sources = new ArrayList<>();

    /** One advert and the unscreened applications sitting against it. */
    public static class AdvertBacklog {
        private String jobPostingId;
        private String jobTitle;
        private long unscreened;

        public AdvertBacklog() {
        }

        public AdvertBacklog(String jobPostingId, String jobTitle, long unscreened) {
            this.jobPostingId = jobPostingId;
            this.jobTitle = jobTitle;
            this.unscreened = unscreened;
        }

        public String getJobPostingId() { return jobPostingId; }
        public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

        public long getUnscreened() { return unscreened; }
        public void setUnscreened(long unscreened) { this.unscreened = unscreened; }
    }

    /**
     * Build the summary.
     *
     * @param byStatus  every status mapped to its records — including the empty ones
     * @param now       the instant waits are measured against, passed in so this is testable
     */
    public static ApplicationSummaryResponse from(Map<ApplicationStatus, List<Application>> byStatus,
                                                  LocalDateTime now) {
        ApplicationSummaryResponse summary = new ApplicationSummaryResponse();

        // Sorted sets: the filter's options should be stable between calls, and a filter that
        // reorders itself on refresh is one a user stops trusting.
        var departments = new TreeSet<String>();
        var sources = new TreeSet<String>();

        for (ApplicationStatus status : ApplicationStatus.values()) {
            List<Application> found = byStatus.getOrDefault(status, List.of());

            // Every status appears, including the empty ones. A caller building a filter row needs
            // to know a status exists and holds nothing — otherwise "Rejected" silently vanishes on
            // a good week and comes back later, which reads as a bug.
            summary.countsByStatus.put(status.name(), (long) found.size());
            summary.total += found.size();
            if (!CLOSED.contains(status)) {
                summary.live += found.size();
            }

            for (Application application : found) {
                if (isPresent(application.getDepartment())) {
                    departments.add(application.getDepartment().trim());
                }
                if (isPresent(application.getApplicationSource())) {
                    sources.add(application.getApplicationSource().trim());
                }
            }
        }

        summary.departments = new ArrayList<>(departments);
        summary.sources = new ArrayList<>(sources);

        List<Application> unscreened = byStatus.getOrDefault(ApplicationStatus.SUBMITTED, List.of());
        summary.unscreened = unscreened.size();
        summary.oldestUnscreened(unscreened, now);
        summary.unscreenedByAdvert = backlogByAdvert(unscreened);

        return summary;
    }

    private void oldestUnscreened(List<Application> unscreened, LocalDateTime now) {
        Application oldest = null;
        for (Application application : unscreened) {
            LocalDateTime waitingSince = application.getSubmittedAt();
            // An application with no submission time has an unknown wait, which must not be read as
            // a wait of zero and must not win a comparison for "longest".
            if (waitingSince == null) continue;
            if (oldest == null || waitingSince.isBefore(oldest.getSubmittedAt())) {
                oldest = application;
            }
        }
        if (oldest != null) {
            oldestUnscreenedId = oldest.getId();
            oldestUnscreenedDays = Math.max(0, Duration.between(oldest.getSubmittedAt(), now).toDays());
        }
    }

    private static List<AdvertBacklog> backlogByAdvert(List<Application> unscreened) {
        Map<String, AdvertBacklog> byAdvert = new LinkedHashMap<>();
        for (Application application : unscreened) {
            String id = application.getJobPostingId();
            // Without an advert id there is nothing to group by. Counted in the headline, omitted
            // here rather than collected into a phantom "unknown advert" row.
            if (!isPresent(id)) continue;
            AdvertBacklog backlog = byAdvert.computeIfAbsent(id,
                    key -> new AdvertBacklog(key, application.getJobTitle(), 0));
            backlog.setUnscreened(backlog.getUnscreened() + 1);
        }
        List<AdvertBacklog> ordered = new ArrayList<>(byAdvert.values());
        ordered.sort(Comparator.comparingLong(AdvertBacklog::getUnscreened).reversed());
        return ordered;
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    public Map<String, Long> getCountsByStatus() { return countsByStatus; }
    public void setCountsByStatus(Map<String, Long> countsByStatus) { this.countsByStatus = countsByStatus; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getLive() { return live; }
    public void setLive(long live) { this.live = live; }

    public long getUnscreened() { return unscreened; }
    public void setUnscreened(long unscreened) { this.unscreened = unscreened; }

    public Long getOldestUnscreenedDays() { return oldestUnscreenedDays; }
    public void setOldestUnscreenedDays(Long oldestUnscreenedDays) { this.oldestUnscreenedDays = oldestUnscreenedDays; }

    public String getOldestUnscreenedId() { return oldestUnscreenedId; }
    public void setOldestUnscreenedId(String oldestUnscreenedId) { this.oldestUnscreenedId = oldestUnscreenedId; }

    public List<AdvertBacklog> getUnscreenedByAdvert() { return unscreenedByAdvert; }
    public void setUnscreenedByAdvert(List<AdvertBacklog> unscreenedByAdvert) { this.unscreenedByAdvert = unscreenedByAdvert; }

    public List<String> getDepartments() { return departments; }
    public void setDepartments(List<String> departments) { this.departments = departments; }

    public List<String> getSources() { return sources; }
    public void setSources(List<String> sources) { this.sources = sources; }
}
