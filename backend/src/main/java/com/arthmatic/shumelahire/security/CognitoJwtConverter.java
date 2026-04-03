package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Converts a Cognito JWT into a Spring Security authentication token,
 * mapping cognito:groups claim values to ROLE_* authorities.
 */
@Component
public class CognitoJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final Logger logger = LoggerFactory.getLogger(CognitoJwtConverter.class);

    private static final Set<String> KNOWN_ROLES = Set.of(
            "PLATFORM_OWNER",
            "ADMIN",
            "EXECUTIVE",
            "HR_MANAGER",
            "LINE_MANAGER",
            "HIRING_MANAGER",
            "RECRUITER",
            "INTERVIEWER",
            "EMPLOYEE",
            "APPLICANT",
            "TA_MANAGER"
    );

    private final UserDataRepository userRepository;

    public CognitoJwtConverter(UserDataRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String principal = extractPrincipal(jwt);

        // Extract tenant_id from JWT custom attribute and set in TenantContext
        String tenantId = jwt.getClaimAsString("custom:tenant_id");
        if (tenantId != null && !tenantId.isBlank()) {
            String currentTenant = TenantContext.getCurrentTenant();
            if (currentTenant != null && !"default".equals(currentTenant)
                    && !"platform".equals(currentTenant) && !currentTenant.equals(tenantId)) {
                // Only reject if the resolved tenant is a real tenant (not dev fallback or platform admin)
                throw new SecurityException("JWT tenant_id does not match resolved tenant");
            }
            TenantContext.setCurrentTenant(tenantId);
        }

        return new JwtAuthenticationToken(jwt, authorities, principal);
    }

    private String extractPrincipal(Jwt jwt) {
        // Cognito puts the username in the "cognito:username" claim or "sub"
        String username = jwt.getClaimAsString("cognito:username");
        if (username != null) {
            return username;
        }
        username = jwt.getClaimAsString("username");
        if (username != null) {
            return username;
        }
        return jwt.getSubject();
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        String principal = extractPrincipal(jwt);
        LinkedHashSet<String> roleAuthorities = new LinkedHashSet<>();
        String resolvedVia = "DEFAULT";

        // Map cognito:groups to ROLE_* authorities
        List<String> groups = extractGroups(jwt);
        for (String group : groups) {
            normalizeRole(group).ifPresent(role -> roleAuthorities.add("ROLE_" + role));
        }
        if (!roleAuthorities.isEmpty()) {
            resolvedVia = "cognito:groups=" + groups;
        }

        // Fallback to explicit role claims when groups are absent.
        if (roleAuthorities.isEmpty()) {
            extractExplicitRole(jwt).ifPresent(role -> {
                roleAuthorities.add("ROLE_" + role);
            });
            if (!roleAuthorities.isEmpty()) {
                resolvedVia = "explicit-claim";
            }
        }

        // Final fallback to role persisted in our tenant user record.
        if (roleAuthorities.isEmpty()) {
            resolveRoleFromDatabase(jwt).ifPresent(role -> {
                roleAuthorities.add("ROLE_" + role);
            });
            if (!roleAuthorities.isEmpty()) {
                resolvedVia = "database";
            }
        }

        if (roleAuthorities.isEmpty()) {
            // Federated users without resolved role default to APPLICANT.
            roleAuthorities.add("ROLE_APPLICANT");
        }

        logger.info("Role resolution for [{}]: via={}, authorities={}", principal, resolvedVia, roleAuthorities);

        List<GrantedAuthority> authorities = new ArrayList<>();
        roleAuthorities.forEach(role -> authorities.add(new SimpleGrantedAuthority(role)));

        // Add default authenticated authority
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        return Collections.unmodifiableList(authorities);
    }

    @SuppressWarnings("unchecked")
    private List<String> extractGroups(Jwt jwt) {
        Object rawGroups = jwt.getClaims().get("cognito:groups");
        if (rawGroups instanceof List<?> groups) {
            List<String> values = new ArrayList<>();
            for (Object group : groups) {
                if (group != null) {
                    values.add(String.valueOf(group));
                }
            }
            return values;
        }
        if (rawGroups instanceof String groupString && !groupString.isBlank()) {
            return List.of(groupString.split(","));
        }
        List<String> groups = jwt.getClaimAsStringList("cognito:groups");
        return groups != null ? groups : List.of();
    }

    private Optional<String> extractExplicitRole(Jwt jwt) {
        String customRole = jwt.getClaimAsString("custom:role");
        if (customRole != null && !customRole.isBlank()) {
            return normalizeRole(customRole);
        }
        String role = jwt.getClaimAsString("role");
        if (role != null && !role.isBlank()) {
            return normalizeRole(role);
        }
        return Optional.empty();
    }

    private Optional<String> resolveRoleFromDatabase(Jwt jwt) {
        String tenantId = resolveTenantId(jwt);
        if (tenantId == null || tenantId.isBlank()) {
            return Optional.empty();
        }

        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            Optional<String> role = userRepository.findByEmail(email)
                    .map(User::getRole)
                    .map(Enum::name);
            if (role.isPresent()) {
                return role;
            }
        }

        for (String username : extractUsernames(jwt)) {
            if (username == null || username.isBlank()) {
                continue;
            }
            Optional<String> role = userRepository.findByUsername(username)
                    .map(User::getRole)
                    .map(Enum::name);
            if (role.isPresent()) {
                return role;
            }
        }

        return Optional.empty();
    }

    private String resolveTenantId(Jwt jwt) {
        String tenantId = jwt.getClaimAsString("custom:tenant_id");
        if (tenantId != null && !tenantId.isBlank()) {
            return tenantId;
        }
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant != null && !currentTenant.isBlank()) {
            return currentTenant;
        }
        return null;
    }

    private List<String> extractUsernames(Jwt jwt) {
        List<String> usernames = new ArrayList<>();

        String cognitoUsername = jwt.getClaimAsString("cognito:username");
        if (cognitoUsername != null && !cognitoUsername.isBlank()) {
            usernames.add(cognitoUsername);
        }

        String username = jwt.getClaimAsString("username");
        if (username != null && !username.isBlank()) {
            usernames.add(username);
        }

        String preferredUsername = jwt.getClaimAsString("preferred_username");
        if (preferredUsername != null && !preferredUsername.isBlank()) {
            usernames.add(preferredUsername);
        }

        if (usernames.isEmpty()) {
            String subject = jwt.getSubject();
            if (subject != null && !subject.isBlank()) {
                usernames.add(subject);
            }
        }

        return usernames;
    }

    private Optional<String> normalizeRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return Optional.empty();
        }

        String normalized = rawRole.trim()
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');

        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }

        if (!KNOWN_ROLES.contains(normalized)) {
            logger.debug("Ignoring unknown role claim value: {}", rawRole);
            return Optional.empty();
        }

        return Optional.of(normalized);
    }
}
