package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Returns current user information from the security context.
 * Works with both dev JWT and Cognito JWT authentication.
 */
@RestController
@RequestMapping("/api/auth")
public class UserInfoController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        Map<String, Object> userInfo = new HashMap<>();
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        userInfo.put("roles", roles);

        // If the principal is a Cognito JWT
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            userInfo.put("sub", jwt.getSubject());
            userInfo.put("email", jwt.getClaimAsString("email"));
            userInfo.put("username", jwt.getClaimAsString("cognito:username"));
            userInfo.put("name", jwt.getClaimAsString("name"));

            // Try to find the user in our database by email
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                Optional<User> user = userRepository.findByEmail(email);
                user.ifPresent(u -> populateUserInfo(userInfo, u));
            }
        }
        // If the principal is a UserDetails (dev profile)
        else if (authentication.getPrincipal() instanceof User user) {
            populateUserInfo(userInfo, user);
        } else {
            userInfo.put("principal", authentication.getName());
        }

        return ResponseEntity.ok(userInfo);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = resolveUser(authentication);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();

        if (body.containsKey("firstName")) user.setFirstName(body.get("firstName"));
        if (body.containsKey("lastName")) user.setLastName(body.get("lastName"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));
        if (body.containsKey("location")) user.setLocation(body.get("location"));
        if (body.containsKey("jobTitle")) user.setJobTitle(body.get("jobTitle"));
        if (body.containsKey("department")) user.setDepartment(body.get("department"));

        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        populateUserInfo(result, user);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication authentication, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = resolveUser(authentication);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "currentPassword and newPassword are required"));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters"));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    private void populateUserInfo(Map<String, Object> info, User user) {
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("email", user.getEmail());
        info.put("firstName", user.getFirstName());
        info.put("lastName", user.getLastName());
        info.put("role", user.getRole().name());
        info.put("phone", user.getPhone());
        info.put("location", user.getLocation());
        info.put("jobTitle", user.getJobTitle());
        info.put("department", user.getDepartment());
        info.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        info.put("lastLogin", user.getLastLogin() != null ? user.getLastLogin().toString() : null);
    }

    @GetMapping("/interviewers")
    public ResponseEntity<?> getInterviewers() {
        List<User> interviewers = userRepository.findAll().stream()
                .filter(u -> {
                    User.Role role = u.getRole();
                    return role == User.Role.INTERVIEWER
                            || role == User.Role.HR_MANAGER
                            || role == User.Role.RECRUITER
                            || role == User.Role.HIRING_MANAGER;
                })
                .toList();

        List<Map<String, Object>> result = interviewers.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
            m.put("email", u.getEmail());
            m.put("role", u.getRole().getDisplayName());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    private Optional<User> resolveUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email);
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }
}
