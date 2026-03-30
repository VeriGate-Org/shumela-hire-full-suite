package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.ApplicantRegistrationRequest;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class ApplicantRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicantRegistrationService.class);

    private final UserDataRepository userRepository;
    private final ApplicantDataRepository applicantRepository;
    private final Optional<CognitoAdminService> cognitoAdminService;
    private final PasswordEncoder passwordEncoder;

    public ApplicantRegistrationService(UserDataRepository userRepository,
                                         ApplicantDataRepository applicantRepository,
                                         Optional<CognitoAdminService> cognitoAdminService,
                                         PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.applicantRepository = applicantRepository;
        this.cognitoAdminService = cognitoAdminService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegistrationResult register(ApplicantRegistrationRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String tenantId = TenantContext.requireCurrentTenant();

        // Check for existing accounts
        if (userRepository.existsByEmail(email)) {
            return RegistrationResult.failure("An account with this email already exists. Please sign in instead.");
        }
        if (applicantRepository.existsByEmail(email)) {
            return RegistrationResult.failure("An account with this email already exists. Please sign in instead.");
        }

        // Check Cognito if available
        if (cognitoAdminService.isPresent() && cognitoAdminService.get().userExists(email)) {
            return RegistrationResult.failure("An account with this email already exists. Please sign in instead.");
        }

        // 1. Create Cognito user with permanent password (prod) or skip (dev)
        String cognitoSub = null;
        if (cognitoAdminService.isPresent()) {
            try {
                cognitoSub = cognitoAdminService.get().createUserWithPassword(
                        email, request.getFirstName(), request.getLastName(),
                        tenantId, "APPLICANT", request.getPassword());
            } catch (Exception e) {
                log.error("Failed to create Cognito user for {}: {}", email, e.getMessage());
                return RegistrationResult.failure("Registration failed. Please try again.");
            }
        }

        // 2. Create User record
        User user = new User();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(User.Role.APPLICANT);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setTenantId(tenantId);

        if (cognitoSub != null) {
            user.setSsoProvider("COGNITO");
            user.setSsoUserId(cognitoSub);
            user.setPassword("{cognito}" + UUID.randomUUID());
        } else {
            // Dev mode — store password locally
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User savedUser = userRepository.save(user);

        // 3. Create Applicant record linked to User
        Applicant applicant = new Applicant();
        applicant.setName(request.getFirstName());
        applicant.setSurname(request.getLastName());
        applicant.setEmail(email);
        applicant.setPhone(request.getPhone());
        applicant.setSource("SELF_REGISTRATION");
        applicant.setUserId(savedUser.getId());
        applicant.setTenantId(tenantId);

        applicantRepository.save(applicant);

        log.info("Applicant registered: {} (userId: {}, cognitoSub: {}, tenant: {})",
                email, savedUser.getId(), cognitoSub, tenantId);

        return RegistrationResult.success();
    }

    public static class RegistrationResult {
        private final boolean success;
        private final String message;

        private RegistrationResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public static RegistrationResult success() {
            return new RegistrationResult(true, "Registration successful. You can now sign in.");
        }

        public static RegistrationResult failure(String message) {
            return new RegistrationResult(false, message);
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
