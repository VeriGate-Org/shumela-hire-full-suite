package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Authority is read, never accepted.
 *
 * <p>The approval level used to arrive as a query parameter on {@code /api/approvals/pending},
 * where offers are filtered by it. Any of the five permitted roles could ask for
 * {@code approvalLevel=99} and be handed every offer awaiting approval — candidate, job title and
 * total compensation. These tests pin the replacement: the number comes from the user record, and
 * every path that cannot establish one yields zero.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApprovalAuthorityTest {

    @Mock private UserDataRepository userRepository;

    private ApprovalAuthority authority;

    /**
     * A signed-in caller.
     *
     * <p>The principal is a {@link User}, because that is one of the two shapes
     * {@code ActorEmail.of} resolves — a bare string principal yields no email and therefore no
     * authority, which is correct behaviour and is covered separately below.
     */
    private Authentication callerNamed(String email) {
        User principal = new User();
        principal.setEmail(email);
        return new UsernamePasswordAuthenticationToken(principal, "x");
    }

    private final Authentication caller = callerNamed("someone@example.co.za");

    @BeforeEach
    void setUp() {
        authority = new ApprovalAuthority(userRepository);
    }

    private void userWithLevel(Integer level) {
        User user = new User();
        user.setApprovalLevel(level);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
    }

    @Test
    void readsTheLevelRecordedAgainstTheUser() {
        userWithLevel(3);

        assertEquals(3, authority.levelFor(caller));
        assertTrue(authority.hasAuthority(caller));
    }

    @Test
    void aUserWithNoRecordedLevelHasNone() {
        // Null is the state every user is in until an administrator grants one. It must not be
        // read as "unrestricted" on the way to filtering offers.
        userWithLevel(null);

        assertEquals(ApprovalAuthority.NONE, authority.levelFor(caller));
        assertFalse(authority.hasAuthority(caller));
    }

    @Test
    void anUnknownUserHasNone() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertEquals(ApprovalAuthority.NONE, authority.levelFor(caller));
    }

    @Test
    void anAnonymousCallerHasNone() {
        assertEquals(ApprovalAuthority.NONE, authority.levelFor(null));
    }

    @Test
    void aPrincipalWithNoResolvableEmailHasNone() {
        // ActorEmail resolves a JWT or a User principal and nothing else. Anything it cannot read
        // must yield no authority rather than falling through to a lookup on a null email.
        userWithLevel(9);

        assertEquals(ApprovalAuthority.NONE,
                authority.levelFor(new UsernamePasswordAuthenticationToken("a-bare-string", "x")));
    }

    @Test
    void anUnreadableUserRecordFailsClosed() {
        // This decides what somebody is shown. A repository that throws must narrow what is
        // returned, never widen it.
        when(userRepository.findByEmail(anyString())).thenThrow(new RuntimeException("dynamo down"));

        assertEquals(ApprovalAuthority.NONE, authority.levelFor(caller));
    }

    @Test
    void aNegativeStoredLevelIsFlooredRatherThanTrusted() {
        // A negative level is a data error, not a grant of negative authority.
        userWithLevel(-5);

        assertEquals(ApprovalAuthority.NONE, authority.levelFor(caller));
    }
}
