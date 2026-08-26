package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.PermissionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * An administrator must not be able to lock administration out of the tenant.
 *
 * <p>{@code PUT /api/admin/users/{id}/role} set any user's role with no guard at all, which made two
 * unrecoverable states reachable from a dropdown. Both end the same way — nobody left who can
 * appoint an administrator, and no route back except a support ticket and a database edit:
 *
 * <ul>
 *   <li>an administrator demoting <b>themselves</b>, losing the page they are standing on;</li>
 *   <li>demoting the <b>last</b> administrator, which does the same to the whole tenant.</li>
 * </ul>
 *
 * <p>Asserted against the endpoint rather than the UI on purpose. Hiding the option in a dropdown
 * leaves the endpoint reachable, and the lockout is identical whether it was reached by a control
 * or by curl.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminRoleLockoutTest {

    @Mock
    private UserDataRepository userRepository;

    private final PermissionService permissionService = new PermissionService();

    private AdminController controller() {
        return new AdminController(userRepository, permissionService);
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    private static User user(String id, String email, User.Role role) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    /** Signs in as this email for the duration of the test. */
    private static void signedInAs(String email) {
        User principal = user("caller", email, User.Role.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "n/a", List.of()));
    }

    @Test
    @DisplayName("an administrator cannot remove their own administrator role")
    void refusesSelfDemotion() {
        User self = user("u1", "admin@example.co.za", User.Role.ADMIN);
        User other = user("u2", "second@example.co.za", User.Role.ADMIN);
        when(userRepository.findById("u1")).thenReturn(Optional.of(self));
        // Two administrators exist, so this can only be refused for being self-inflicted.
        when(userRepository.findAll()).thenReturn(List.of(self, other));
        signedInAs("admin@example.co.za");

        ResponseEntity<?> response = controller().updateUserRole("u1", Map.of("role", "RECRUITER"));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("the last administrator cannot be demoted, even by another administrator")
    void refusesDemotingTheLastAdministrator() {
        User onlyAdmin = user("u1", "admin@example.co.za", User.Role.ADMIN);
        when(userRepository.findById("u1")).thenReturn(Optional.of(onlyAdmin));
        when(userRepository.findAll()).thenReturn(List.of(onlyAdmin, user("u9", "staff@example.co.za", User.Role.RECRUITER)));
        signedInAs("someone.else@example.co.za");

        ResponseEntity<?> response = controller().updateUserRole("u1", Map.of("role", "HR_MANAGER"));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("an administrator may be demoted while another one remains")
    void allowsDemotionWhenAnotherAdministratorRemains() {
        User target = user("u1", "admin@example.co.za", User.Role.ADMIN);
        User other = user("u2", "second@example.co.za", User.Role.ADMIN);
        when(userRepository.findById("u1")).thenReturn(Optional.of(target));
        when(userRepository.findAll()).thenReturn(List.of(target, other));
        signedInAs("second@example.co.za");

        ResponseEntity<?> response = controller().updateUserRole("u1", Map.of("role", "RECRUITER"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(User.Role.RECRUITER, target.getRole());
        verify(userRepository).save(target);
    }

    @Test
    @DisplayName("a platform owner counts as an administrator, so the last ADMIN may still be demoted")
    void platformOwnerCountsTowardsTheAdministratorFloor() {
        // The floor is "who can appoint an administrator", not "who holds the ADMIN role" — the
        // permission map decides, so a role granted admin_roles later is counted without anyone
        // remembering to update a second list.
        User target = user("u1", "admin@example.co.za", User.Role.ADMIN);
        User owner = user("u2", "owner@example.co.za", User.Role.PLATFORM_OWNER);
        when(userRepository.findById("u1")).thenReturn(Optional.of(target));
        when(userRepository.findAll()).thenReturn(List.of(target, owner));
        signedInAs("owner@example.co.za");

        ResponseEntity<?> response = controller().updateUserRole("u1", Map.of("role", "RECRUITER"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("promoting somebody is never blocked")
    void allowsPromotion() {
        User target = user("u1", "staff@example.co.za", User.Role.RECRUITER);
        when(userRepository.findById("u1")).thenReturn(Optional.of(target));
        when(userRepository.findAll()).thenReturn(List.of(target));
        signedInAs("admin@example.co.za");

        ResponseEntity<?> response = controller().updateUserRole("u1", Map.of("role", "ADMIN"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(User.Role.ADMIN, target.getRole());
    }

    @Test
    @DisplayName("the refusal says what to do about it")
    void refusalExplainsItself() {
        User self = user("u1", "admin@example.co.za", User.Role.ADMIN);
        when(userRepository.findById("u1")).thenReturn(Optional.of(self));
        when(userRepository.findAll()).thenReturn(List.of(self, user("u2", "second@example.co.za", User.Role.ADMIN)));
        signedInAs("admin@example.co.za");

        ResponseEntity<?> response = controller().updateUserRole("u1", Map.of("role", "RECRUITER"));

        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        String error = ((Map<String, String>) response.getBody()).get("error");
        assertNotNull(error, "a refusal with an empty body reads as a bug, not a rule");
        assertEquals(true, error.contains("another administrator"),
                "the message must name the way out, not merely say no");
    }
}
