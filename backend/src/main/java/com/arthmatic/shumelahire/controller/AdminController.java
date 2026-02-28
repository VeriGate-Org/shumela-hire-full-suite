package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.UserAdminResponse;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import com.arthmatic.shumelahire.service.PermissionService;
import com.arthmatic.shumelahire.service.PermissionService.PermissionDefinition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PermissionService permissionService;

    public AdminController(UserRepository userRepository, PermissionService permissionService) {
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
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<UserAdminResponse> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.findBySearchTerm(search.trim(), pageRequest)
                    .map(UserAdminResponse::fromEntity);
        } else {
            users = userRepository.findAll(pageRequest)
                    .map(UserAdminResponse::fromEntity);
        }
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
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

}
