package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.dto.InviteUserRequest;
import com.arthmatic.shumelahire.dto.UserAdminResponse;
import com.arthmatic.shumelahire.entity.RolePermissionOverride;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.RolePermissionOverrideDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.CognitoAdminService;
import com.arthmatic.shumelahire.service.PermissionService;
import com.arthmatic.shumelahire.service.PermissionService.PermissionDefinition;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final UserDataRepository userRepository;
    private final PermissionService permissionService;
    private final RolePermissionOverrideDataRepository rolePermissionRepository;

    @Autowired(required = false)
    private CognitoAdminService cognitoAdminService;

    public AdminController(UserDataRepository userRepository,
                           PermissionService permissionService,
                           RolePermissionOverrideDataRepository rolePermissionRepository) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionDefinition>> getPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> getRoles() {
        Map<User.Role, Long> roleCounts = userRepository.findAll().stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));

        List<Map<String, Object>> roles = new ArrayList<>();
        for (User.Role role : User.Role.values()) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", role.name().toLowerCase());
            r.put("name", role.getDisplayName());
            r.put("description", role.getDisplayName() + " role");
            r.put("color", permissionService.getRoleColor(role));
            r.put("userCount", roleCounts.getOrDefault(role, 0L));
            r.put("permissions", permissionService.getPermissionsForRole(role));
            r.put("isSystem", true);
            r.put("createdAt", "2024-01-01T00:00:00");
            r.put("lastModified", "2024-01-01T00:00:00");
            roles.add(r);
        }
        return ResponseEntity.ok(roles);
    }

    /**
     * Every deliberate deviation from the built-in role permissions, for this tenant.
     *
     * <p>Deviations only. The defaults are the interface's own — {@code src/config/permissions.ts},
     * the list the navigation and every gate already read — and are not restated here. Copying
     * forty-five permission ids into Java is exactly the duplication that produced the defect this
     * replaces: the product carried two unrelated permission vocabularies, one that enforced and one
     * that was merely displayed, so the matrix an administrator edited governed nothing.
     */
    @GetMapping("/role-permissions")
    public ResponseEntity<List<Map<String, Object>>> getRolePermissionOverrides() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (RolePermissionOverride o : rolePermissionRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("role", o.getRole());
            m.put("permissionId", o.getPermissionId());
            m.put("granted", Boolean.TRUE.equals(o.getGranted()));
            m.put("updatedAt", o.getUpdatedAt());
            m.put("updatedBy", o.getUpdatedBy());
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /**
     * Grants or revokes one permission for one role.
     *
     * <p>Refuses to revoke a permission that administration cannot be recovered without. Removing
     * {@code manage_permissions} from the administrator role hides this page from the only people
     * who can restore it, which is the same lockout the self-demotion guard exists to prevent — and
     * equally unrecoverable from inside the product.
     */
    @PutMapping("/role-permissions")
    public ResponseEntity<?> setRolePermission(@RequestBody Map<String, Object> body) {
        String roleName = body.get("role") instanceof String r ? r : null;
        String permissionId = body.get("permissionId") instanceof String p ? p : null;
        Object grantedRaw = body.get("granted");
        if (roleName == null || permissionId == null || !(grantedRaw instanceof Boolean granted)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "role, permissionId and granted are required"));
        }

        User.Role role;
        try {
            role = User.Role.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleName));
        }

        if (!granted && PermissionService.isLockedFor(role, permissionId)) {
            log.warn("Refused revocation of locked permission {} from {}", permissionId, role);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "\u201c" + permissionId + "\u201d cannot be removed from "
                            + role.getDisplayName() + " \u2014 nobody would be able to restore it."));
        }

        RolePermissionOverride override = rolePermissionRepository
                .findByRoleAndPermission(role.name(), permissionId)
                .orElseGet(RolePermissionOverride::new);
        override.setRole(role.name());
        override.setPermissionId(permissionId);
        override.setGranted(granted);
        override.setUpdatedAt(java.time.LocalDateTime.now());
        override.setUpdatedBy(extractAuthenticatedEmail(authentication()));
        rolePermissionRepository.save(override);

        return ResponseEntity.ok(Map.of("role", role.name(), "permissionId", permissionId, "granted", granted));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String search) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort));

        List<User> users;
        if (search != null && !search.isBlank()) {
            CursorPage<User> result = userRepository.findBySearchTerm(search.trim(), null, size);
            users = result.content();
        } else {
            users = userRepository.findAll();
        }

        List<UserAdminResponse> allResponses = users.stream()
            .map(UserAdminResponse::fromEntity)
            .toList();

        int start = Math.min(page * size, allResponses.size());
        int end = Math.min(start + size, allResponses.size());
        List<UserAdminResponse> pageContent = allResponses.subList(start, end);

        Page<UserAdminResponse> pageResult = new PageImpl<>(pageContent, pageRequest, allResponses.size());
        return ResponseEntity.ok(pageResult);
    }

    /**
     * Changes a user's role — except where doing so would lock administration out of the tenant.
     *
     * <p>Two refusals, both irreversible from inside the product and neither previously guarded:
     *
     * <ul>
     *   <li><b>Self-demotion.</b> An administrator removing their own administrative role loses the
     *       page they are standing on, along with any way back to it. There is no "are you sure"
     *       that makes this recoverable, so it is refused rather than confirmed.</li>
     *   <li><b>The last administrator.</b> Demoting the only remaining administrator leaves the
     *       tenant with nobody who can appoint one. That is a support ticket and a database edit,
     *       which is not a thing a UI should be able to cause.</li>
     * </ul>
     *
     * <p>Enforced here rather than by hiding a control. A disabled checkbox is a suggestion — the
     * endpoint is reachable directly, and the lockout is the same either way.
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String userId, @RequestBody Map<String, String> body) {
        String roleName = body.get("role");
        if (roleName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "role is required"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User.Role newRole;
        try {
            newRole = User.Role.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleName));
        }

        User user = userOpt.get();
        User.Role currentRole = user.getRole();

        // Only a demotion out of administration can lock anyone out. Promotions, and moves between
        // two non-administrative roles, are none of this method's business.
        if (permissionService.canAdministerRoles(currentRole) && !permissionService.canAdministerRoles(newRole)) {
            String callerEmail = extractAuthenticatedEmail(authentication());
            if (callerEmail != null && callerEmail.equalsIgnoreCase(user.getEmail())) {
                log.warn("Refused self-demotion of administrator {}", userId);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "You cannot remove your own administrator role. Ask another administrator to do it."));
            }

            if (countAdministrators() <= 1) {
                log.warn("Refused demotion of the last administrator {}", userId);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "This is the only administrator. Appoint another one before changing this role."));
            }
        }

        user.setRole(newRole);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Role updated"));
    }

    /** How many users can still administer roles. Counts every administrative role, not just ADMIN. */
    private long countAdministrators() {
        return userRepository.findAll().stream()
                .map(User::getRole)
                .filter(permissionService::canAdministerRoles)
                .count();
    }

    private String extractAuthenticatedEmail(Authentication authentication) {
        if (authentication == null) return null;
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("email");
        }
        if (authentication.getPrincipal() instanceof User principal) {
            return principal.getEmail();
        }
        return null;
    }

    private Authentication authentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /**
     * Grant or revoke how much a user may approve.
     * PUT /admin/users/{userId}/approval-level  {"approvalLevel": 2}
     *
     * <p>Offers are filtered by this: a user may approve an offer whose required level is at or
     * below theirs. It is set here rather than derived from the role, because a role says what
     * somebody does and not what they may commit the organisation to.
     *
     * <p>Send null to revoke. Zero and null both mean no offers; null records that none was ever
     * granted, which is the state every user is in until an administrator acts.
     */
    @PutMapping("/users/{userId}/approval-level")
    public ResponseEntity<?> updateApprovalLevel(@PathVariable String userId,
                                                 @RequestBody Map<String, Integer> body) {
        Integer level = body.get("approvalLevel");
        if (level != null && level < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "approvalLevel cannot be negative"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        user.setApprovalLevel(level);
        userRepository.save(user);
        // Worth a line in the log: this widens or narrows what somebody may authorise, and the
        // change is otherwise invisible until it shows up as offers appearing on their queue.
        log.info("Approval level for user {} set to {}", userId, level);
        return ResponseEntity.ok(Map.of("message", "Approval level updated"));
    }

    @PostMapping("/users/invite")
    public ResponseEntity<?> inviteUser(@Valid @RequestBody InviteUserRequest request) {
        if (cognitoAdminService == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "User invitation is not available in this environment"));
        }

        // Validate role
        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + request.getRole()));
        }

        String email = request.getEmail().trim().toLowerCase();
        String tenantId = TenantContext.requireCurrentTenant();

        // Check local DB uniqueness
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A user with this email already exists"));
        }

        // Check Cognito uniqueness
        if (cognitoAdminService.userExists(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A user with this email already exists in the authentication provider"));
        }

        try {
            // Create user in Cognito (sends invite email with temporary password)
            String cognitoSub = cognitoAdminService.createUser(
                    email, request.getFirstName(), request.getLastName(), tenantId, role.name());

            // Create local user record (same pattern as JIT provisioning)
            User user = new User();
            user.setEmail(email);
            user.setUsername(email);
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setRole(role);
            user.setTenantId(tenantId);
            user.setSsoProvider("COGNITO");
            user.setSsoUserId(cognitoSub);
            user.setEnabled(true);
            user.setPassword("{cognito}" + UUID.randomUUID());
            if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
            if (request.getJobTitle() != null) user.setJobTitle(request.getJobTitle());

            userRepository.save(user);

            log.info("Invited user: {} (role: {}, tenant: {})", email, role, tenantId);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Invitation sent to " + email));
        } catch (Exception e) {
            log.error("Failed to invite user {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send invitation. Please try again."));
        }
    }

}
