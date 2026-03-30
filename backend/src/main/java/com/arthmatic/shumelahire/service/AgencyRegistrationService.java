package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.AgencyRegistrationRequest;
import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.AgencyProfileDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AgencyRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(AgencyRegistrationService.class);

    private final AgencyProfileDataRepository agencyProfileRepository;
    private final UserDataRepository userRepository;
    private final Optional<CognitoAdminService> cognitoAdminService;
    private final PasswordEncoder passwordEncoder;

    public AgencyRegistrationService(AgencyProfileDataRepository agencyProfileRepository,
                                      UserDataRepository userRepository,
                                      Optional<CognitoAdminService> cognitoAdminService,
                                      PasswordEncoder passwordEncoder) {
        this.agencyProfileRepository = agencyProfileRepository;
        this.userRepository = userRepository;
        this.cognitoAdminService = cognitoAdminService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegistrationResult register(AgencyRegistrationRequest request) {
        String email = request.getContactEmail().trim().toLowerCase();
        String tenantId = TenantContext.requireCurrentTenant();

        // Check for existing agency or user with this email
        if (userRepository.existsByEmail(email)) {
            return RegistrationResult.failure("An account with this email already exists.");
        }
        if (agencyProfileRepository.findByContactEmail(email).isPresent()) {
            return RegistrationResult.failure("An agency with this contact email is already registered.");
        }

        // 1. Create Cognito user (disabled until approved) or local user
        String cognitoSub = null;
        if (cognitoAdminService.isPresent()) {
            try {
                cognitoSub = cognitoAdminService.get().createUserWithPassword(
                        email, request.getContactPerson(), "",
                        tenantId, "RECRUITER", request.getPassword());
                // Disable the user until the agency is approved
                cognitoAdminService.get().disableUser(email);
            } catch (Exception e) {
                log.error("Failed to create Cognito user for agency {}: {}", email, e.getMessage());
                return RegistrationResult.failure("Registration failed. Please try again.");
            }
        }

        // 2. Create User record (disabled until approved)
        User user = new User();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(request.getContactPerson());
        user.setLastName("");
        user.setRole(User.Role.RECRUITER);
        user.setEnabled(false); // Disabled until agency is approved
        user.setEmailVerified(true);
        user.setTenantId(tenantId);

        if (cognitoSub != null) {
            user.setSsoProvider("COGNITO");
            user.setSsoUserId(cognitoSub);
            user.setPassword("{cognito}" + UUID.randomUUID());
        } else {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);

        // 3. Create AgencyProfile with PENDING_APPROVAL status
        AgencyProfile agency = new AgencyProfile();
        agency.setAgencyName(request.getAgencyName());
        agency.setRegistrationNumber(request.getRegistrationNumber());
        agency.setContactPerson(request.getContactPerson());
        agency.setContactEmail(email);
        agency.setContactPhone(request.getContactPhone());
        agency.setSpecializations(request.getSpecializations());
        agency.setBeeLevel(request.getBeeLevel());
        agency.setStatus(AgencyStatus.PENDING_APPROVAL);
        agency.setTenantId(tenantId);

        agencyProfileRepository.save(agency);

        log.info("Agency registered: {} (contact: {}, tenant: {})", request.getAgencyName(), email, tenantId);

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
            return new RegistrationResult(true,
                    "Agency registration submitted. Your account will be activated once approved by our team.");
        }

        public static RegistrationResult failure(String message) {
            return new RegistrationResult(false, message);
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
