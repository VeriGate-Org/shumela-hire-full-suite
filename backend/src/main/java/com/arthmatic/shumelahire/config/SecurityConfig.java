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
                // Public endpoints
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Actuator
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")

                // Platform admin endpoints
                .requestMatchers("/api/platform/**").hasRole("PLATFORM_OWNER")

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/audit/**").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/users/manage/**").hasAnyRole("ADMIN", "HR_MANAGER")

                // Executive endpoints
                .requestMatchers("/api/executive/**").hasAnyRole("ADMIN", "EXECUTIVE")

                // HR Manager endpoints
                .requestMatchers("/api/requisitions/approve/**").hasAnyRole("ADMIN", "HR_MANAGER", "HIRING_MANAGER")
                .requestMatchers("/api/job-postings/**").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER", "HIRING_MANAGER")
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

                // Offer endpoints
                .requestMatchers("/api/offers/**").hasAnyRole("ADMIN", "HR_MANAGER")

                // Agency endpoints
                .requestMatchers("/api/agencies/register").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/agencies/*/approve").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/agencies/*/suspend").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/api/agencies/*/submissions").hasAnyRole("ADMIN", "HR_MANAGER", "RECRUITER")
                .requestMatchers("/api/agencies/submissions/*/review").hasAnyRole("ADMIN", "HR_MANAGER")
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
            );

        http.addFilterBefore(new TenantResolutionFilter(tenantRepository, environment), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.authenticationProvider(authenticationProvider());

        return http.build();
    }
}
