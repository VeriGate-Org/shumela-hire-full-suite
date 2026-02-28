package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.config.tenant.TenantResolutionFilter;
import com.arthmatic.shumelahire.repository.TenantRepository;
import com.arthmatic.shumelahire.security.CognitoJwtConverter;
import com.arthmatic.shumelahire.security.RateLimitFilter;
import org.springframework.beans.factory.annotation.Autowired;
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
    private TenantRepository tenantRepository;

    @Autowired
    private Environment environment;

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
                    "https://*.sbx.shumelahire.co.za"
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
                // Public endpoints
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Actuator
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/audit/**").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/users/manage/**").hasAnyRole("ADMIN", "HR_MANAGER")

                // Executive endpoints
                .requestMatchers("/api/executive/**").hasAnyRole("ADMIN", "EXECUTIVE")

                // HR Manager endpoints
                .requestMatchers("/api/requisitions/approve/**").hasAnyRole("ADMIN", "HR_MANAGER", "HIRING_MANAGER")
                .requestMatchers("/api/job-postings/publish/**").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "EXECUTIVE")

                // Interview endpoints
                .requestMatchers("/api/interviews/assigned/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER")
                .requestMatchers("/api/interviews/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER")

                // Application management endpoints
                .requestMatchers("/api/applications/manage/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")
                .requestMatchers("/api/applications/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "APPLICANT")
                .requestMatchers("/api/applicants/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER")

                // Internal jobs
                .requestMatchers("/api/internal/jobs/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "EMPLOYEE", "EXECUTIVE")

                // E-Signature endpoints
                .requestMatchers("/api/esignature/webhook").permitAll()
                .requestMatchers("/api/esignature/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Integration endpoints
                .requestMatchers("/api/integrations/ms-teams/webhook").permitAll()
                .requestMatchers("/api/integrations/**").hasAnyRole("ADMIN", "HR_MANAGER")

                // Agency endpoints
                .requestMatchers("/api/agencies/register").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/agencies/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // AI endpoints
                .requestMatchers("/api/ai/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER")

                // LinkedIn Social endpoints
                .requestMatchers("/api/linkedin/social/auth/callback").permitAll()
                .requestMatchers("/api/linkedin/social/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Job board endpoints
                .requestMatchers("/api/job-boards/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Salary recommendation endpoints
                .requestMatchers("/api/salary-recommendations/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Vacancy report endpoints
                .requestMatchers("/api/vacancy-reports/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Shortlisting endpoints
                .requestMatchers("/api/shortlisting/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Talent pool endpoints
                .requestMatchers("/api/talent-pools/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // Compliance endpoints
                .requestMatchers("/api/compliance/**").hasAnyRole("ADMIN", "HR_MANAGER", "EXECUTIVE")

                // General authenticated endpoints
                .requestMatchers("/api/**").authenticated()

                .anyRequest().denyAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(new CognitoJwtConverter())
                )
            );

        http.addFilterBefore(new TenantResolutionFilter(tenantRepository, environment), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
