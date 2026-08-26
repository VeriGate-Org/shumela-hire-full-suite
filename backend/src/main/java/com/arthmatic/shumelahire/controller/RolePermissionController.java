package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.RolePermissionOverride;
import com.arthmatic.shumelahire.repository.RolePermissionOverrideDataRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The tenant's role-permission deviations, readable by anyone signed in.
 *
 * <p>Separate from {@link AdminController} because that class is administrator-only, and every
 * signed-in user needs to read this. A permission an administrator revokes from Recruiter has to
 * take effect for recruiters — who are, by definition, not administrators. Behind the admin gate the
 * override would be stored, displayed, and applied to nobody, which is the decorative-control defect
 * this whole change exists to remove.
 *
 * <p>Read-only. Writing stays on the administrator route.
 *
 * <p>This is not an authorisation boundary. These ids gate the <b>interface</b> — which navigation
 * entries appear, which controls render. Server-side authorisation is separate and unchanged:
 * controllers enforce roles with {@code @PreAuthorize}, and nothing here can widen that.
 */
@RestController
@RequestMapping("/api/role-permissions")
@PreAuthorize("isAuthenticated()")
public class RolePermissionController {

    private final RolePermissionOverrideDataRepository repository;

    public RolePermissionController(RolePermissionOverrideDataRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getOverrides() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (RolePermissionOverride o : repository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("role", o.getRole());
            m.put("permissionId", o.getPermissionId());
            m.put("granted", Boolean.TRUE.equals(o.getGranted()));
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }
}
