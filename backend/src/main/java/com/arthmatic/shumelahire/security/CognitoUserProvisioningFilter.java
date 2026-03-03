package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class CognitoUserProvisioningFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CognitoUserProvisioningFilter.class);

    private final UserRepository userRepository;

    public CognitoUserProvisioningFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Jwt jwt) {
            try {
                provisionUserIfNeeded(jwt, auth);
            } catch (Exception e) {
                log.warn("JIT user provisioning failed for {}: {}", jwt.getClaimAsString("email"), e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }

    @Transactional
    protected void provisionUserIfNeeded(Jwt jwt, Authentication auth) {
        String email = jwt.getClaimAsString("email");
        String tenantId = jwt.getClaimAsString("custom:tenant_id");

        if (email == null || tenantId == null) return;

        if (!userRepository.existsByEmailAndTenantId(email, tenantId)) {
            User user = new User();
            user.setEmail(email);
            user.setUsername(email);
            user.setFirstName(jwt.getClaimAsString("given_name") != null ? jwt.getClaimAsString("given_name") : "");
            user.setLastName(jwt.getClaimAsString("family_name") != null ? jwt.getClaimAsString("family_name") : "");
            user.setTenantId(tenantId);
            user.setSsoProvider("COGNITO");
            user.setSsoUserId(jwt.getSubject());
            user.setEnabled(true);
            user.setLastLogin(LocalDateTime.now());
            // SSO users don't use local password — set a non-blank placeholder
            user.setPassword("{cognito}" + UUID.randomUUID());

            User.Role role = extractRole(auth);
            user.setRole(role);

            userRepository.save(user);
            log.info("JIT provisioned user: {} (tenant: {}, role: {})", email, tenantId, role);
        } else {
            userRepository.findByEmailAndTenantId(email, tenantId).ifPresent(user -> {
                user.setLastLogin(LocalDateTime.now());
                userRepository.save(user);
            });
        }
    }

    private User.Role extractRole(Authentication auth) {
        String roleName = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_") && !a.equals("ROLE_USER"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("APPLICANT");

        try {
            return User.Role.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            return User.Role.EMPLOYEE;
        }
    }
}
