package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.UserItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoUserRepository extends DynamoRepository<UserItem, User>
        implements UserDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoUserRepository(DynamoDbClient dynamoDbClient,
                                 DynamoDbEnhancedClient enhancedClient,
                                 String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, UserItem.class);
    }

    @Override
    protected String entityType() {
        return "USER";
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return findByGsiUnique("GSI4", "USER_USERNAME#" + username);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return findByGsiUnique("GSI5", "USER_EMAIL#" + email);
    }

    @Override
    public List<User> findByRole(User.Role role) {
        return queryGsiAll("GSI1", "USER_ROLE#" + role.name());
    }

    @Override
    public List<User> findLockedUsers() {
        String now = LocalDateTime.now().format(ISO_FMT);
        return findAll().stream()
                .filter(u -> !u.isAccountNonLocked() &&
                        u.getLockedUntil() != null &&
                        u.getLockedUntil().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end) {
        String gsi6pk = "USER_CREATED#" + currentTenantId();
        String skStart = "USER#" + start.format(ISO_FMT);
        String skEnd = "USER#" + end.format(ISO_FMT);
        return queryGsiRange("GSI6", gsi6pk, skStart, skEnd, null, 1000).content();
    }

    @Override
    public List<User> findInactiveUsers(LocalDateTime cutoff) {
        return findAll().stream()
                .filter(u -> u.getLastLogin() == null ||
                        u.getLastLogin().isBefore(cutoff))
                .collect(Collectors.toList());
    }

    @Override
    public long countByRole(User.Role role) {
        return findByRole(role).size();
    }

    @Override
    public CursorPage<User> findBySearchTerm(String search, String cursor, int pageSize) {
        if (search == null || search.isBlank()) {
            return findAllPaginated(cursor, pageSize);
        }

        String lowerSearch = search.toLowerCase();
        List<User> all = findAll().stream()
                .filter(u -> matches(u, lowerSearch))
                .collect(Collectors.toList());

        int offset = 0;
        if (cursor != null && !cursor.isBlank()) {
            try { offset = Integer.parseInt(cursor); } catch (NumberFormatException ignored) {}
        }
        int end = Math.min(offset + pageSize, all.size());
        List<User> page = all.subList(offset, end);
        boolean hasMore = end < all.size();
        String nextCursor = hasMore ? String.valueOf(end) : null;

        return new CursorPage<>(page, nextCursor, hasMore, page.size(), (long) all.size());
    }

    private boolean matches(User u, String lowerSearch) {
        return (u.getUsername() != null && u.getUsername().toLowerCase().contains(lowerSearch)) ||
               (u.getEmail() != null && u.getEmail().toLowerCase().contains(lowerSearch)) ||
               (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(lowerSearch)) ||
               (u.getLastName() != null && u.getLastName().toLowerCase().contains(lowerSearch));
    }

    @Override
    public boolean existsByUsername(String username) {
        return findByUsername(username).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public long count() {
        return findAll().size();
    }

    @Override
    protected User toEntity(UserItem item) {
        var entity = new User();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        entity.setUsername(item.getUsername());
        entity.setEmail(item.getEmail());
        entity.setPassword(item.getPassword());
        entity.setFirstName(item.getFirstName());
        entity.setLastName(item.getLastName());
        if (item.getRole() != null) {
            entity.setRole(User.Role.valueOf(item.getRole()));
        }
        if (item.getEnabled() != null) {
            entity.setEnabled(item.getEnabled());
        }
        if (item.getAccountNonExpired() != null) {
            entity.setAccountNonExpired(item.getAccountNonExpired());
        }
        if (item.getAccountNonLocked() != null) {
            entity.setAccountNonLocked(item.getAccountNonLocked());
        }
        if (item.getCredentialsNonExpired() != null) {
            entity.setCredentialsNonExpired(item.getCredentialsNonExpired());
        }
        if (item.getEmailVerified() != null) {
            entity.setEmailVerified(item.getEmailVerified());
        }
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        if (item.getLastLogin() != null) {
            entity.setLastLogin(LocalDateTime.parse(item.getLastLogin(), ISO_FMT));
        }
        if (item.getFailedLoginAttempts() != null) {
            entity.setFailedLoginAttempts(item.getFailedLoginAttempts());
        }
        if (item.getLockedUntil() != null) {
            entity.setLockedUntil(LocalDateTime.parse(item.getLockedUntil(), ISO_FMT));
        }
        entity.setPasswordResetToken(item.getPasswordResetToken());
        if (item.getPasswordResetExpires() != null) {
            entity.setPasswordResetExpires(LocalDateTime.parse(item.getPasswordResetExpires(), ISO_FMT));
        }
        entity.setEmailVerificationToken(item.getEmailVerificationToken());
        if (item.getTwoFactorEnabled() != null) {
            entity.setTwoFactorEnabled(item.getTwoFactorEnabled());
        }
        entity.setTwoFactorSecret(item.getTwoFactorSecret());
        entity.setPhone(item.getPhone());
        entity.setLocation(item.getLocation());
        entity.setJobTitle(item.getJobTitle());
        entity.setDepartment(item.getDepartment());
        entity.setSsoProvider(item.getSsoProvider());
        entity.setSsoUserId(item.getSsoUserId());
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected UserItem toItem(User entity) {
        var item = new UserItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String createdAtStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(ISO_FMT) : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("USER#" + id);

        // GSI1: role index
        String role = entity.getRole() != null ? entity.getRole().name() : "APPLICANT";
        item.setGsi1pk("USER_ROLE#" + role);
        item.setGsi1sk("USER#" + createdAtStr);

        // GSI4: unique username
        item.setGsi4pk("USER_USERNAME#" + entity.getUsername());
        item.setGsi4sk("USER#" + id);

        // GSI5: unique email
        item.setGsi5pk("USER_EMAIL#" + entity.getEmail());
        item.setGsi5sk("USER#" + id);

        // GSI6: date range
        item.setGsi6pk("USER_CREATED#" + tenantId);
        item.setGsi6sk("USER#" + createdAtStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setUsername(entity.getUsername());
        item.setEmail(entity.getEmail());
        item.setPassword(entity.getPassword());
        item.setFirstName(entity.getFirstName());
        item.setLastName(entity.getLastName());
        item.setRole(role);
        item.setEnabled(entity.isEnabled());
        item.setAccountNonExpired(entity.isAccountNonExpired());
        item.setAccountNonLocked(entity.isAccountNonLocked());
        item.setCredentialsNonExpired(entity.isCredentialsNonExpired());
        item.setEmailVerified(entity.isEmailVerified());
        item.setCreatedAt(createdAtStr);
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        if (entity.getLastLogin() != null) {
            item.setLastLogin(entity.getLastLogin().format(ISO_FMT));
        }
        item.setFailedLoginAttempts(entity.getFailedLoginAttempts());
        if (entity.getLockedUntil() != null) {
            item.setLockedUntil(entity.getLockedUntil().format(ISO_FMT));
        }
        item.setPasswordResetToken(entity.getPasswordResetToken());
        if (entity.getPasswordResetExpires() != null) {
            item.setPasswordResetExpires(entity.getPasswordResetExpires().format(ISO_FMT));
        }
        item.setEmailVerificationToken(entity.getEmailVerificationToken());
        item.setTwoFactorEnabled(entity.isTwoFactorEnabled());
        item.setTwoFactorSecret(entity.getTwoFactorSecret());
        item.setPhone(entity.getPhone());
        item.setLocation(entity.getLocation());
        item.setJobTitle(entity.getJobTitle());
        item.setDepartment(entity.getDepartment());
        item.setSsoProvider(entity.getSsoProvider());
        item.setSsoUserId(entity.getSsoUserId());

        return item;
    }
}
