package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.JobPostingRepository;
import com.arthmatic.shumelahire.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/executive")
@PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE')")
public class ExecutiveController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    // --- Budget endpoints ---

    @GetMapping("/budget")
    public ResponseEntity<Map<String, Object>> getBudget() {
        // Return budget data derived from real entity counts
        long totalJobs = jobPostingRepository.count();
        long totalApps = applicationRepository.count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("budgetItems", List.of());
        result.put("summary", Map.of(
            "totalAllocated", 0,
            "totalSpent", 0,
            "totalRemaining", 0,
            "openPositions", totalJobs,
            "totalApplications", totalApps
        ));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/budget/analytics")
    public ResponseEntity<Map<String, Object>> getBudgetAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("monthlySpend", List.of());
        analytics.put("departmentBreakdown", List.of());
        analytics.put("forecastedSpend", 0);
        return ResponseEntity.ok(analytics);
    }

    // --- Leadership endpoints ---

    @GetMapping("/leadership/team")
    public ResponseEntity<List<Map<String, Object>>> getLeadershipTeam() {
        // Return users with leadership-level roles
        var leaders = userRepository.findAll().stream()
                .filter(u -> {
                    var role = u.getRole();
                    return role == com.arthmatic.shumelahire.entity.User.Role.ADMIN
                            || role == com.arthmatic.shumelahire.entity.User.Role.EXECUTIVE
                            || role == com.arthmatic.shumelahire.entity.User.Role.HR_MANAGER
                            || role == com.arthmatic.shumelahire.entity.User.Role.HIRING_MANAGER;
                })
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", String.valueOf(u.getId()));
                    m.put("name", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                    m.put("title", u.getJobTitle() != null ? u.getJobTitle() : u.getRole().getDisplayName());
                    m.put("department", u.getDepartment() != null ? u.getDepartment() : "");
                    m.put("email", u.getEmail());
                    m.put("phone", u.getPhone());
                    m.put("location", u.getLocation() != null ? u.getLocation() : "");
                    m.put("joinDate", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
                    m.put("role", u.getRole().name());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(leaders);
    }

    @GetMapping("/leadership/metrics")
    public ResponseEntity<Map<String, Object>> getLeadershipMetrics() {
        long totalUsers = userRepository.count();
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalTeamSize", totalUsers);
        metrics.put("openPositions", jobPostingRepository.count());
        metrics.put("avgTenure", 0);
        metrics.put("turnoverRate", 0);
        return ResponseEntity.ok(metrics);
    }

    // --- Planning endpoints ---

    @GetMapping("/planning/goals")
    public ResponseEntity<List<Map<String, Object>>> getStrategicGoals() {
        // Returns empty list — goals will be created via POST
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/planning/goals")
    public ResponseEntity<Map<String, Object>> createGoal(@RequestBody Map<String, Object> goal) {
        goal.put("id", "goal-" + System.currentTimeMillis());
        goal.put("createdAt", new Date().toString());
        return ResponseEntity.ok(goal);
    }

    @GetMapping("/planning/capacity")
    public ResponseEntity<Map<String, Object>> getCapacity() {
        long totalUsers = userRepository.count();
        long openPositions = jobPostingRepository.count();

        Map<String, Object> capacity = new LinkedHashMap<>();
        capacity.put("currentHeadcount", totalUsers);
        capacity.put("openPositions", openPositions);
        capacity.put("plannedHires", 0);
        capacity.put("attritionRate", 0);
        return ResponseEntity.ok(capacity);
    }
}
