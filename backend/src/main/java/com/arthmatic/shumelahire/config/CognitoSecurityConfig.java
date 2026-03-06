package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.config.tenant.TenantResolutionFilter;
import com.arthmatic.shumelahire.repository.TenantRepository;
import com.arthmatic.shumelahire.security.CognitoJwtConverter;
import com.arthmatic.shumelahire.security.CognitoUserProvisioningFilter;
import com.arthmatic.shumelahire.security.RateLimitFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for deployed environments (sbx, ppe, prod).
 * Uses Spring Security OAuth2 Resource Server with Cognito JWT validation.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile({"sbx", "ppe", "prod"})
public class CognitoSecurityConfig {

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Autowired
    private CognitoUserProvisioningFilter cognitoUserProvisioningFilter;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private Environment environment;

    @Autowired
    private CognitoJwtConverter cognitoJwtConverter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(getAllowedOrigins());
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> getAllowedOrigins() {
        List<String> activeProfiles = Arrays.asList(environment.getActiveProfiles());

        if (activeProfiles.contains("prod")) {
            return Arrays.asList(
                    "https://shumelahire.co.za",
                    "https://www.shumelahire.co.za",
                    "https://*.shumelahire.co.za"
            );
        } else if (activeProfiles.contains("ppe")) {
            return Arrays.asList(
                    "https://ppe.shumelahire.co.za",
                    "https://*.ppe.shumelahire.co.za"
            );
        } else {
            return Arrays.asList(
                    "https://sbx.shumelahire.co.za",
                    "https://*.sbx.shumelahire.co.za",
                    "https://idc-demo.shumelahire.co.za"
            );
        }
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(authz -> authz
                // Error endpoint (forwarded by servlet container on unhandled exceptions)
                .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()

                // Public endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/auth/me")).authenticated()
                .requestMatchers(new AntPathRequestMatcher("/api/auth/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/public/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/health")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/swagger-ui/**"), new AntPathRequestMatcher("/v3/api-docs/**")).permitAll()

                // Public job ads (careers portal)
                .requestMatchers(new AntPathRequestMatcher("/api/ads", "GET")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/ads/*", "GET")).permitAll()

                // Actuator
                .requestMatchers(new AntPathRequestMatcher("/actuator/health")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/actuator/**")).hasRole("ADMIN")

                // Platform admin endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/platform/**")).hasRole("PLATFORM_OWNER")

                // Admin endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/admin/**")).hasRole("ADMIN")
                .requestMatchers(new AntPathRequestMatcher("/api/audit/**")).hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers(new AntPathRequestMatcher("/api/users/manage/**")).hasAnyRole("ADMIN", "HR_MANAGER")

                // Executive endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/executive/**")).hasAnyRole("ADMIN", "EXECUTIVE")

                // Requisition endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/requisitions/*/approve")).hasAnyRole("ADMIN", "HR_MANAGER", "EXECUTIVE")
                .requestMatchers(new AntPathRequestMatcher("/api/requisitions/*/reject")).hasAnyRole("ADMIN", "HR_MANAGER", "EXECUTIVE")
                .requestMatchers(new AntPathRequestMatcher("/api/requisitions/**")).hasAnyRole("ADMIN", "HR_MANAGER", "HIRING_MANAGER", "EXECUTIVE")

                // HR Manager endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/job-postings/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER")
                .requestMatchers(new AntPathRequestMatcher("/api/analytics/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "EXECUTIVE")

                // Interview endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/interviews/assigned/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER")
                .requestMatchers(new AntPathRequestMatcher("/api/interviews/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER")

                // Application management endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/applications/manage/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")
                .requestMatchers(new AntPathRequestMatcher("/api/applications/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "APPLICANT")
                .requestMatchers(new AntPathRequestMatcher("/api/applicants/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "APPLICANT")

                // Internal jobs
                .requestMatchers(new AntPathRequestMatcher("/api/internal/jobs/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "EMPLOYEE", "EXECUTIVE")

                // E-Signature endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/esignature/webhook")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/esignature/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Integration endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/integrations/ms-teams/webhook")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/integrations/**")).hasAnyRole("ADMIN", "HR_MANAGER")

                // Offer endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/offers/**")).hasAnyRole("ADMIN", "HR_MANAGER", "APPLICANT")

                // Agency endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/agencies/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // AI endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/ai/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER")

                // LinkedIn Social endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/linkedin/social/auth/callback")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/linkedin/social/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Job board endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/job-boards/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Salary recommendation endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/salary-recommendations/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Vacancy report endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/vacancy-reports/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Shortlisting endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/shortlisting/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Talent pool endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/talent-pools/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER")

                // Compliance endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/compliance/**")).hasAnyRole("ADMIN", "HR_MANAGER", "EXECUTIVE")

                // General authenticated endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/**")).authenticated()

                .anyRequest().denyAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(cognitoJwtConverter)
                )
            );

        http.addFilterBefore(new TenantResolutionFilter(tenantRepository, environment), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(cognitoUserProvisioningFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Prevent CognitoUserProvisioningFilter from being auto-registered as a servlet filter
     * by Spring Boot. It is already registered in the Spring Security filter chain via
     * addFilterAfter() above. Double-registration causes a NullPointerException during
     * Tomcat filter init because the servlet container tries to init it before Spring
     * has fully wired GenericFilterBean's logger.
     */
    @Bean
    public FilterRegistrationBean<CognitoUserProvisioningFilter> disableCognitoFilterAutoRegistration(
            CognitoUserProvisioningFilter filter) {
        FilterRegistrationBean<CognitoUserProvisioningFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    /**
     * Prevent RateLimitFilter from being auto-registered as a servlet filter.
     * Same reason as above — it is already in the Spring Security filter chain
     * via addFilterBefore(). Auto-registration as a servlet filter causes it to
     * run before the security chain, and OncePerRequestFilter then skips it
     * inside the security chain, changing the intended filter execution order.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> disableRateLimitFilterAutoRegistration(
            RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
