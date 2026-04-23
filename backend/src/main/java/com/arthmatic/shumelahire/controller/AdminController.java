package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.dto.InviteUserRequest;
import com.arthmatic.shumelahire.dto.UserAdminResponse;
import com.arthmatic.shumelahire.entity.User;
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

    @Autowired(required = false)
    private CognitoAdminService cognitoAdminService;

    public AdminController(UserDataRepository userRepository, PermissionService permissionService) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
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

        try {
            User.Role newRole = User.Role.valueOf(roleName.toUpperCase());
            User user = userOpt.get();
            user.setRole(newRole);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Role updated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleName));
        }
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
