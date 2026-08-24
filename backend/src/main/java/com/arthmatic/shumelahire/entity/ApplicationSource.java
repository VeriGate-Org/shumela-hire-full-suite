package com.arthmatic.shumelahire.entity;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The channel an application arrived through.
 *
 * This is the single definition. It previously was not: the enum listed
 * thirteen values, ApplicationCreateRequest validated against a hand-written
 * regex admitting a different five, and the stored data used a third set —
 * with Application.applicationSource typed as String, so nothing reconciled
 * them. Half of one tenant's applications carried values absent from here,
 * which is how the largest sourcing channel reached a dashboard rendering as
 * "CAREERS PAGE".
 *
 * Adding a value here is now enough: the request DTO validates against
 * {@link #names()} rather than repeating the list.
 */
public enum ApplicationSource {
    EXTERNAL("Job Board / Website", "BOTH"),
    INTERNAL("Internal Posting", "BOTH"),
    REFERRAL("Employee Referral", "BOTH"),
    RECRUITER("Recruiter Contact", "BOTH"),
    SOCIAL_MEDIA("Social Media", "BOTH"),
    AGENCY("Recruitment Agency", "BOTH"),
    JOB_BOARD("Job Board", "BOTH"),
    CAREERS_PAGE("Careers Page", "BOTH"),
    LINKEDIN("LinkedIn", "REPORT"),
    INDEED("Indeed", "REPORT"),
    PNET("PNet", "REPORT"),
    CAREER_JUNCTION("CareerJunction", "REPORT"),
    CAREER_FAIR("Career Fair", "REPORT"),
    COMPANY_WEBSITE("Company Website", "REPORT"),
    DIRECT_APPLICATION("Direct Application", "REPORT"),
    OTHER("Other", "FORM");

    /**
     * Sources that name no particular channel — an application in one of these
     * is known to have come from outside, but not from where. They are what a
     * named board attribution replaces.
     */
    public static final Set<ApplicationSource> UNATTRIBUTED =
            Set.of(EXTERNAL, JOB_BOARD, CAREERS_PAGE, OTHER);

    private final String displayName;
    private final String category;

    ApplicationSource(String displayName, String category) {
        this.displayName = displayName;
        this.category = category;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCategory() {
        return category;
    }

    /** Every value's name, for validation that cannot drift from this list. */
    public static Set<String> names() {
        return Arrays.stream(values()).map(Enum::name).collect(Collectors.toUnmodifiableSet());
    }

    /**
     * Resolves a stored value, which is a String and so may be anything.
     * Empty rather than throwing — a source that cannot be read must not stop
     * an application being displayed.
     */
    public static Optional<ApplicationSource> from(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(source -> source.name().equalsIgnoreCase(value.trim()))
                .findFirst();
    }
}
