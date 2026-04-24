package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.DocumentRetentionPolicy;

import java.util.List;
import java.util.Optional;

public interface DocumentRetentionPolicyDataRepository {

    Optional<DocumentRetentionPolicy> findById(String id);

    DocumentRetentionPolicy save(DocumentRetentionPolicy entity);

    void deleteById(String id);

    List<DocumentRetentionPolicy> findAll();

    List<DocumentRetentionPolicy> findActive();

    Optional<DocumentRetentionPolicy> findByDocumentTypeCode(String documentTypeCode);
}
