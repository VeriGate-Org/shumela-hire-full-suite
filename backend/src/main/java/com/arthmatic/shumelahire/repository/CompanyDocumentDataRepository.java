package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.CompanyDocument;
import com.arthmatic.shumelahire.entity.CompanyDocumentCategory;

import java.util.List;
import java.util.Optional;

public interface CompanyDocumentDataRepository {

    Optional<CompanyDocument> findById(String id);

    CompanyDocument save(CompanyDocument entity);

    void deleteById(String id);

    List<CompanyDocument> findAll();

    List<CompanyDocument> findPublished();

    List<CompanyDocument> findByCategory(CompanyDocumentCategory category);
}
