package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * How much the signed-in person may approve.
 *
 * <p><b>Why this exists.</b> {@code GET /api/approvals/pending} took the approval level as a query
 * parameter, and offers are filtered by it — an offer is returned when its
 * {@code approvalLevelRequired} is at or below the level supplied. Since the caller supplied it,
 * any of the five permitted roles could ask for {@code approvalLevel=99} and receive every offer
 * awaiting approval, complete with candidate name, job title and total compensation. A recruiter
 * could read an executive's package.
 *
 * <p>The parameter was written as a placeholder — the endpoint's own javadoc said "once approval
 * level lives on the user, this parameter should go" — but a placeholder that widens what a caller
 * may read is not a neutral one. Authority is now read from the user record and the parameter is
 * gone.
 *
 * <p>An unknown or unset level is <b>zero</b>, which yields no offers. That is deliberately the
 * safe direction: someone who should see offers and does not will say so, whereas someone who
 * should not see them and does will not.
 */
@Component("approvalAuthority")
public class ApprovalAuthority {

    private static final Logger logger = LoggerFactory.getLogger(ApprovalAuthority.class);

    /** Granted to nobody by default. Authority is assigned, never assumed. */
    public static final int NONE = 0;

    private final UserDataRepository userRepository;

    public ApprovalAuthority(UserDataRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * The caller's approval level, or {@link #NONE} when there is no user, no record, or no level
     * recorded against it.
     */
    public int levelFor(Authentication authentication) {
        String email = ActorEmail.of(authentication);
        if (email == null || email.isBlank()) {
            return NONE;
        }

        try {
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isEmpty()) {
                return NONE;
            }
            Integer level = user.get().getApprovalLevel();
            // A negative level is meaningless and would be a data error rather than a grant of
            // negative authority; it is floored rather than trusted.
            return level == null ? NONE : Math.max(NONE, level);
        } catch (Exception e) {
            // Failing closed matters more than failing loudly here: this decides what somebody is
            // shown, and an unreadable user record must not widen it.
            logger.warn("Could not read approval level for {}: {}", email, e.getMessage());
            return NONE;
        }
    }

    /** Whether the caller has any approval authority at all. */
    public boolean hasAuthority(Authentication authentication) {
        return levelFor(authentication) > NONE;
    }
}
