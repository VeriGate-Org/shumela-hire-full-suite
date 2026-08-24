package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Who is taking this action.
 *
 * <p>Every audited mutation needs to name a person, and the answer is the authenticated principal —
 * not the subject of the record. {@code ApplicationService} was recording
 * {@code application.getApplicant().getId()} against status changes, so the audit trail stated that
 * each candidate screened, rated and rejected themselves.
 *
 * <p>Extracted rather than copied: the same resolution already existed verbatim in
 * {@code RequisitionController} and {@code UserPreferenceController}, and applications would have
 * made a third. {@code CvUploadController} keeps its own variant because it falls back to the
 * applicant table for candidate-authenticated uploads, which is a different question from this one.
 */
@Component
public class ActorResolver {

    private final UserDataRepository userRepository;

    public ActorResolver(UserDataRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * The acting user's id.
     *
     * <p>Empty when there is no authentication or the principal cannot be matched to a user —
     * callers record "SYSTEM" or null rather than attributing the action to whoever happens to be
     * named on the record.
     */
    public Optional<String> userId(Authentication authentication) {
        if (authentication == null) {
            return Optional.empty();
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email).map(User::getId);
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return Optional.of(user.getId());
        }
        return Optional.empty();
    }

    /** The acting user's display name, or null — for audit detail lines that read as prose. */
    public String userName(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String name = jwt.getClaimAsString("name");
            return name != null ? name : jwt.getClaimAsString("email");
        }
        if (authentication.getPrincipal() instanceof User user) {
            String first = user.getFirstName();
            String last = user.getLastName();
            if (first != null || last != null) {
                return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
            }
            return user.getEmail();
        }
        return authentication.getName();
    }

    /** The id to write into an audit row: the acting user, or SYSTEM when there is not one. */
    public String actingUserId(Authentication authentication) {
        return userId(authentication).orElse("SYSTEM");
    }
}
