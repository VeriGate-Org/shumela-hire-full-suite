package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/permissions")
    public ResponseEntity<List<Map<String, Object>>> getPermissions() {
        List<Map<String, Object>> permissions = List.of(
            perm("dash_view", "View Dashboard", "View analytics dashboards", "dashboard", "read"),
            perm("dash_export", "Export Dashboard", "Export dashboard data", "dashboard", "write"),
            perm("recruit_view", "View Recruitment", "View job postings and pipeline", "recruitment", "read"),
            perm("recruit_manage", "Manage Recruitment", "Create and edit job postings", "recruitment", "write"),
            perm("app_view", "View Applications", "View candidate applications", "applications", "read"),
            perm("app_manage", "Manage Applications", "Update application statuses", "applications", "write"),
            perm("cand_view", "View Candidates", "View candidate profiles", "candidates", "read"),
            perm("cand_manage", "Manage Candidates", "Edit candidate profiles", "candidates", "write"),
            perm("int_view", "View Interviews", "View interview schedules", "interviews", "read"),
            perm("int_manage", "Manage Interviews", "Schedule and manage interviews", "interviews", "write"),
            perm("integ_view", "View Integrations", "View connected integrations", "integrations", "read"),
            perm("integ_manage", "Manage Integrations", "Configure integrations", "integrations", "admin"),
            perm("train_view", "View Training", "View training modules", "training", "read"),
            perm("train_manage", "Manage Training", "Create training content", "training", "write"),
            perm("admin_users", "Manage Users", "Manage user accounts", "admin", "admin"),
            perm("admin_roles", "Manage Roles", "Manage roles and permissions", "admin", "admin"),
            perm("admin_settings", "System Settings", "Configure system settings", "admin", "admin")
        );
        return ResponseEntity.ok(permissions);
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
            r.put("color", roleColor(role));
            r.put("userCount", roleCounts.getOrDefault(role, 0L));
            r.put("permissions", permissionsForRole(role));
            r.put("isSystem", true);
            r.put("createdAt", "2024-01-01T00:00:00");
            r.put("lastModified", "2024-01-01T00:00:00");
            roles.add(r);
        }
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", String.valueOf(u.getId()));
            m.put("name", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
            m.put("email", u.getEmail());
            m.put("roleId", u.getRole().name().toLowerCase());
            m.put("status", u.isEnabled() ? "active" : "inactive");
            m.put("lastLogin", u.getLastLogin() != null ? u.getLastLogin().toString() : null);
            m.put("department", u.getDepartment() != null ? u.getDepartment() : "");
            return m;
        }).toList();
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

    private Map<String, Object> perm(String id, String name, String description, String category, String level) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("description", description);
        m.put("category", category);
        m.put("level", level);
        return m;
    }

    private String roleColor(User.Role role) {
        return switch (role) {
            case ADMIN -> "red";
            case EXECUTIVE -> "purple";
            case HR_MANAGER -> "blue";
            case HIRING_MANAGER -> "green";
            case RECRUITER -> "yellow";
            default -> "gray";
        };
    }

    private List<String> permissionsForRole(User.Role role) {
        return switch (role) {
            case ADMIN -> List.of("dash_view", "dash_export", "recruit_view", "recruit_manage", "app_view", "app_manage",
                    "cand_view", "cand_manage", "int_view", "int_manage", "integ_view", "integ_manage",
                    "train_view", "train_manage", "admin_users", "admin_roles", "admin_settings");
            case EXECUTIVE -> List.of("dash_view", "dash_export", "recruit_view", "app_view", "cand_view", "int_view");
            case HR_MANAGER -> List.of("dash_view", "dash_export", "recruit_view", "recruit_manage", "app_view", "app_manage",
                    "cand_view", "cand_manage", "int_view", "int_manage", "train_view", "train_manage");
            case HIRING_MANAGER -> List.of("dash_view", "recruit_view", "recruit_manage", "app_view", "app_manage",
                    "cand_view", "int_view", "int_manage");
            case RECRUITER -> List.of("dash_view", "recruit_view", "recruit_manage", "app_view", "app_manage",
                    "cand_view", "cand_manage", "int_view", "int_manage");
            case INTERVIEWER -> List.of("int_view", "int_manage", "cand_view");
            case EMPLOYEE -> List.of("dash_view");
            case APPLICANT -> List.of();
        };
    }
}
