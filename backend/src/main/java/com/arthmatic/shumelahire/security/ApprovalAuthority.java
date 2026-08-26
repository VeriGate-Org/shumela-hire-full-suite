package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Map;
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
 * <p><b>An unset level falls back to the role's default; an explicit one always wins.</b> Nobody
 * had a level, so no offer ever reached the approval queue — the mechanism was correct and inert.
 * The defaults below match what the code already calls the two levels: {@code OfferService} sets
 * {@code approvalLevelRequired} to 1 for "manager approval" and 2 for "senior management", above a
 * configured threshold.
 *
 * <p>An earlier version of this note said authority is never derived from a role, on the grounds
 * that a role says what somebody does rather than what they may commit the organisation to. That
 * still holds for the <em>grant</em> — which is why an explicit level, including zero, overrides
 * the default and is never quietly widened by a role change. The default only decides what happens
 * before an administrator has said anything.
 *
 * <p>An unknown user, an unreadable record or an unresolvable principal is still <b>zero</b>. That
 * is the safe direction: someone who should see offers and does not will say so, whereas someone
 * who should not see them and does will not.
 */
@Component("approvalAuthority")
public class ApprovalAuthority {

    private static final Logger logger = LoggerFactory.getLogger(ApprovalAuthority.class);

    /** No authority. An explicit zero means the same and is never overridden by a role default. */
    public static final int NONE = 0;

    /**
     * What each role may approve before an administrator says otherwise.
     *
     * <p>Roles absent from this map default to {@link #NONE}: a recruiter or hiring manager raises
     * offers and salary reviews, and does not approve them.
     */
    private static final Map<User.Role, Integer> ROLE_DEFAULTS = Map.of(
            User.Role.ADMIN, 2,
            User.Role.EXECUTIVE, 2,
            User.Role.HR_MANAGER, 1);

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
            if (level == null) {
                // Nothing granted yet, so the role decides. An administrator setting a level —
                // including zero — replaces this permanently.
                return ROLE_DEFAULTS.getOrDefault(user.get().getRole(), NONE);
            }
            // A negative level is meaningless and would be a data error rather than a grant of
            // negative authority; it is floored rather than trusted.
            return Math.max(NONE, level);
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
