package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.DocumentTemplate;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the DocumentTemplate entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaDocumentTemplateDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoDocumentTemplateRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface DocumentTemplateDataRepository {

    // ── CRUD ─────────────────────────────────────────────────────────────────

    Optional<DocumentTemplate> findById(String id);

    DocumentTemplate save(DocumentTemplate entity);

    List<DocumentTemplate> saveAll(List<DocumentTemplate> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // ── Domain-specific queries ──────────────────────────────────────────────

    /** Non-archived templates of a given type, ordered by creation date descending. */
    List<DocumentTemplate> findByTypeAndNotArchived(String type);

    /** All non-archived templates, ordered by creation date descending. */
    List<DocumentTemplate> findAllNotArchived();

    /** Find the default template for a given type (at most one expected). */
    Optional<DocumentTemplate> findDefaultByType(String type);

    /**
     * Filtered search with cursor-based pagination.
     *
     * @param search      optional search term (matched against name, case-insensitive)
     * @param type        optional type filter
     * @param showArchived when false, archived templates are excluded
     * @param cursor      opaque pagination cursor (null for first page)
     * @param pageSize    maximum number of results per page
     */
    CursorPage<DocumentTemplate> findWithFilters(String search, String type, boolean showArchived,
                                                  String cursor, int pageSize);

    /** Convenience overload that returns all matching templates without pagination. */
    default List<DocumentTemplate> findWithFilters(String search, String type, boolean showArchived) {
        return findWithFilters(search, type, showArchived, null, Integer.MAX_VALUE).content();
    }
}
