package com.arthmatic.shumelahire.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;


@Service
@ConditionalOnProperty(name = "cognito.admin.enabled", havingValue = "true")
public class CognitoAdminService {

    private static final Logger log = LoggerFactory.getLogger(CognitoAdminService.class);

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;

    public CognitoAdminService(
            CognitoIdentityProviderClient cognitoClient,
            @Value("${cognito.admin.user-pool-id}") String userPoolId) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
    }

    /**
     * Creates a Cognito user with a temporary password (Cognito sends invite email).
     * Adds user to the specified group (creates group if needed).
     *
     * @return the Cognito user sub (unique ID)
     */
    public String createUser(String email, String firstName, String lastName, String tenantId, String groupName) {
        AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                .userPoolId(userPoolId)
                .username(email)
                .userAttributes(
                        AttributeType.builder().name("email").value(email).build(),
                        AttributeType.builder().name("email_verified").value("true").build(),
                        AttributeType.builder().name("given_name").value(firstName).build(),
                        AttributeType.builder().name("family_name").value(lastName).build(),
                        AttributeType.builder().name("name").value(firstName + " " + lastName).build(),
                        AttributeType.builder().name("custom:tenant_id").value(tenantId).build()
                )
                .desiredDeliveryMediums(DeliveryMediumType.EMAIL)
                .build();

        AdminCreateUserResponse response = cognitoClient.adminCreateUser(request);
        String cognitoSub = response.user().attributes().stream()
                .filter(a -> "sub".equals(a.name()))
                .map(AttributeType::value)
                .findFirst()
                .orElse(response.user().username());

        log.info("Created Cognito user: {} (sub: {})", email, cognitoSub);

        // Ensure group exists and add user to it
        ensureGroupExists(groupName);
        cognitoClient.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                .userPoolId(userPoolId)
                .username(email)
                .groupName(groupName)
                .build());

        log.info("Added user {} to group {}", email, groupName);

        return cognitoSub;
    }

    /**
     * Checks whether a user exists in the Cognito user pool.
     */
    public boolean userExists(String email) {
        try {
            cognitoClient.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(email)
                    .build());
            return true;
        } catch (UserNotFoundException e) {
            return false;
        }
    }

    private void ensureGroupExists(String groupName) {
        try {
            cognitoClient.getGroup(GetGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .groupName(groupName)
                    .build());
        } catch (ResourceNotFoundException e) {
            cognitoClient.createGroup(CreateGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .groupName(groupName)
                    .description("Auto-created group for role: " + groupName)
                    .build());
            log.info("Created Cognito group: {}", groupName);
        }
    }
}
