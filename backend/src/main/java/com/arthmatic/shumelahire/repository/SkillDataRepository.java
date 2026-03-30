package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Skill;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Skill entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaSkillDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoSkillRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 */
public interface SkillDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<Skill> findById(String id);

    Skill save(Skill entity);

    List<Skill> saveAll(List<Skill> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** All skills ordered by name ascending. */
    List<Skill> findAllOrderByName();

    /** Active skills ordered by name ascending. */
    List<Skill> findActiveOrderByName();

    /** Find a skill by its unique name. */
    Optional<Skill> findByName(String name);

    /** Find a skill by its unique code. */
    Optional<Skill> findByCode(String code);

    /** Check whether a skill with the given name already exists. */
    boolean existsByName(String name);

    /** Check whether a skill with the given code already exists. */
    boolean existsByCode(String code);

    /** Return just the names of all active skills, sorted alphabetically. */
    List<String> findActiveNames();

    /** Active skills filtered by category, ordered by name ascending. */
    List<Skill> findByCategoryAndActiveOrderByName(String category);
}
