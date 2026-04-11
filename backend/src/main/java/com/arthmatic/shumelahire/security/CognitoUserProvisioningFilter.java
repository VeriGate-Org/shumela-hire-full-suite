package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
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

    private final UserDataRepository userRepository;
    private final ApplicantDataRepository applicantRepository;

    public CognitoUserProvisioningFilter(UserDataRepository userRepository,
                                          ApplicantDataRepository applicantRepository) {
        this.userRepository = userRepository;
        this.applicantRepository = applicantRepository;
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
        String jwtTenantId = jwt.getClaimAsString("custom:tenant_id");

        if (email == null || jwtTenantId == null) return;

        // Prefer the fully-resolved tenant ID from TenantContext (e.g. "97282820-uthukela")
        // over the raw JWT claim which may only contain the subdomain (e.g. "uthukela").
        // TenantResolutionFilter runs before this filter and resolves the subdomain to the
        // full DynamoDB ID. Using the resolved ID ensures the user record's tenantId matches
        // what downstream queries (e.g. findByEmailAndTenantId) will use.
        String resolvedTenant = TenantContext.getCurrentTenant();
        String tenantId = (resolvedTenant != null && !"default".equals(resolvedTenant) && !"platform".equals(resolvedTenant))
                ? resolvedTenant
                : jwtTenantId;

        if (!userRepository.existsByEmail(email)) {
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

            User savedUser = userRepository.save(user);
            log.info("JIT provisioned user: {} (tenant: {}, role: {})", email, tenantId, role);

            // Auto-create Applicant profile for APPLICANT-role users (e.g. LinkedIn OAuth sign-up)
            if (role == User.Role.APPLICANT && !applicantRepository.existsByEmail(email)) {
                Applicant applicant = new Applicant();
                applicant.setName(user.getFirstName());
                applicant.setSurname(user.getLastName());
                applicant.setEmail(email);
                applicant.setSource("OAUTH");
                applicant.setUserId(savedUser.getId());
                applicant.setTenantId(tenantId);
                // LinkedIn URL from JWT if available
                String linkedinUrl = jwt.getClaimAsString("profile");
                if (linkedinUrl != null) {
                    applicant.setLinkedinUrl(linkedinUrl);
                }
                applicantRepository.save(applicant);
                log.info("JIT provisioned applicant profile for: {}", email);
            }
        } else {
            userRepository.findByEmail(email).ifPresent(user -> {
                user.setLastLogin(LocalDateTime.now());

                // Backfill resolved tenant ID for users provisioned with subdomain-only value
                if (user.getTenantId() != null && !user.getTenantId().equals(tenantId)
                        && tenantId.endsWith("-" + user.getTenantId())) {
                    log.info("Upgrading tenantId for {} from '{}' to '{}'",
                            email, user.getTenantId(), tenantId);
                    user.setTenantId(tenantId);
                }

                // Sync role from JWT if it provides a more authoritative role
                // than what's stored (e.g., user was JIT-provisioned as APPLICANT
                // but has since been assigned a Cognito group).
                User.Role jwtRole = extractRole(auth);
                if (jwtRole != User.Role.APPLICANT && user.getRole() != jwtRole) {
                    log.info("Syncing role for {} from {} to {} (tenant: {})",
                            email, user.getRole(), jwtRole, tenantId);
                    user.setRole(jwtRole);
                }

                userRepository.save(user);

                // Backfill Applicant profile if missing (for users created before this change)
                if (user.getRole() == User.Role.APPLICANT && !applicantRepository.existsByEmail(email)) {
                    Applicant applicant = new Applicant();
                    applicant.setName(user.getFirstName());
                    applicant.setSurname(user.getLastName());
                    applicant.setEmail(email);
                    applicant.setSource("BACKFILL");
                    applicant.setUserId(user.getId());
                    applicant.setTenantId(tenantId);
                    applicantRepository.save(applicant);
                    log.info("Backfilled applicant profile for existing user: {}", email);
                }
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
