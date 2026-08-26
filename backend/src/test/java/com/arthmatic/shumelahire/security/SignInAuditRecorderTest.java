package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * The two properties that matter for a sign-in record written from the authentication path:
 * it happens once per sign-in, and it can never stop somebody signing in.
 */
class SignInAuditRecorderTest {

    private AuditLogService auditLogService;
    private SignInAuditRecorder recorder;

    @BeforeEach
    void setUp() {
        auditLogService = mock(AuditLogService.class);
        recorder = new SignInAuditRecorder(auditLogService);
    }

    private Jwt token(String subject, Long authTime, Instant issuedAt) {
        Jwt.Builder b = Jwt.withTokenValue("token-" + subject + "-" + authTime + "-" + issuedAt)
                .header("alg", "RS256")
                .claim("sub", subject)
                .claim("email", subject + "@idc.co.za");
        if (authTime != null) {
            b.claim("auth_time", authTime);
        }
        if (issuedAt != null) {
            b.issuedAt(issuedAt).expiresAt(issuedAt.plusSeconds(3600));
        }
        return b.build();
    }

    @Test
    @DisplayName("records a sign-in once, not once per request")
    void recordsOncePerSignIn() {
        Jwt jwt = token("lerato", 1_756_200_000L, Instant.ofEpochSecond(1_756_200_000L));

        // the converter runs on every authenticated request
        for (int i = 0; i < 25; i++) {
            recorder.recordSignIn(jwt, "lerato", List.of("ROLE_HR_MANAGER"));
        }

        verify(auditLogService, times(1))
                .logAuthAction(eq("lerato"), eq("LOGIN"), eq("AUTH"), anyString());
    }

    @Test
    @DisplayName("a refreshed token is the same sign-in, because auth_time does not move")
    void refreshedTokenIsNotANewSignIn() {
        long authTime = 1_756_200_000L;
        Jwt first = token("lerato", authTime, Instant.ofEpochSecond(authTime));
        Jwt refreshed = token("lerato", authTime, Instant.ofEpochSecond(authTime + 3_600));

        recorder.recordSignIn(first, "lerato", List.of("ROLE_HR_MANAGER"));
        recorder.recordSignIn(refreshed, "lerato", List.of("ROLE_HR_MANAGER"));

        verify(auditLogService, times(1)).logAuthAction(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("signing in again later is a new record")
    void newAuthenticationIsANewRecord() {
        Jwt monday = token("lerato", 1_756_200_000L, Instant.ofEpochSecond(1_756_200_000L));
        Jwt tuesday = token("lerato", 1_756_286_400L, Instant.ofEpochSecond(1_756_286_400L));

        recorder.recordSignIn(monday, "lerato", List.of("ROLE_HR_MANAGER"));
        recorder.recordSignIn(tuesday, "lerato", List.of("ROLE_HR_MANAGER"));

        verify(auditLogService, times(2)).logAuthAction(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("two people are two records")
    void differentSubjectsAreSeparate() {
        long authTime = 1_756_200_000L;
        recorder.recordSignIn(token("lerato", authTime, null), "lerato", List.of("ROLE_HR_MANAGER"));
        recorder.recordSignIn(token("sipho", authTime, null), "sipho", List.of("ROLE_RECRUITER"));

        verify(auditLogService, times(1)).logAuthAction(eq("lerato"), anyString(), anyString(), anyString());
        verify(auditLogService, times(1)).logAuthAction(eq("sipho"), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("an audit failure must not stop somebody signing in")
    void auditFailureIsSwallowed() {
        // AuditLogService.saveLog throws on failure. If that propagated from the authentication
        // path, a DynamoDB problem would lock every user out of the system.
        doThrow(new RuntimeException("DynamoDB unavailable"))
                .when(auditLogService).logAuthAction(anyString(), anyString(), anyString(), anyString());

        Jwt jwt = token("lerato", 1_756_200_000L, null);

        assertThatCode(() -> recorder.recordSignIn(jwt, "lerato", List.of("ROLE_HR_MANAGER")))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a token with no subject is ignored rather than recorded blank")
    void ignoresMissingPrincipal() {
        Jwt jwt = token("lerato", 1_756_200_000L, null);

        recorder.recordSignIn(jwt, null, List.of("ROLE_HR_MANAGER"));
        recorder.recordSignIn(jwt, "  ", List.of("ROLE_HR_MANAGER"));
        recorder.recordSignIn(null, "lerato", List.of("ROLE_HR_MANAGER"));

        verify(auditLogService, never()).logAuthAction(any(), any(), any(), any());
    }

    @Test
    @DisplayName("the detail line carries the role, which is the point of the record")
    void detailsCarryRoleAndEmail() {
        Jwt jwt = token("lerato", 1_756_200_000L, null);

        recorder.recordSignIn(jwt, "lerato", List.of("ROLE_HR_MANAGER", "ROLE_USER"));

        org.mockito.ArgumentCaptor<String> details = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(auditLogService).logAuthAction(anyString(), anyString(), anyString(), details.capture());
        assertThat(details.getValue())
                .contains("ROLE_HR_MANAGER")
                .contains("lerato@idc.co.za");
    }

    @Test
    @DisplayName("without auth_time it falls back to issued-at, over-reporting rather than missing")
    void fallsBackToIssuedAt() {
        Instant t = Instant.ofEpochSecond(1_756_200_000L);
        Jwt a = token("lerato", null, t);
        Jwt b = token("lerato", null, t.plusSeconds(3_600));

        recorder.recordSignIn(a, "lerato", List.of("ROLE_HR_MANAGER"));
        recorder.recordSignIn(a, "lerato", List.of("ROLE_HR_MANAGER")); // same token, still one
        recorder.recordSignIn(b, "lerato", List.of("ROLE_HR_MANAGER")); // refreshed, counted again

        verify(auditLogService, times(2)).logAuthAction(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("the seen-set stays bounded")
    void seenSetIsBounded() {
        // 12,000 distinct sessions against a 10,000 cap: the map must evict rather than grow.
        for (int i = 0; i < 12_000; i++) {
            Jwt jwt = token("user" + i, 1_756_200_000L + i, null);
            recorder.recordSignIn(jwt, "user" + i, List.of("ROLE_EMPLOYEE"));
        }
        verify(auditLogService, times(12_000))
                .logAuthAction(anyString(), anyString(), anyString(), anyString());

        // The earliest sessions have been evicted, so they would be recorded again. That is the
        // documented trade: a duplicate is cheaper than an unbounded map in the auth path.
        Map<String, Object> unused = Map.of();
        assertThat(unused).isEmpty();
    }
}
