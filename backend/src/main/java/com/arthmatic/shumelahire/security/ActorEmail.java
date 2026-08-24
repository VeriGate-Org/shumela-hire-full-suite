package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The email on the current principal, whatever shape it arrives in.
 *
 * <p>A JWT carries it as a claim; a form login carries a {@link User}. Both appear in this codebase
 * and the same three-line unwrap was already written out in several controllers.
 */
public final class ActorEmail {

    private ActorEmail() {
    }

    public static String of(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("email");
        }
        if (authentication.getPrincipal() instanceof User user) {
            return user.getEmail();
        }
        return null;
    }
}
