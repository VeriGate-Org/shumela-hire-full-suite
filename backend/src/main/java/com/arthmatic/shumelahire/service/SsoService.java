package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import com.arthmatic.shumelahire.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@ConditionalOnProperty(name = "sso.enabled", havingValue = "true")
public class SsoService {

    private static final Logger logger = LoggerFactory.getLogger(SsoService.class);

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Value("${sso.default-role:EMPLOYEE}")
    private String defaultRole;

    @Value("${sso.auto-provision-users:true}")
    private boolean autoProvisionUsers;

    @Autowired
    public SsoService(UserRepository userRepository, JwtUtil jwtUtil,
                      PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public User getOrCreateUserFromSsoProfile(String email, String name, String ssoProvider, String ssoUserId) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update SSO fields if not set
            if (user.getSsoProvider() == null) {
                user.setSsoProvider(ssoProvider);
                user.setSsoUserId(ssoUserId);
                userRepository.save(user);
            }
            logger.info("SSO login: existing user {} authenticated via {}", email, ssoProvider);
            return user;
        }

        if (!autoProvisionUsers) {
            throw new RuntimeException("User not found and auto-provisioning is disabled: " + email);
        }

        // Auto-provision new user
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setUsername(email.split("@")[0] + "-" + UUID.randomUUID().toString().substring(0, 4));
        newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        newUser.setSsoProvider(ssoProvider);
        newUser.setSsoUserId(ssoUserId);
        newUser.setEnabled(true);
        newUser.setEmailVerified(true);

        // Parse name
        if (name != null && !name.isBlank()) {
            String[] parts = name.split("\\s+", 2);
            newUser.setFirstName(parts[0]);
            if (parts.length > 1) {
                newUser.setLastName(parts[1]);
            }
        }

        try {
            User.Role role = User.Role.valueOf(defaultRole);
            newUser.setRole(role);
        } catch (IllegalArgumentException e) {
            newUser.setRole(User.Role.EMPLOYEE);
        }

        User saved = userRepository.save(newUser);
        auditLogService.saveLog("SYSTEM", "SSO_AUTO_PROVISION", "USER", saved.getId().toString(),
                "Auto-provisioned user " + email + " via " + ssoProvider);
        logger.info("SSO auto-provisioned new user: {} via {}", email, ssoProvider);
        return saved;
    }

    public String generateSsoJwtToken(User user) {
        return jwtUtil.generateTokenFromUsername(user.getUsername());
    }
}
