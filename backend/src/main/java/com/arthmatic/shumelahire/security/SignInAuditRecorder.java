package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Records that somebody signed in, once per sign-in, in the audit log.
 *
 * <p><b>Why this exists.</b> {@code AuditLogService.logAuthAction} was written for this and had no
 * callers anywhere in the codebase. The IDC tenant's audit log contains fifty distinct action types
 * and not one of them is an authentication event, so the question "who signed in, and when" could
 * not be answered for any date. For a government client that is a question asked during an audit.
 *
 * <p><b>Why not the login endpoint.</b> {@code AuthController} does call
 * {@code AuthenticationService.logAuthenticationEvent} on success and failure — but that method only
 * writes {@code logger.info("AUTH_EVENT …")} and persists nothing, and more importantly
 * {@code SecurityConfig}, which serves that endpoint, is {@code @Profile({"dev","test"})}. Cloud and
 * production run {@code CognitoSecurityConfig}, where sign-in happens at Cognito and the application
 * never sees a login request. Wiring the controller would have recorded developer logins and no
 * customer's.
 *
 * <p><b>What counts as one sign-in.</b> The converter runs on every authenticated request, so the
 * event has to be deduplicated or the audit log would gain an entry per API call. The key is the
 * subject plus the {@code auth_time} claim — the moment the user actually authenticated, which
 * Cognito holds constant across token refreshes. A refreshed token is therefore the same sign-in,
 * which is what an auditor means by the word.
 *
 * <p><b>This must never break authentication.</b> {@code AuditLogService.saveLog} throws on failure,
 * and a DynamoDB hiccup locking every user out of the system would be a far worse outcome than a
 * missing audit row. Every path here is wrapped and swallowed.
 *
 * <p><b>Known limit.</b> The seen-set is per instance and in memory, so a container recycling or
 * several instances serving the same person can produce more than one row for one sign-in. For an
 * audit trail a duplicate is much cheaper than a miss, and the alternative — a conditional write per
 * request — puts a database call in the authentication path of every API call. Deduplicating across
 * instances belongs with whoever owns retention, not here.
 */
@Component
public class SignInAuditRecorder {

    private static final Logger logger = LoggerFactory.getLogger(SignInAuditRecorder.class);

    /** Bounded so a long-lived instance cannot grow this without limit. */
    private static final int MAX_TRACKED_SESSIONS = 10_000;

    static final String ACTION = "LOGIN";
    static final String ENTITY_TYPE = "AUTH";

    private final AuditLogService auditLogService;

    private final Map<String, Boolean> recentSessions = Collections.synchronizedMap(
            new LinkedHashMap<>(256, 0.75f, false) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                    return size() > MAX_TRACKED_SESSIONS;
                }
            });

    public SignInAuditRecorder(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Write a sign-in record if this token represents a session not already seen.
     *
     * @param jwt       the verified token
     * @param principal the resolved user identifier, as the rest of the audit log spells it
     * @param roles     authorities resolved for this token, for the record's detail line
     */
    public void recordSignIn(Jwt jwt, String principal, java.util.Collection<String> roles) {
        try {
            if (jwt == null || principal == null || principal.isBlank()) {
                return;
            }

            String sessionKey = sessionKey(jwt, principal);
            if (recentSessions.putIfAbsent(sessionKey, Boolean.TRUE) != null) {
                return; // already recorded this sign-in
            }

            auditLogService.logAuthAction(principal, ACTION, ENTITY_TYPE, details(jwt, roles));
        } catch (Exception e) {
            // Deliberately swallowed. See the class comment: authentication must not depend on the
            // audit log being writable.
            logger.warn("Could not record sign-in for [{}]: {}", principal, e.toString());
        }
    }

    /**
     * One key per authentication event.
     *
     * <p>{@code auth_time} is when the person actually signed in and survives token refreshes.
     * Where it is absent, {@code iat} is used instead — that makes each refreshed token look like a
     * new sign-in, which over-reports rather than under-reports.
     */
    private String sessionKey(Jwt jwt, String principal) {
        Object authTime = jwt.getClaims().get("auth_time");
        if (authTime != null) {
            return principal + "|auth:" + authTime;
        }
        Instant issuedAt = jwt.getIssuedAt();
        if (issuedAt != null) {
            return principal + "|iat:" + issuedAt.getEpochSecond();
        }
        return principal + "|tok:" + jwt.getTokenValue().hashCode();
    }

    private String details(Jwt jwt, java.util.Collection<String> roles) {
        StringBuilder sb = new StringBuilder("Signed in via Cognito");
        if (roles != null && !roles.isEmpty()) {
            sb.append(" · roles=").append(String.join(",", roles));
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            sb.append(" · ").append(email);
        }
        Object authTime = jwt.getClaims().get("auth_time");
        if (authTime != null) {
            sb.append(" · authenticated at ").append(authTime);
        }
        return sb.toString();
    }
}
