package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;

import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the Document entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaDocumentDataRepository} -- delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoDocumentRepository} -- DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface DocumentDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<Document> findById(String id);

    Document save(Document entity);

    List<Document> saveAll(List<Document> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Domain-specific queries ----------------------------------------------

    /** Documents for a given applicant, newest first. */
    List<Document> findByApplicantIdOrderByUploadedAtDesc(String applicantId);

    /** Documents for a given applicant and type. */
    List<Document> findByApplicantIdAndType(String applicantId, DocumentType type);

    /** Documents linked to a given application. */
    List<Document> findByApplicationId(String applicationId);

    /** CV documents for a given applicant, newest first. */
    List<Document> findCvDocumentsByApplicant(String applicantId);

    /** Supporting documents for a given applicant, newest first. */
    List<Document> findSupportingDocumentsByApplicant(String applicantId);

    /** Count documents by applicant. */
    long countByApplicantId(String applicantId);

    /** Count documents by type. */
    long countByType(DocumentType type);

    /** Documents for a given applicant and application. */
    List<Document> findByApplicantIdAndApplicationId(String applicantId, String applicationId);

    /** Delete all documents for a given applicant. */
    void deleteByApplicantId(String applicantId);
}
