package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.config.tenant.TenantResolutionFilter;
import com.arthmatic.shumelahire.repository.TenantRepository;
import com.arthmatic.shumelahire.security.JwtAuthenticationFilter;
import com.arthmatic.shumelahire.security.JwtAuthenticationEntryPoint;
import com.arthmatic.shumelahire.security.RateLimitFilter;
import com.arthmatic.shumelahire.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for local development.
 * Uses custom JWT filter with locally issued tokens.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile({"dev", "test", "hybrid"})
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private Environment environment;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://*.localhost:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
            )
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
                .requestMatchers(new AntPathRequestMatcher("/ads", "GET")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/ads/*", "GET")).permitAll()

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

                // Agency endpoints — method-level @PreAuthorize handles fine-grained access
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

                // Job ad template endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/job-templates/**")).hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")

                // General authenticated endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/**")).authenticated()

                .anyRequest().denyAll()
            );

        http.addFilterBefore(new TenantResolutionFilter(tenantRepository, environment), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.authenticationProvider(authenticationProvider());

        return http.build();
    }
}
