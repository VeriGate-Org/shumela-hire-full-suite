package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PermissionService {

    public record PermissionDefinition(String id, String name, String description, String category, String level) {}

    private static final List<PermissionDefinition> ALL_PERMISSIONS = List.of(
        new PermissionDefinition("dash_view", "View Dashboard", "View analytics dashboards", "dashboard", "read"),
        new PermissionDefinition("dash_export", "Export Dashboard", "Export dashboard data", "dashboard", "write"),
        new PermissionDefinition("recruit_view", "View Recruitment", "View job postings and pipeline", "recruitment", "read"),
        new PermissionDefinition("recruit_manage", "Manage Recruitment", "Create and edit job postings", "recruitment", "write"),
        new PermissionDefinition("app_view", "View Applications", "View candidate applications", "applications", "read"),
        new PermissionDefinition("app_manage", "Manage Applications", "Update application statuses", "applications", "write"),
        new PermissionDefinition("cand_view", "View Candidates", "View candidate profiles", "candidates", "read"),
        new PermissionDefinition("cand_manage", "Manage Candidates", "Edit candidate profiles", "candidates", "write"),
        new PermissionDefinition("int_view", "View Interviews", "View interview schedules", "interviews", "read"),
        new PermissionDefinition("int_manage", "Manage Interviews", "Schedule and manage interviews", "interviews", "write"),
        new PermissionDefinition("integ_view", "View Integrations", "View connected integrations", "integrations", "read"),
        new PermissionDefinition("integ_manage", "Manage Integrations", "Configure integrations", "integrations", "admin"),
        new PermissionDefinition("train_view", "View Training", "View training modules", "training", "read"),
        new PermissionDefinition("train_manage", "Manage Training", "Create training content", "training", "write"),
        new PermissionDefinition("admin_users", "Manage Users", "Manage user accounts", "admin", "admin"),
        new PermissionDefinition("admin_roles", "Manage Roles", "Manage roles and permissions", "admin", "admin"),
        new PermissionDefinition("admin_settings", "System Settings", "Configure system settings", "admin", "admin")
    );

    private static final Map<User.Role, List<String>> ROLE_PERMISSIONS = Map.of(
        User.Role.ADMIN, List.of("dash_view", "dash_export", "recruit_view", "recruit_manage", "app_view", "app_manage",
                "cand_view", "cand_manage", "int_view", "int_manage", "integ_view", "integ_manage",
                "train_view", "train_manage", "admin_users", "admin_roles", "admin_settings"),
        User.Role.EXECUTIVE, List.of("dash_view", "dash_export", "recruit_view", "app_view", "cand_view", "int_view"),
        User.Role.HR_MANAGER, List.of("dash_view", "dash_export", "recruit_view", "recruit_manage", "app_view", "app_manage",
                "cand_view", "cand_manage", "int_view", "int_manage", "train_view", "train_manage"),
        User.Role.HIRING_MANAGER, List.of("dash_view", "recruit_view", "recruit_manage", "app_view", "app_manage",
                "cand_view", "int_view", "int_manage"),
        User.Role.RECRUITER, List.of("dash_view", "recruit_view", "recruit_manage", "app_view", "app_manage",
                "cand_view", "cand_manage", "int_view", "int_manage"),
        User.Role.INTERVIEWER, List.of("int_view", "int_manage", "cand_view"),
        User.Role.EMPLOYEE, List.of("dash_view", "train_view"),
        User.Role.APPLICANT, List.of()
    );

    private static final Map<User.Role, String> ROLE_COLORS = Map.of(
        User.Role.ADMIN, "red",
        User.Role.EXECUTIVE, "purple",
        User.Role.HR_MANAGER, "blue",
        User.Role.HIRING_MANAGER, "green",
        User.Role.RECRUITER, "yellow",
        User.Role.INTERVIEWER, "gray",
        User.Role.EMPLOYEE, "gray",
        User.Role.APPLICANT, "gray"
    );

    public List<PermissionDefinition> getAllPermissions() {
        return ALL_PERMISSIONS;
    }

    public List<String> getPermissionsForRole(User.Role role) {
        return ROLE_PERMISSIONS.getOrDefault(role, List.of());
    }

    public String getRoleColor(User.Role role) {
        return ROLE_COLORS.getOrDefault(role, "gray");
    }

    public boolean roleHasPermission(User.Role role, String permissionId) {
        return getPermissionsForRole(role).contains(permissionId);
    }
}
