package com.arthmatic.shumelahire.config.tenant;

import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;

public class TenantResolutionFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(TenantResolutionFilter.class);

    private static final Set<String> EXEMPT_PREFIXES = Set.of(
            "/actuator/health",
            "/swagger-ui",
            "/v3/api-docs",
            "/api/public/",
            "/api/ads"
    );

    /** Environment subdomains that are NOT tenant subdomains */
    private static final Set<String> ENVIRONMENT_SUBDOMAINS = Set.of(
            "dev", "ppe", "staging", "qa", "sandbox", "sbx"
    );

    private final TenantDataRepository tenantRepository;
    private final Environment environment;

    public TenantResolutionFilter(TenantDataRepository tenantRepository, Environment environment) {
        this.tenantRepository = tenantRepository;
        this.environment = environment;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        try {
            String path = httpRequest.getRequestURI();

            // Skip tenant resolution for exempt paths
            if (isExemptPath(path)) {
                chain.doFilter(request, response);
                return;
            }

            String tenantId = resolveTenant(httpRequest);

            if (tenantId == null) {
                httpResponse.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Unable to resolve tenant\"}");
                return;
            }

            TenantContext.setCurrentTenant(tenantId);
            chain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }

    private String resolveTenant(HttpServletRequest request) {
        // 1. Try subdomain resolution from Host header
        String host = request.getHeader("Host");
        if (host != null) {
            String subdomain = extractSubdomain(host);
            if (subdomain != null) {
                // Reserved "platform" subdomain — no DB lookup needed
                if ("platform".equals(subdomain)) {
                    return "platform";
                }
                Tenant tenant = tenantRepository.findBySubdomain(subdomain).orElse(null);
                if (tenant != null && tenant.isActive()) {
                    return tenant.getId();
                }
            }
        }

        // 2. Fallback: X-Tenant-Id header
        String headerTenantId = request.getHeader("X-Tenant-Id");
        if (headerTenantId != null && !headerTenantId.isBlank()) {
            // Reserved "platform" tenant — no DB lookup needed
            if ("platform".equals(headerTenantId)) {
                return "platform";
            }
            // Use findTenantById (context-free) — existsById requires TenantContext
            // which hasn't been set yet at this point in the filter chain.
            Optional<Tenant> tenant = tenantRepository.findTenantById(headerTenantId)
                    .filter(Tenant::isActive);
            if (tenant.isPresent()) {
                return tenant.get().getId();
            }
            // Fallback: X-Tenant-Id may be a subdomain rather than the generated ID
            tenant = tenantRepository.findBySubdomain(headerTenantId)
                    .filter(Tenant::isActive);
            if (tenant.isPresent()) {
                return tenant.get().getId();
            }
        }

        // 3. Dev profile fallback: default tenant
        if (isDevProfile()) {
            return "default";
        }

        // 4. Environment base URL fallback (e.g. dev.shumelahire.co.za, ppe.shumelahire.co.za)
        //    These are environment URLs with no tenant subdomain — use default tenant.
        if (host != null && isEnvironmentBaseUrl(host)) {
            logger.debug("Environment base URL detected ({}), using default tenant", host);
            return "default";
        }

        return null;
    }

    private boolean isEnvironmentBaseUrl(String host) {
        String hostname = host.contains(":") ? host.substring(0, host.indexOf(':')) : host;
        String[] parts = hostname.split("\\.");
        return parts.length >= 4 && ENVIRONMENT_SUBDOMAINS.contains(parts[0]);
    }

    private String extractSubdomain(String host) {
        // Remove port if present
        String hostname = host.contains(":") ? host.substring(0, host.indexOf(':')) : host;

        // Skip localhost and IP addresses
        if ("localhost".equals(hostname) || hostname.matches("\\d+\\.\\d+\\.\\d+\\.\\d+")) {
            return null;
        }

        // Extract subdomain from patterns like acme.shumelahire.co.za or acme.sbx.shumelahire.co.za
        String[] parts = hostname.split("\\.");
        if (parts.length >= 4) {
            String candidate = parts[0];
            // Environment prefixes (dev, ppe, staging, etc.) are not tenant subdomains
            if (ENVIRONMENT_SUBDOMAINS.contains(candidate)) {
                return null;
            }
            // e.g., acme.shumelahire.co.za or acme.sbx.shumelahire.co.za
            return candidate;
        }

        return null;
    }

    private boolean isExemptPath(String path) {
        for (String prefix : EXEMPT_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private boolean isDevProfile() {
        return Arrays.asList(environment.getActiveProfiles()).contains("dev");
    }
}
