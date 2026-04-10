package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the User entity.
 * <p>
 * User implements {@link org.springframework.security.core.userdetails.UserDetails}
 * and has a {@code tenantId} field directly (it does NOT extend TenantAwareEntity).
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaUserDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoUserRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface UserDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<User> findById(String id);

    User save(User entity);

    List<User> saveAll(List<User> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Find a user by their unique username. */
    Optional<User> findByUsername(String username);

    /** Find a user by their unique email address. */
    Optional<User> findByEmail(String email);

    /** Find a user by email scoped to a specific tenant. */
    Optional<User> findByEmailAndTenantId(String email, String tenantId);

    /** Find all users with a given role. */
    List<User> findByRole(User.Role role);

    /**
     * Find users whose accounts are currently locked
     * (lockedUntil is in the future and accountNonLocked is false).
     */
    List<User> findLockedUsers();

    /** Find users created within a date range (inclusive). */
    List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Find users who have not logged in since the given cutoff date,
     * or who have never logged in.
     */
    List<User> findInactiveUsers(LocalDateTime cutoff);

    /** Count users with a specific role. */
    long countByRole(User.Role role);

    /**
     * Search users by a term that matches against username, email, firstName, or lastName.
     * Returns a cursor-based page.
     */
    CursorPage<User> findBySearchTerm(String search, String cursor, int pageSize);

    /** Check whether a user with the given username already exists. */
    boolean existsByUsername(String username);

    /** Check whether a user with the given email already exists. */
    boolean existsByEmail(String email);

    /** Return all users. */
    List<User> findAll();

    /** Count all users. */
    long count();
}
