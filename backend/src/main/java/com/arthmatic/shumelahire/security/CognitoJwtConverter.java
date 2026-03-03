package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Converts a Cognito JWT into a Spring Security authentication token,
 * mapping cognito:groups claim values to ROLE_* authorities.
 */
public class CognitoJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String principal = extractPrincipal(jwt);

        // Extract tenant_id from JWT custom attribute and set in TenantContext
        String tenantId = jwt.getClaimAsString("custom:tenant_id");
        if (tenantId != null && !tenantId.isBlank()) {
            // Validate against currently resolved tenant if present
            String currentTenant = TenantContext.getCurrentTenant();
            if (currentTenant != null && !currentTenant.equals(tenantId)) {
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

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        // Map cognito:groups to ROLE_* authorities
        List<String> groups = jwt.getClaimAsStringList("cognito:groups");
        if (groups != null && !groups.isEmpty()) {
            for (String group : groups) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + group.toUpperCase()));
            }
        } else {
            // Federated users (e.g. LinkedIn) have no Cognito groups — default to APPLICANT
            authorities.add(new SimpleGrantedAuthority("ROLE_APPLICANT"));
        }

        // Add default authenticated authority
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        return Collections.unmodifiableList(authorities);
    }
}
